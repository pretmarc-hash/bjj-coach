const CACHE = 'bjj-coach-v19';
const FILES = ['./', './index.html', './styles.css?v=19', './stats.js?v=19', './core.js?v=19', './training.js?v=19', './plan.js?v=19', './notes.js?v=19', './gym.js?v=19', './nutri-data.js?v=19', './nutri.js?v=19', './views.js?v=19', './bjj2.js?v=19', './bjj3.js?v=19', './bjj4.js?v=19', './app.js?v=19', './lib-index.json', './lib-base.json', './lib-extra.json', './lib-fichas.json', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('bjj-coach-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return; // YouTube, Vimeo… los gestiona el navegador
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
