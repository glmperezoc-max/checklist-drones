// Service worker: guarda la app en el teléfono para que abra sin internet.
// Con internet trae siempre la versión nueva (red primero); sin internet usa la guardada.
const CACHE = 'drones-v9';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // el envío a Google no pasa por aquí
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 4000); // señal débil: máx 4 s
      const r = await fetch(e.request, {cache: 'no-store', signal: ctl.signal});
      clearTimeout(to);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch {
      return (await c.match(e.request, {ignoreSearch: true})) || (await c.match('./index.html'));
    }
  })());
});
