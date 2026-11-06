// Imported by the generated service worker (vite.config.ts, workbox.importScripts).
// Tapping the rest-timer notification brings Mussel back to the workout.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/workout';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        return open.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w));
      }
      return self.clients.openWindow(url);
    }),
  );
});
