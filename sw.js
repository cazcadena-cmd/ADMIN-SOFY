/* Service Worker - Administrador General Sofy App v2 */
const CACHE_NAME = 'admin-sofy-v2';
const ESTATICOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Instalación: precarga los archivos base */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ESTATICOS))
      .catch((err) => console.warn('Precarga parcial del caché:', err))
  );
});

/* Activación: limpia cachés viejos */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => clients.claim())
  );
});

/* Fetch:
   - Peticiones a Supabase (API/Storage): SIEMPRE red (datos frescos, nunca caché)
   - Resto (GET): red primero, caché como respaldo offline */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  if (url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && url.startsWith(self.location.origin)) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((r) => {
          if (r) return r;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
