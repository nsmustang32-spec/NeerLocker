// api/finn.js — Finn Aether cloud endpoint (CommonJS — works with any Vercel setup)

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY not set in Vercel environment variables" });

  const { messages, context } = req.body || {};
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid messages" });

  const user = context?.user;
  const tasks = context?.tasks || [];
  const inv = context?.inv || [];
  const anns = context?.anns || [];
  const emps = context?.emps || [];
  const dms = context?.dms || [];
  const progress = context?.progress || {};
  const now = new Date(context?.clientTime || Date.now());
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const myTasks = tasks.filter(t => !t.done && (t.assignedTo === "all" || t.assignedTo === user?.id));
  const overdue = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const unread = dms.filter(d => d.to === user?.id && !d.read);

  const systemPrompt = `You are Finn Aether, the AI assistant built into MNU's Neer Locker staff portal by Blyzty Technologies. Be helpful, friendly, and concise.

Time: ${timeStr} on ${dateStr}
User: ${user?.name || "Staff"} (${user?.role || "employee"})
Open tasks: ${myTasks.length} (${overdue.length} overdue)
Unread DMs: ${unread.length}
XP: ${progress?.xp || 0} | Streak: ${progress?.streak || 0} days
Team: ${emps.length} staff | Inventory: ${inv.length} items
Announcements: ${anns.filter(a => !a.dismissed?.includes(user?.id)).length} active

Action tags you can include in replies:
[NAV:pagename] — navigate (home/tasks/inv/anns/dms/leaderboard/act/set)
[COMPLETE_TASK:taskid] — mark task done
[CREATE_TASK:title|priority|assignee] — create task (managers only)
[OPEN_SHOP] — open XP shop

Keep replies short. Don't repeat time/date unless asked.`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 512,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12),
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => "");
      console.error("Groq error:", groqRes.status, errText);
      return res.status(groqRes.status).json({ error: `Groq API error ${groqRes.status}` });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ error: "Empty response from Groq" });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Finn handler error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
