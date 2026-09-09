// Helper puri sulle partite (M3). Le date sono stringhe ISO "YYYY-MM-DD":
// confrontabili lessicograficamente, così niente fusi orari di mezzo.

export const oggiISO = () => new Date().toISOString().slice(0, 10)

// Una partita è "giocata" quando ha entrambi i risultati compilati.
// 0-0 è un risultato valido: conta il tipo, non la verità del numero.
export function partitaGiocata(m) {
  return Number.isFinite(m?.golFatti) && Number.isFinite(m?.golSubiti)
}

// 'V' | 'N' | 'P' — null se il risultato non c'è ancora
export function esitoPartita(m) {
  if (!partitaGiocata(m)) return null
  if (m.golFatti > m.golSubiti) return 'V'
  if (m.golFatti < m.golSubiti) return 'P'
  return 'N'
}

export const ESITO_INFO = {
  V: { label: 'Vittoria', badge: 'badge-ok' },
  N: { label: 'Pareggio', badge: 'badge-warn' },
  P: { label: 'Sconfitta', badge: 'badge-danger' },
}

// Ordinamento cronologico: a parità di giorno decide l'ora, se c'è.
const chiave = (m) => `${m.data ?? ''} ${m.ora ?? ''}`

export const perDataCrescente = (a, b) => chiave(a).localeCompare(chiave(b))
export const perDataDecrescente = (a, b) => chiave(b).localeCompare(chiave(a))

// In calendario: da oggi in avanti, ordine crescente (la più vicina per prima).
// Una partita di ieri senza risultato resta nello storico, non risale in cima:
// va compilata, non aspettata.
export function partiteInProgramma(partite, oggi = oggiISO()) {
  return partite.filter((m) => (m.data ?? '') >= oggi).sort(perDataCrescente)
}

// Archivio: tutto ciò che non è in programma, dalla più recente.
export function partiteGiocate(partite, oggi = oggiISO()) {
  return partite.filter((m) => (m.data ?? '') < oggi).sort(perDataDecrescente)
}

export function prossimaPartita(partite, oggi = oggiISO()) {
  return partiteInProgramma(partite, oggi)[0] ?? null
}

// Bilancio su un insieme di partite: conta solo quelle con risultato.
export function bilancio(partite) {
  const b = { giocate: 0, vinte: 0, pari: 0, perse: 0, golFatti: 0, golSubiti: 0 }
  for (const m of partite) {
    const esito = esitoPartita(m)
    if (!esito) continue
    b.giocate += 1
    if (esito === 'V') b.vinte += 1
    else if (esito === 'N') b.pari += 1
    else b.perse += 1
    b.golFatti += m.golFatti
    b.golSubiti += m.golSubiti
  }
  return b
}

const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

// "sab 12 ott" — compatto, per le card di lista
export function formatDataPartita(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (Number.isNaN(dt.getTime())) return iso
  return `${GIORNI[dt.getDay()]} ${d} ${MESI[m - 1]}`
}

// "Oggi" / "Domani" / "tra 5 giorni" / "3 giorni fa"
export function quandoPartita(iso, oggi = oggiISO()) {
  if (!iso) return ''
  const giorni = Math.round((Date.parse(iso) - Date.parse(oggi)) / 86400000)
  if (Number.isNaN(giorni)) return ''
  if (giorni === 0) return 'Oggi'
  if (giorni === 1) return 'Domani'
  if (giorni === -1) return 'Ieri'
  return giorni > 0 ? `tra ${giorni} giorni` : `${-giorni} giorni fa`
}

// Scontri diretti con una squadra, dalla più recente: la memoria del girone.
export function partiteContro(partite, opponentId) {
  if (opponentId == null) return []
  return partite.filter((m) => m.opponentId === opponentId).sort(perDataDecrescente)
}
