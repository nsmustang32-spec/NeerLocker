const webpush = require("web-push");

const SUPABASE_URL = "https://ocpzvyjbuhznnhxsxlvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_CwxgKLPpmI6M9Fa_2xFNLQ_IbYDrTpq";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:nsmustang32@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getSubs(userId) {
  let url = `${SUPABASE_URL}/rest/v1/push_subscriptions`;
  if (userId) url += `?user_id=eq.${userId}`;
  const r = await fetch(url, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  return await r.json();
}

async function getAllSubs() {
  return await getSubs(null);
}

async function sendToSubs(subs, payload) {
  let sent = 0;
  const expired = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch(e) {
      if (e.statusCode === 404 || e.statusCode === 410) expired.push(sub.id);
    }
  }
  for (const id of expired) {
    await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${id}`, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
  }
  return { sent, expired: expired.length };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // ── New DM ────────────────────────────────────────────────────────────────
  if (body.type === "INSERT" && body.table === "direct_messages") {
    const record = body.record;
    if (!record || record.system) return res.status(200).json({ skip: "system message" });

    const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${record.from_id}`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const emps = await empRes.json();
    const senderName = emps?.[0]?.name || "Someone";

    const subs = await getSubs(record.to_id);
    if (!subs?.length) return res.status(200).json({ sent: 0 });

    const result = await sendToSubs(subs, {
      title: `Message from ${senderName} 💬`,
      body: record.text?.slice(0, 100) || "",
      tag: "dm"
    });
    return res.status(200).json(result);
  }

  // ── New Task ──────────────────────────────────────────────────────────────
  if (body.type === "INSERT" && body.table === "tasks") {
    const record = body.record;
    if (!record) return res.status(200).json({ skip: "no record" });

    let subs;
    if (record.assigned_to === "all") {
      // Send to everyone
      subs = await getAllSubs();
    } else {
      // Send to specific person
      subs = await getSubs(record.assigned_to);
    }
    if (!subs?.length) return res.status(200).json({ sent: 0 });

    const result = await sendToSubs(subs, {
      title: "New Task 📋",
      body: `${record.title}${record.priority ? ` · ${record.priority}` : ""}`,
      tag: "task"
    });
    return res.status(200).json(result);
  }

  // ── New Announcement ──────────────────────────────────────────────────────
  if (body.type === "INSERT" && body.table === "announcements") {
    const record = body.record;
    if (!record) return res.status(200).json({ skip: "no record" });

    // Send to everyone
    const subs = await getAllSubs();
    if (!subs?.length) return res.status(200).json({ sent: 0 });

    const result = await sendToSubs(subs, {
      title: `New Announcement 📢`,
      body: record.msg?.slice(0, 100) || "",
      tag: "announcement"
    });
    return res.status(200).json(result);
  }

  // ── Manual call from app ──────────────────────────────────────────────────
  const { userId, title, body: msgBody, tag } = body;
  if (!title || !msgBody) return res.status(400).json({ error: "title and body required" });

  const subs = await getSubs(userId);
  if (!subs?.length) return res.status(200).json({ sent: 0 });

  const result = await sendToSubs(subs, { title, body: msgBody, tag: tag || "neer-locker" });
  return res.status(200).json(result);
};
