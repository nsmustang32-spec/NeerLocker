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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};

  // Reject Supabase webhook calls — app handles notifications manually to avoid doubles
  if (body.type === "INSERT" || body.type === "UPDATE" || body.type === "DELETE") {
    return res.status(200).json({ skip: "webhook calls ignored — app sends manually" });
  }

  // Manual call from app — must include title and body
  const { userId, title, body: msgBody, tag } = body;
  if (!title || !msgBody) return res.status(400).json({ error: "title and body required" });

  const subs = userId ? await getSubs(userId) : await getAllSubs();
  if (!subs?.length) return res.status(200).json({ sent: 0 });

  const result = await sendToSubs(subs, { title, body: msgBody, tag: tag || "neer-locker" });
  return res.status(200).json(result);
};
