// Service worker: cache stale-while-revalidate per l'uso offline.
// Risponde subito dalla cache e aggiorna in background: dopo un deploy
// la versione nuova arriva alla seconda apertura.
const CACHE = 'mister-app-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || fetched
    })
  )
})
