// Kill switch for the old Flutter web site's service worker (rvandrei.com before the 2026 redesign).
// Returning visitors still have it registered; on their next visit the browser re-fetches this URL,
// installs this version, which deletes the old Flutter caches and unregisters itself. Keep this file
// for a few months after the domain cutover (docs/LAUNCH.md), then delete it.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
    })(),
  );
});
