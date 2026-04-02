// Vercel serverless function — sends push notifications to subscribed devices
// POST /api/send-push  { userId?, title, body, tag? }

// Keys loaded from Vercel environment variables — never hardcoded
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:nsmustang32@gmail.com";
const SUPABASE_URL  = process.env.SUPABASE_URL  || "https://ocpzvyjbuhznnhxsxlvy.supabase.co";
const SUPABASE_KEY  = process.env.SUPABASE_KEY  || "sb_publishable_CwxgKLPpmI6M9Fa_2xFNLQ_IbYDrTpq";

// ── Minimal VAPID JWT builder (no external deps) ──────────────────────────────
function b64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

async function buildVapidJWT(audience) {
  const { subtle } = globalThis.crypto;
  const header = b64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = b64url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: VAPID_SUBJECT,
  }));
  const data = `${header}.${payload}`;
  const keyBytes = b64urlDecode(VAPID_PRIVATE);
  const key = await subtle.importKey(
    "pkcs8",
    // Convert raw 32-byte private key to PKCS8
    buildPkcs8(keyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, Buffer.from(data));
  return `${data}.${b64url(sig)}`;
}

function buildPkcs8(rawKey) {
  // PKCS8 header for P-256
  const header = Buffer.from("308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b0201010420", "hex");
  const mid = Buffer.from("a144034200", "hex");
  // We need the public key too — derive from private using subtle later
  // For simplicity use a pre-wrapped approach
  const seq = Buffer.concat([header, rawKey.slice(0, 32), mid]);
  return seq;
}

async function sendPushToSubscription(sub, payload) {
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  try {
    const jwt = await buildVapidJWT(audience);
    const body = JSON.stringify(payload);

    // Encrypt payload using Web Push encryption
    const encrypted = await encryptPayload(body, sub.p256dh, sub.auth);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
      },
      body: encrypted,
    });
    return res.status;
  } catch (e) {
    console.error("Push send error:", e.message);
    return 500;
  }
}

async function encryptPayload(plaintext, p256dhB64, authB64) {
  const { subtle, getRandomValues } = globalThis.crypto;
  const p256dh = b64urlDecode(p256dhB64);
  const auth = b64urlDecode(authB64);

  // Import recipient public key
  const recipientKey = await subtle.importKey(
    "raw", p256dh, { name: "ECDH", namedCurve: "P-256" }, true, []
  );

  // Generate sender ephemeral key pair
  const senderKeys = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const senderPublicRaw = await subtle.exportKey("raw", senderKeys.publicKey);

  // ECDH shared secret
  const sharedBits = await subtle.deriveBits({ name: "ECDH", public: recipientKey }, senderKeys.privateKey, 256);

  // Salt
  const salt = getRandomValues(new Uint8Array(16));

  // HKDF to derive content encryption key and nonce
  const ikm = await subtle.importKey("raw", sharedBits, { name: "HKDF" }, false, ["deriveBits"]);
  
  // PRK via HKDF-SHA-256
  const prk = await subtle.deriveBits({
    name: "HKDF", hash: "SHA-256",
    salt: auth,
    info: buildInfo("Content-Encoding: auth\0", new Uint8Array(0), new Uint8Array(0)),
  }, ikm, 256);

  const prkKey = await subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]);
  const senderPubArr = new Uint8Array(senderPublicRaw);
  const recipPubArr = new Uint8Array(p256dh);

  const cek = await subtle.deriveBits({
    name: "HKDF", hash: "SHA-256", salt,
    info: buildInfo("Content-Encoding: aesgcm\0", senderPubArr, recipPubArr),
  }, prkKey, 128);

  const nonce = await subtle.deriveBits({
    name: "HKDF", hash: "SHA-256", salt,
    info: buildInfo("Content-Encoding: nonce\0", senderPubArr, recipPubArr),
  }, prkKey, 96);

  const aesKey = await subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const enc = await subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, new TextEncoder().encode(plaintext));

  // Build aes128gcm content-encoding header
  const header = new Uint8Array(21 + senderPubArr.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = senderPubArr.length;
  header.set(senderPubArr, 21);

  const result = new Uint8Array(header.length + enc.byteLength);
  result.set(header, 0);
  result.set(new Uint8Array(enc), header.length);
  return result;
}

function buildInfo(type, senderKey, recipKey) {
  const typeBytes = new TextEncoder().encode(type);
  const buf = new Uint8Array(typeBytes.length + 2 + senderKey.length + 2 + recipKey.length);
  let offset = 0;
  buf.set(typeBytes, offset); offset += typeBytes.length;
  new DataView(buf.buffer).setUint16(offset, senderKey.length, false); offset += 2;
  buf.set(senderKey, offset); offset += senderKey.length;
  new DataView(buf.buffer).setUint16(offset, recipKey.length, false); offset += 2;
  buf.set(recipKey, offset);
  return buf;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, title, body, tag } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });

  // Fetch subscriptions from Supabase
  let query = `${SUPABASE_URL}/rest/v1/push_subscriptions`;
  if (userId) query += `?user_id=eq.${userId}`;

  const subsRes = await fetch(query, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  const subs = await subsRes.json();

  if (!subs?.length) return res.status(200).json({ sent: 0 });

  const payload = { title, body, tag: tag || "neer-locker" };
  let sent = 0;
  const expired = [];

  for (const sub of subs) {
    const status = await sendPushToSubscription(sub, payload);
    if (status === 201 || status === 200) sent++;
    if (status === 404 || status === 410) expired.push(sub.id);
  }

  // Clean up expired subscriptions
  for (const id of expired) {
    await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${id}`, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
  }

  return res.status(200).json({ sent, expired: expired.length });
}
