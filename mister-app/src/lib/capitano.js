// Scelta del capitano (M7): confronto tra candidati sui dati già raccolti
// altrove — osservazioni (M2), presenze (M5), minutaggio (M6), tratti della
// scheda giocatore (M1). Qui non si inventa nessun dato nuovo.
//
// Il punteggio è un ordinamento, non un verdetto: la fascia la dà il mister.

import { CRITERI_OSSERVAZIONE } from '../db/constants'
import { aggregaPresenze } from './presenze'
import { aggregaGiocatori } from './storico'

// Pesi in centesimi. Leadership pesa più di tutto perché è l'unica voce che
// misura direttamente la cosa; le altre sono indizi di affidabilità.
export const PESI = [
  { key: 'leadership', label: 'Leadership osservata', peso: 35 },
  { key: 'allenamenti', label: 'Presenza agli allenamenti', peso: 25 },
  { key: 'campo', label: 'Presenza in campo', peso: 20 },
  { key: 'lettura', label: 'Lettura del gioco', peso: 10 },
  { key: 'carattere', label: 'Carattere da leader', peso: 10 },
]

// Quante osservazioni recenti fanno media su un criterio: le stesse 3 della
// scheda giocatore, così i numeri raccontano la stessa storia.
const OSSERVAZIONI_RECENTI = 3

// Sotto questa copertura il punteggio poggia su troppi buchi per competere
// alla pari: chi ci sta sotto finisce comunque in fondo alla lista, per quanto
// alto sia il numero. Un 100% fatto di sole presenze agli allenamenti non è
// una candidatura, è un dato solo.
export const COPERTURA_MINIMA = 50

const criterioEsiste = (key) => CRITERI_OSSERVAZIONE.some((c) => c.key === key)

// Media 0-100 di un criterio di osservazione (voti 1-5), sulle ultime N
// osservazioni che quel criterio ce l'hanno. null se non è mai stato votato.
export function mediaCriterio(observations, key, n = OSSERVAZIONI_RECENTI) {
  if (!criterioEsiste(key)) return null
  const serie = [...observations]
    .sort((a, b) => String(b.data ?? '').localeCompare(String(a.data ?? '')))
    .map((o) => o.voti?.[key])
    .filter((v) => typeof v === 'number')
    .slice(0, n)
  if (serie.length === 0) return null
  const media = serie.reduce((a, b) => a + b, 0) / serie.length
  return Math.round((media / 5) * 100)
}

// Candidati ordinati per punteggio. Ogni voce senza dato viene esclusa dal
// calcolo e i pesi rimanenti si ridistribuiscono: chi ha poche osservazioni
// non viene punito con degli zeri, ma la sua `copertura` scende e la pagina
// lo dice. Meglio "non lo so" di un numero inventato.
export function classificaCapitani({
  players = [], observations = [], trainings = [], matches = [],
} = {}) {
  const presenze = aggregaPresenze(trainings)
  const stagione = aggregaGiocatori(matches)
  const partiteConReferto = stagione.reduce((max, r) => Math.max(max, r.presenze), 0)

  return players
    .map((p) => {
      const obsSue = observations.filter((o) => o.playerId === p.id)
      const rigaPresenze = presenze.find((r) => r.playerId === p.id)
      const rigaStagione = stagione.find((r) => r.playerId === p.id)

      const valori = {
        leadership: mediaCriterio(obsSue, 'leadership'),
        lettura: mediaCriterio(obsSue, 'lettura'),
        allenamenti: rigaPresenze?.pct ?? null,
        // "c'è quando si gioca": partite giocate sul totale di quelle refertate
        campo: partiteConReferto === 0 || !rigaStagione
          ? null
          : Math.round((rigaStagione.presenze / partiteConReferto) * 100),
        // il tratto è una scelta secca del mister: 100 o 0, mai "non so"
        carattere: p.carattere === 'leader' ? 100 : p.carattere === 'follower' ? 0 : null,
      }

      const voci = PESI.map((v) => ({ ...v, valore: valori[v.key] }))
      const disponibili = voci.filter((v) => v.valore !== null)
      const pesoTotale = disponibili.reduce((a, v) => a + v.peso, 0)

      const punteggio = pesoTotale === 0
        ? null
        : Math.round(
          disponibili.reduce((a, v) => a + v.valore * v.peso, 0) / pesoTotale
        )

      return {
        playerId: p.id,
        punteggio,
        // quanto del peso totale poggia su dati veri
        copertura: pesoTotale,
        voci,
      }
    })
    .sort((a, b) => {
      const solidoA = a.copertura >= COPERTURA_MINIMA
      const solidoB = b.copertura >= COPERTURA_MINIMA
      if (solidoA !== solidoB) return solidoA ? -1 : 1
      return (b.punteggio ?? -1) - (a.punteggio ?? -1)
    })
}
