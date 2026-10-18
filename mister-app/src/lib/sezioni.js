// Le quattro sezioni della navigazione e le loro schede. La sezione accesa si
// ricava dal primo segmento del percorso, così anche form e dettagli
// (/rosa/12, /partite/3/referto) accendono la sezione giusta.
export const SEZIONI = [
  { id: 'home', to: '/home', label: 'Home', schede: [] },
  {
    id: 'rosa',
    to: '/rosa',
    label: 'Rosa',
    schede: [
      { to: '/rosa', label: 'Giocatori' },
      { to: '/osservazione', label: 'Osservazione' },
      { to: '/intese', label: 'Intese' },
      { to: '/capitano', label: 'Capitano' },
    ],
  },
  {
    id: 'calendario',
    to: '/partite',
    label: 'Calendario',
    schede: [
      { to: '/partite', label: 'Partite' },
      { to: '/presenze', label: 'Sedute' },
      { to: '/storico', label: 'Statistiche' },
    ],
  },
  {
    id: 'tattica',
    to: '/modulo',
    label: 'Tattica',
    schede: [
      { to: '/modulo', label: 'Modulo' },
      { to: '/avversari', label: 'Avversari' },
      // il Quaderno ha due rotte (analisi e manuale): la scheda è una sola
      { to: '/analisi', label: 'Quaderno', anche: ['/manuale'] },
    ],
  },
]

const primoSegmento = (pathname) => `/${(pathname ?? '').split('/').filter(Boolean)[0] ?? ''}`

const percorsiScheda = (s) => [s.to, ...(s.anche ?? [])]

export function sezioneDi(pathname) {
  const seg = primoSegmento(pathname)
  return SEZIONI.find((sez) => sez.to === seg || sez.schede.some((s) => percorsiScheda(s).includes(seg))) ?? null
}

// La sottobarra compare solo sulle pagine principali delle schede, mai su
// form e dettagli: lì c'è il ‹ per tornare.
export function sottobarraDi(pathname) {
  const p = (pathname ?? '').replace(/\/+$/, '') || '/'
  const sez = sezioneDi(p)
  if (!sez) return null
  const attiva = sez.schede.find((s) => percorsiScheda(s).includes(p))
  return attiva ? { sezione: sez, attiva } : null
}
