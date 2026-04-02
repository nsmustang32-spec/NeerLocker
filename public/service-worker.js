// Neer Locker Service Worker — handles background push notifications

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});

self.addEventListener("push", e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = { title: "Neer Locker", body: e.data.text() }; }

  const title = data.title || "Neer Locker";
  const options = {
    body: data.body || "",
    icon: "/apple-touch-icon.png",
    badge: "/icon-96.png",
    tag: data.tag || "neer-locker",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url) && "focus" in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
