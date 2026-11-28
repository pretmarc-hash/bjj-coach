const CACHE = 'bjj-coach-v26';
const FILES = ['./', './index.html', './styles.css?v=26', './stats.js?v=26', './core.js?v=26', './training.js?v=26', './plan.js?v=26', './notes.js?v=26', './gym.js?v=26', './nutri-data.js?v=26', './nutri.js?v=26', './views.js?v=26', './bjj2.js?v=26', './bjj3.js?v=26', './bjj4.js?v=26', './bjj5.js?v=26', './app.js?v=26', './lib-index.json', './lib-base.json', './lib-extra.json', './lib-fichas.json', './manifest.webmanifest', './icon.svg'];

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
