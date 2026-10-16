// Web Push handlers, pulled into the Workbox-generated service worker via
// `workbox.importScripts` (vite.config.ts). Payload shape: server
// `PushPayload` in notification/web-push.service.ts.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    console.error("[push-sw] unreadable push payload:", err);
    return;
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // A visible tab already shows it (bell + toast over the socket); an OS
      // banner on top would be a duplicate.
      if (windows.some((w) => w.visibilityState === "visible")) return;

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        renotify: true,
        icon: "/icons/icon-192.png",
        badge: "/icons/favicon-96x96.png",
        data: { link: payload.link },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        // Client-side route change (usePushNavigation), no full reload.
        existing.postMessage({ type: "push-navigate", link });
        return;
      }
      await self.clients.openWindow(link);
    })(),
  );
});
