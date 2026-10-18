import { useEffect, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { applicaTema, temaLocale, QUERY_SCURO } from '../theme/tema'

const iscrivi = (cb) => {
  const m = window.matchMedia?.(QUERY_SCURO)
  m?.addEventListener('change', cb)
  return () => m?.removeEventListener('change', cb)
}
const scuroDiSistema = () => window.matchMedia?.(QUERY_SCURO).matches ?? true

// Tiene il tema applicato: la scelta sta in db.meta 'tema' (così va nel
// backup), il modo "Sistema" segue prefers-color-scheme anche se cambia
// mentre l'app è aperta. Finché Dexie non risponde vale la copia locale.
export default function useTema() {
  const riga = useLiveQuery(() => db.meta.get('tema').then((t) => t ?? null), [])
  const scuro = useSyncExternalStore(iscrivi, scuroDiSistema, () => true)
  const tema = riga === undefined ? temaLocale() : riga?.value ?? temaLocale()

  useEffect(() => {
    applicaTema(tema, scuro)
  }, [tema.palette, tema.modo, scuro]) // eslint-disable-line react-hooks/exhaustive-deps
}

export const salvaTema = (tema) => db.meta.put({ key: 'tema', value: tema })
