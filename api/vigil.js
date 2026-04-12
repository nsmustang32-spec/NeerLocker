// ╔══════════════════════════════════════════════════════════════════╗
// ║  VIGIL HYPERCORE v2.0.0 — SERVER LAYER                   ║
// ║  Vercel serverless function: /api/vigil/[action]                ║
// ║  ALL enforcement lives here. Client is untrusted.               ║
// ╚══════════════════════════════════════════════════════════════════╝

const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // SERVICE KEY — not the publishable one
);

const JWT_SECRET          = process.env.VIGIL_JWT_SECRET;
const JWT_EXPIRES_IN      = "15m";   // access token short-lived
const REFRESH_EXPIRES_IN  = "7d";    // refresh token
const MAX_ATTEMPTS        = 5;
const LOCKOUT_MINUTES     = 15;
const FINN_RATE_LIMIT_MS  = 1500;    // per user, tracked in DB

// ── Role-based session timeouts ───────────────────────────────────────────
const SESSION_TIMEOUTS = {
  boss: 4 * 3600,       // 4 hours in seconds
  manager: 2 * 3600,    // 2 hours
  assistant: 3600,      // 1 hour
  employee: 1800,       // 30 minutes
  superadmin: 8 * 3600, // 8 hours
};

// ── Threat scoring weights ────────────────────────────────────────────────
const THREAT_WEIGHTS = {
  failed_pin:       15,
  account_locked:   30,
  injection:        40,
  anomaly_hour:     10,
  anomaly_device:   20,
  rate_exceeded:    10,
  shadow_banned:   100,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.headers["x-real-ip"]
    || req.socket?.remoteAddress
    || "unknown";
}

async function logEvent(userId, type, detail, metadata = {}) {
  await supabase.from("vigil_logs").insert({
    user_id:    userId || null,
    type,
    detail:     detail?.slice(0, 500),
    metadata,
    created_at: new Date().toISOString(),
  });
}

async function updateThreatScore(userId, eventType) {
  const weight = THREAT_WEIGHTS[eventType] || 0;
  if (!weight || !userId) return;
  // Increment threat score, cap at 100
  await supabase.rpc("increment_threat_score", {
    p_user_id: userId,
    p_amount:  weight,
  });
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: "access" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: "refresh" },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch (e) { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const handlers = {

  // ── POST /api/vigil/login ─────────────────────────────────────────────────
  login: async (req, res) => {
    const { email, pin, fingerprint, ts } = req.body;
    const ip = getIP(req);

    // Timestamp freshness check (reject requests older than 30s)
    if (!ts || Date.now() - ts > 30000) {
      return res.status(400).json({ error: "Request expired" });
    }

    if (!email || !pin) {
      return res.status(400).json({ error: "Email and PIN required" });
    }

    // Fetch employee
    const { data: emp } = await supabase
      .from("employees")
      .select("id,email,name,role,pin_hash,failed_attempts,lockout_until,threat_score,shadow_banned")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!emp) {
      // Don't reveal whether email exists
      await new Promise(r => setTimeout(r, 200 + Math.random() * 100)); // timing attack prevention
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Shadow ban check (silently fail after delay)
    if (emp.shadow_banned) {
      await logEvent(emp.id, "shadow_banned_attempt", ip, { ip, fingerprint });
      await new Promise(r => setTimeout(r, 500));
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Lockout check
    if (emp.lockout_until && new Date(emp.lockout_until) > new Date()) {
      const minsLeft = Math.ceil((new Date(emp.lockout_until) - new Date()) / 60000);
      await logEvent(emp.id, "lockout_blocked", ip, { ip, fingerprint });
      return res.status(429).json({
        error: `Account locked. Try again in ${minsLeft} minute${minsLeft !== 1 ? "s" : ""}.`,
        lockedUntil: emp.lockout_until,
      });
    }

    // Verify PIN with bcrypt
    const pinOk = await bcrypt.compare(pin, emp.pin_hash);

    if (!pinOk) {
      const attempts = (emp.failed_attempts || 0) + 1;
      const isLocked = attempts >= MAX_ATTEMPTS;
      const lockoutUntil = isLocked
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
        : null;

      await supabase.from("employees").update({
        failed_attempts: attempts,
        lockout_until: lockoutUntil,
      }).eq("id", emp.id);

      await logEvent(emp.id, "failed_pin", ip, { ip, fingerprint, attempts });
      await updateThreatScore(emp.id, "failed_pin");
      if (isLocked) {
        await logEvent(emp.id, "account_locked", ip, { ip, fingerprint });
        await updateThreatScore(emp.id, "account_locked");
      }

      return res.status(401).json({
        error: isLocked
          ? `Account locked for ${LOCKOUT_MINUTES} minutes.`
          : `Wrong PIN. ${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} left.`,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
        locked: isLocked,
      });
    }

    // Success — reset attempts, update last login
    await supabase.from("employees").update({
      failed_attempts: 0,
      lockout_until: null,
      last_login: new Date().toISOString(),
      last_fingerprint: fingerprint,
      last_ip: ip,
    }).eq("id", emp.id);

    // Anomaly detection
    const anomalies = [];
    const hour = new Date().getHours();
    if (hour >= 1 && hour < 5) anomalies.push("unusual_hour");
    if (emp.last_fingerprint && emp.last_fingerprint !== fingerprint) anomalies.push("new_device");

    if (anomalies.length > 0) {
      await logEvent(emp.id, "anomaly", anomalies.join(","), { ip, fingerprint, anomalies });
      for (const a of anomalies) await updateThreatScore(emp.id, `anomaly_${a.split("_")[1]}`);
    }

    await logEvent(emp.id, "login_success", ip, { ip, fingerprint, anomalies });

    // Issue tokens
    const user = { id: emp.id, email: emp.email, name: emp.name, role: emp.role };
    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const expiresIn    = SESSION_TIMEOUTS[emp.role] || SESSION_TIMEOUTS.employee;

    // Store refresh token in DB (server-side session)
    await supabase.from("vigil_sessions").insert({
      user_id:       emp.id,
      refresh_token: await bcrypt.hash(refreshToken, 10),
      fingerprint,
      ip,
      expires_at:    new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      created_at:    new Date().toISOString(),
    });

    return res.status(200).json({
      user,
      sessionToken: accessToken,
      refreshToken,
      expiresIn,
      anomalies,
      threatScore: emp.threat_score || 0,
    });
  },

  // ── POST /api/vigil/validate-session ─────────────────────────────────────
  "validate-session": async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, error: "No session" });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload || payload.type !== "access") {
      return res.status(401).json({ ok: false, error: "Invalid or expired session", clearSession: true });
    }
    // Fetch fresh user data
    const { data: emp } = await supabase
      .from("employees")
      .select("id,email,name,role,threat_score,shadow_banned,lockout_until")
      .eq("id", payload.sub)
      .single();

    if (!emp || emp.shadow_banned) {
      return res.status(401).json({ ok: false, clearSession: true });
    }
    if (emp.lockout_until && new Date(emp.lockout_until) > new Date()) {
      return res.status(401).json({ ok: false, error: "Account locked", clearSession: true });
    }

    // Issue fresh access token if expiring soon (< 3 min left)
    const exp = payload.exp * 1000;
    let newToken = undefined;
    if (exp - Date.now() < 3 * 60000) {
      newToken = signAccessToken({ id: emp.id, email: emp.email, name: emp.name, role: emp.role });
    }

    return res.status(200).json({
      ok: true,
      user: { id: emp.id, email: emp.email, name: emp.name, role: emp.role },
      threatScore: emp.threat_score || 0,
      ...(newToken ? { sessionToken: newToken } : {}),
    });
  },

  // ── POST /api/vigil/logout ────────────────────────────────────────────────
  logout: async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      if (payload?.sub) {
        // Invalidate all sessions for this user
        await supabase.from("vigil_sessions")
          .delete()
          .eq("user_id", payload.sub);
        await logEvent(payload.sub, "logout", getIP(req));
      }
    }
    return res.status(200).json({ ok: true, clearSession: true });
  },

  // ── POST /api/vigil/finn-rate ─────────────────────────────────────────────
  "finn-rate": async (req, res) => {
    const authHeader = req.headers.authorization;
    const payload = authHeader ? verifyToken(authHeader.slice(7)) : null;
    if (!payload) return res.status(401).json({ allowed: false, reason: "unauthenticated" });

    const userId = payload.sub;
    const ip = getIP(req);
    const key = `finn_rate_${userId}`;

    // Check rate in DB
    const { data: rateData } = await supabase
      .from("vigil_rate_limits")
      .select("last_message, count")
      .eq("key", key)
      .single();

    const now = Date.now();
    const last = rateData?.last_message ? new Date(rateData.last_message).getTime() : 0;
    const elapsed = now - last;

    if (elapsed < FINN_RATE_LIMIT_MS) {
      await logEvent(userId, "rate_exceeded", `finn:${elapsed}ms`, { ip });
      await updateThreatScore(userId, "rate_exceeded");
      return res.status(429).json({
        allowed: false,
        reason: "rate_limited",
        retryAfterMs: FINN_RATE_LIMIT_MS - elapsed,
      });
    }

    // Update rate
    await supabase.from("vigil_rate_limits").upsert({
      key,
      user_id: userId,
      last_message: new Date().toISOString(),
      count: (rateData?.count || 0) + 1,
    });

    return res.status(200).json({ allowed: true });
  },

  // ── POST /api/vigil/injection ─────────────────────────────────────────────
  injection: async (req, res) => {
    const { text, userId, fingerprint } = req.body;
    const ip = getIP(req);
    await logEvent(userId, "injection", text?.slice(0, 200), { ip, fingerprint });
    await updateThreatScore(userId, "injection");
    // Check if threat score now exceeds auto-lock threshold
    const { data: emp } = await supabase
      .from("employees")
      .select("threat_score")
      .eq("id", userId)
      .single();
    if (emp?.threat_score >= 80) {
      await supabase.from("employees")
        .update({ lockout_until: new Date(Date.now() + 60 * 60000).toISOString() })
        .eq("id", userId);
      await logEvent(userId, "auto_locked", "threat_score_exceeded", { score: emp.threat_score });
    }
    return res.status(200).json({ ok: true });
  },

  // ── POST /api/vigil/anomaly ───────────────────────────────────────────────
  anomaly: async (req, res) => {
    const authHeader = req.headers.authorization;
    const payload = authHeader ? verifyToken(authHeader.slice(7)) : null;
    const { type, detail, fingerprint } = req.body;
    const ip = getIP(req);
    const userId = payload?.sub;
    await logEvent(userId, `anomaly_${type}`, detail, { ip, fingerprint });
    if (userId) await updateThreatScore(userId, `anomaly_${type.split("_")[0]}`);
    return res.status(200).json({ ok: true });
  },

  // ── POST /api/vigil/dashboard ─────────────────────────────────────────────
  dashboard: async (req, res) => {
    const authHeader = req.headers.authorization;
    const payload = authHeader ? verifyToken(authHeader.slice(7)) : null;
    if (!payload || !["boss", "superadmin"].includes(payload.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [logs, locked, scores] = await Promise.all([
      supabase.from("vigil_logs").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("employees").select("id,name,email,lockout_until,threat_score").not("lockout_until", "is", null).gt("lockout_until", new Date().toISOString()),
      supabase.from("employees").select("id,name,email,threat_score").gt("threat_score", 20).order("threat_score", { ascending: false }).limit(10),
    ]);

    const events = logs.data || [];
    const stats = {
      logins:     events.filter(e => e.type === "login_success").length,
      failedPins: events.filter(e => e.type === "failed_pin").length,
      lockouts:   events.filter(e => e.type === "account_locked").length,
      anomalies:  events.filter(e => e.type.startsWith("anomaly")).length,
      injections: events.filter(e => e.type === "injection").length,
      autoLocks:  events.filter(e => e.type === "auto_locked").length,
    };

    return res.status(200).json({
      stats,
      recentEvents:   events,
      lockedAccounts: locked.data || [],
      threatScores:   scores.data || [],
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://neer-locker.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Extract action from URL: /api/vigil/login → "login"
  const action = req.url.split("/").pop().split("?")[0];
  const handler = handlers[action];

  if (!handler) return res.status(404).json({ error: `Unknown action: ${action}` });

  try {
    return await handler(req, res);
  } catch (err) {
    console.error(`Vigil [${action}] error:`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
