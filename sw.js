const CACHE_NAME = 'admin-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
// Evento de instalación: guarda los archivos esenciales en la memoria caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de activación: elimina versiones antiguas de la caché si actualizas la PWA
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento fetch: intenta obtener los datos de la red primero, y si no hay internet, recurre a la caché
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que sean hacia la API de Supabase para tener datos siempre actualizados
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
