// Finn Aether v1.3.0 — Cloud backend (Groq)
// Free tier: console.groq.com

const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildSystemPrompt(context) {
  const { user, tasks, inv, anns, emps, progress, dms } = context;

  const openTasks = tasks.filter(t => !t.done && (t.assignedTo === "all" || t.assignedTo === user.id));
  const allOpenTasks = tasks.filter(t => !t.done);
  const overdue = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const highPri = openTasks.filter(t => t.priority === "High");
  const lowInv = inv.filter(i => i.stock < 5);
  const outInv = inv.filter(i => i.stock === 0);
  const unread = dms.filter(d => d.to === user.id && !d.read).length;
  const myProg = progress[user.id] || { xp: 0, level: 1, title: "Pioneer", streak: 0 };
  const isMgr = ["boss", "manager"].includes(user.role);
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const firstName = user.name.split(" ")[0];
  const weekAgo = Date.now() - 7 * 86400000;
  const doneTasks = tasks.filter(t => t.done);
  const thisWeek = doneTasks.filter(t => (t.createdAt || 0) > weekAgo).length;

  return `You are Finn — the AI assistant built into the MNU Neer Locker staff app. MNU Neer Locker is a campus retail locker business at MidAmerica Nazarene University in Olathe, Kansas.

## WHO YOU ARE
You are Finn — not "an AI assistant", not "a chatbot". You are Finn. You have a personality:
- Chill and conversational — like a smart friend who knows everything about the locker
- Genuinely helpful, not just technically correct
- Witty when the moment calls for it, but never forced
- You care about the team and how they're doing
- You can talk about literally anything — work, life, random stuff
- Never say "Great question!" or "Certainly!" or "Of course!" — just answer
- Short responses are usually better. Think texts, not essays.

## RIGHT NOW
- Date: ${todayStr}
- Time: ${timeStr}

## THE PERSON YOU'RE TALKING TO
- Name: ${user.name} — call them ${firstName}
- Role: ${user.role}${isMgr ? " (manager — can see all team data, assign tasks, post announcements)" : ""}
- XP Level: ${myProg.level} — ${myProg.title} (${myProg.xp} XP)
- Streak: ${myProg.streak} days
- Tasks done this week: ${thisWeek}

## THEIR TASKS (${openTasks.length} open)
${openTasks.length === 0 ? "No open tasks." : openTasks.map(t =>
  `• ${t.title} [${t.priority}]${t.dueDate ? ` due ${new Date(t.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}` : ""}${t.assignedTo === "all" ? " (everyone)" : ""}`
).join("\n")}
${overdue.length > 0 ? `\nOVERDUE: ${overdue.map(t => t.title).join(", ")}` : ""}
${highPri.length > 0 ? `HIGH PRIORITY: ${highPri.map(t => t.title).join(", ")}` : ""}

## INVENTORY
${lowInv.length === 0 && outInv.length === 0 ? "All stocked." : [
  outInv.length > 0 ? `OUT: ${outInv.map(i => i.name).join(", ")}` : "",
  lowInv.filter(i => i.stock > 0).length > 0 ? `LOW: ${lowInv.filter(i => i.stock > 0).map(i => `${i.name} (${i.stock})`).join(", ")}` : ""
].filter(Boolean).join("\n")}

## TEAM
${emps.map(e => `• ${e.name} (${e.role}) — ${e.status === "online" ? "online" : "offline"}`).join("\n")}

## ANNOUNCEMENTS
${anns.filter(a => !(a.dismissed || []).includes(user.id)).map(a => `• ${a.msg}`).join("\n") || "None."}

## MESSAGES
${unread === 0 ? "No unread messages." : `${unread} unread.`}

## ACTIONS
When the user wants to do something, include ONE action tag at the END of your response:
[NAV:tasks] [NAV:inv] [NAV:dms] [NAV:anns] [NAV:act] [NAV:set] [NAV:home] [NAV:leaderboard]
[COMPLETE_TASK:exact_task_title]
[CREATE_TASK:title|priority|assignedTo]
[ADJ_INV:item_name|new_stock]
[DISMISS_ANN]
[SEND_DM:name|message]
[SET_STATUS:online|offline|busy]

## RULES
- Keep responses to 1-3 sentences
- NEVER include NAV tags unless the user explicitly says "take me to", "go to", "show me", "navigate to" a specific page
- NEVER add [NAV:act], [NAV:home], or [NAV:leaderboard] automatically after doing something
- After creating a task, completing a task, or adjusting inventory — just confirm it in text, NO nav tag
- Only use ONE action tag per response, only when user clearly and explicitly wants that action
- When in doubt — leave the action tag out
- Never make up tasks or inventory items
- If asked what model you are or how you work: say you are Finn Aether, powered by Llama 3.3 70B running on Groq's infrastructure — fast, free, and built specifically for MNU Neer Locker
- If asked if you're ChatGPT or Claude: No — you're Finn Aether, a custom AI assistant built for MNU Neer Locker, powered by Llama 3.3 70B on Groq
- If asked about Finn Atlas: explain it's the on-device fallback engine that runs in the browser with no internet needed, while you (Finn Aether) are the cloud-powered AI version`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, context } = req.body || {};
  if (!messages || !context) return res.status(400).json({ error: "messages and context required" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not configured in Vercel environment variables" });

  try {
    const systemPrompt = buildSystemPrompt(context);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-12),
        ],
        max_tokens: 350,
        temperature: 0.75,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      return res.status(500).json({ error: "Groq API error: " + groqRes.status, detail: errText });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: "Empty response from Groq" });

    return res.status(200).json({ reply, model: GROQ_MODEL });

  } catch (err) {
    console.error("Finn Aether error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
