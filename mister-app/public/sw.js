// Service worker per l'uso offline.
//
// Due strategie diverse, per un motivo preciso:
//
// - il DOCUMENTO (index.html) va preso dalla rete quando c'è. Serve perché
//   ogni build genera nomi di file nuovi per JS e CSS: un index.html vecchio
//   servito dalla cache chiede file che sul server non esistono più, e se nel
//   frattempo la cache li ha buttati via il risultato è una schermata nera.
//   La cache resta come rete di sicurezza quando si è offline.
//
// - gli ASSET con hash nel nome (JS, CSS, immagini) sono immutabili: lì la
//   cache è sempre giusta e si risponde subito, aggiornando in background.
const CACHE = 'mister-app-v2'

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

const isDocumento = (request) =>
  request.mode === 'navigate' || request.destination === 'document'

async function retePrima(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    throw new Error('offline e nessuna copia in cache')
  }
}

async function cachePrima(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const dallaRete = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || dallaRete
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  event.respondWith(isDocumento(request) ? retePrima(request) : cachePrima(request))
})
