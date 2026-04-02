import webpush from "web-push";

const SUPABASE_URL = "https://ocpzvyjbuhznnhxsxlvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_CwxgKLPpmI6M9Fa_2xFNLQ_IbYDrTpq";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:nsmustang32@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, title, body, tag } = req.body || {};
  if (!title || !body) {
    return res.status(400).json({ error: "title and body required" });
  }

  // Fetch subscriptions from Supabase
  let url = `${SUPABASE_URL}/rest/v1/push_subscriptions`;
  if (userId) url += `?user_id=eq.${userId}`;

  const subsRes = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  const subs = await subsRes.json();

  if (!subs?.length) return res.status(200).json({ sent: 0 });

  const payload = JSON.stringify({ title, body, tag: tag || "neer-locker" });
  let sent = 0;
  const expired = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        payload
      );
      sent++;
    } catch (e) {
      console.error("Push error:", e.statusCode, e.message);
      if (e.statusCode === 404 || e.statusCode === 410) {
        expired.push(sub.id);
      }
    }
  }

  // Clean up expired subscriptions
  for (const id of expired) {
    await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
  }

  return res.status(200).json({ sent, expired: expired.length });
}
