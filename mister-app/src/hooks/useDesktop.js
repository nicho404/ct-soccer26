import { useSyncExternalStore } from 'react'

// Da 1024px in su l'app ha il menu laterale e le pagine elenco/dettaglio
// affiancate. Stessa soglia della media query in index.css.
const QUERY = '(min-width: 1024px)'

const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null)

const iscrivi = (cb) => {
  const m = media()
  m?.addEventListener('change', cb)
  return () => m?.removeEventListener('change', cb)
}

export default function useDesktop() {
  return useSyncExternalStore(iscrivi, () => media()?.matches ?? false, () => false)
}
