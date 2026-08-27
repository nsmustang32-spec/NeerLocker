// api/finn.js — Finn Aether cloud endpoint
// Deploy this to /api/finn.js in your GitHub repo (Vercel serverless function)
// Set GROQ_API_KEY in Vercel environment variables

export default async function handler(req, res) {
  // ── CORS — allow both the custom domain and Vercel preview URLs ──────────────
  const allowedOrigins = [
    "https://neerlocker.online",
    "https://www.neerlocker.online",
    "https://neer-locker.vercel.app",
  ];
  const origin = req.headers.origin || "";
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
  res.setHeader("Access-Control-Allow-Origin", isAllowed ? origin : allowedOrigins[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured in Vercel environment variables" });
  }

  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  // Build system prompt from context
  const now = new Date(context?.clientTime || Date.now());
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const tz = context?.timezone || "America/Chicago";

  const user = context?.user;
  const tasks = context?.tasks || [];
  const inv = context?.inv || [];
  const anns = context?.anns || [];
  const emps = context?.emps || [];
  const dms = context?.dms || [];
  const progress = context?.progress || {};

  const openTasks = tasks.filter(t => !t.done);
  const myTasks = openTasks.filter(t => t.assignedTo === "all" || t.assignedTo === user?.id);
  const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const unreadDMs = dms.filter(d => d.to === user?.id && !d.read);

  const systemPrompt = `You are Finn Aether, the AI assistant built into MNU's Neer Locker staff portal by Blyzty Technologies. You are helpful, friendly, and concise. You know everything about this shift — tasks, inventory, team members, and announcements.

Current time: ${timeStr} on ${dateStr} (${tz})
User: ${user?.name || "Staff"} (${user?.role || "employee"})
Open tasks: ${myTasks.length} (${overdueTasks.length} overdue)
Unread messages: ${unreadDMs.length}
XP: ${progress?.xp || 0} | Streak: ${progress?.streak || 0} days
Team size: ${emps.length} staff
Inventory items: ${inv.length}
Active announcements: ${anns.filter(a => !a.dismissed?.includes(user?.id)).length}

You can use action tags in your reply to control the app:
- [NAV:pagename] — navigate to a page (home, tasks, inv, anns, dms, leaderboard, act, set)
- [COMPLETE_TASK:taskid] — mark a task as done
- [CREATE_TASK:title|priority|assignee] — create a new task (managers only)
- [OPEN_SHOP] — open the XP shop

Keep replies short and conversational. Use the user's name occasionally. Don't repeat the current time or date unless asked. If asked about your model or how you work, say you're Finn Aether and can't share technical details.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",   // Current stable Groq model (Aug 2026)
        max_tokens: 512,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12), // last 12 messages for context window efficiency
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let errJson = {};
      try { errJson = JSON.parse(errText); } catch {}
      console.error("Groq API error:", response.status, errJson);
      return res.status(response.status).json({
        error: errJson?.error?.message || `Groq API error ${response.status}`,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: "Empty response from Groq" });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Finn Aether handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
