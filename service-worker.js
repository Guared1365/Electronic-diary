// ============================================================
// Service Worker для офлайн-работы
// Версия кэша — меняй при обновлении файлов!
// ============================================================
const CACHE_VERSION = 'diary-v8-4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Установка — кэшируем основные файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Не удалось закэшировать всё:', err);
      });
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Стратегия: cache-first, с обновлением в фоне (stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Не кэшируем чужие домены (защита от трекинга)
  if (url.origin !== self.location.origin) return;

  // Не кэшируем не-GET запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(c => c.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // офлайн — отдаём кэш

      return cached || fetchPromise;
    })
  );
});
