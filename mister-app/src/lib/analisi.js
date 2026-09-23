// Analisi del mister (M12). Una riga di `analisi`:
// { id, data (ISO), titolo, contesto, sintesi,
//   puntiChiave: [{ tipo: 'forza'|'problema'|'novita', testo }],
//   obiettivi: [{ testo, fatto }],
//   sezioni: [{ titolo, punti: [string] }],
//   fonte }
// In Home va la più recente: poche righe da rileggere prima di ogni gara.
import { formatDataPartita } from './partite'

export const TIPI_PUNTO = [
  { value: 'problema', label: 'Da risolvere', icona: '⚠️' },
  { value: 'forza', label: 'Funziona', icona: '✅' },
  { value: 'novita', label: 'Novità', icona: '💡' },
]

export const tipoPuntoInfo = (tipo) => TIPI_PUNTO.find((t) => t.value === tipo) ?? TIPI_PUNTO[2]

// Righe vecchie o importate a mano possono non avere tutti i campi:
// da qui in poi le pagine lavorano sempre sulla forma completa.
export function normalizzaAnalisi(a) {
  return {
    ...a,
    titolo: a?.titolo ?? '',
    data: a?.data ?? '',
    contesto: a?.contesto ?? '',
    sintesi: a?.sintesi ?? '',
    fonte: a?.fonte ?? '',
    puntiChiave: (a?.puntiChiave ?? []).filter((p) => p?.testo?.trim()),
    obiettivi: (a?.obiettivi ?? [])
      .filter((o) => o?.testo?.trim())
      .map((o) => ({ testo: o.testo, fatto: Boolean(o.fatto) })),
    sezioni: (a?.sezioni ?? [])
      .filter((s) => s?.titolo?.trim() || (s?.punti ?? []).some((p) => p?.trim()))
      .map((s) => ({ titolo: s.titolo ?? '', punti: (s.punti ?? []).filter((p) => p?.trim()) })),
  }
}

// La più recente per data; a parità, l'ultima inserita.
export function ultimaAnalisi(lista) {
  if (!lista?.length) return null
  return [...lista].sort((a, b) =>
    (b.data ?? '').localeCompare(a.data ?? '') || (b.id ?? 0) - (a.id ?? 0)
  )[0]
}

export function avanzamentoObiettivi(a) {
  const obiettivi = a?.obiettivi ?? []
  return { fatti: obiettivi.filter((o) => o.fatto).length, totale: obiettivi.length }
}

// Obiettivo spuntato o tolto: restituisce la nuova lista, senza toccare le altre.
export const alternaObiettivo = (obiettivi, indice) =>
  obiettivi.map((o, i) => (i === indice ? { ...o, fatto: !o.fatto } : o))

// Nel form i punti di una sezione si scrivono uno per riga.
export const puntiDaTesto = (testo) =>
  (testo ?? '').split('\n').map((r) => r.replace(/^\s*[-•·]\s*/, '').trim()).filter(Boolean)
export const testoDaPunti = (punti) => (punti ?? []).join('\n')

// "sab 12 ott · Campionato · 5 partite"
export const intestazioneAnalisi = (a) =>
  [a.data && formatDataPartita(a.data), a.contesto].filter(Boolean).join(' · ')
