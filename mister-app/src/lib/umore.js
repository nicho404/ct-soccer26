// Umore del giocatore: quanto si sente ripagato di quello che dà.
// Puro: le pagine passano le righe Dexie, qui non si legge il database.
//
// Per ora due fattori:
// - impegno: presenze su allenamenti e partite messi insieme;
// - minutaggio: quota dei minuti giocati su quelli disponibili nelle partite
//   con referto in cui era presente (chi non c'era non si aspetta di giocare).
//
// Il minutaggio decide il livello di partenza, l'impegno decide quanto pesa
// il giocare poco: chi c'è sempre e non gioca si arrabbia, chi si vede ogni
// tanto no. Altri fattori (gol, ruolo, incarichi...) si aggiungeranno come
// voci in `fattori` e come ritocchi del livello, senza cambiare la forma.

import { refertoCompilato, DURATA_DEFAULT } from './storico'

// Dal più felice al più scontento: l'indice è il "gradino".
export const LIVELLI_UMORE = [
  { value: 'sorridente', label: 'Sorridente', emoji: '😁' },
  { value: 'contento', label: 'Contento', emoji: '🙂' },
  { value: 'neutro', label: 'Neutro', emoji: '😐' },
  { value: 'triste', label: 'Triste', emoji: '😢' },
  { value: 'arrabbiato', label: 'Arrabbiato', emoji: '😠' },
]

export const umoreInfo = (value) => LIVELLI_UMORE.find((l) => l.value === value) ?? null

// Soglie sulla quota di minuti (0–1). In un calcio a 8 con 11-12 presenti
// la media è intorno a 2/3: sotto il 35% si è panchinari che giocano poco.
export const SOGLIE_MINUTAGGIO = [
  { min: 0.85, livello: 'sorridente' }, // gioca praticamente sempre
  { min: 0.6, livello: 'contento' }, // gioca tanto
  { min: 0.35, livello: 'neutro' }, // panchinaro con un minutaggio equo
  { min: 0.15, livello: 'triste' }, // gioca poco
  { min: 0, livello: 'arrabbiato' }, // quasi mai in campo
]

// Impegno (0–1) sopra cui lo scontento conta per intero; nella fascia di
// mezzo si attenua di un gradino; sotto, chi gioca poco resta neutro.
export const IMPEGNO_PIENO = 0.75
export const IMPEGNO_MINIMO = 0.5

const pct = (x) => `${Math.round(x * 100)}%`

// Presenze su sedute e partite. I giustificati non contano né a favore né
// contro: chi avvisa non manca di impegno, ma nemmeno era lì.
export function impegno({ trainings = [], matches = [] }, playerId) {
  let presenti = 0
  let totale = 0
  for (const ev of [...trainings, ...matches]) {
    const stato = ev?.presenze?.[playerId]
    if (!stato || stato === 'giustificato') continue
    totale += 1
    if (stato === 'presente') presenti += 1
  }
  return totale === 0 ? null : { presenti, totale, quota: presenti / totale }
}

// Minuti giocati su quelli disponibili, solo nelle partite con referto in
// cui era segnato presente.
export function minutaggio(matches = [], playerId) {
  let giocati = 0
  let disponibili = 0
  let partite = 0
  for (const m of matches) {
    if (!refertoCompilato(m) || m.presenze?.[playerId] !== 'presente') continue
    partite += 1
    disponibili += Number(m.durata) || DURATA_DEFAULT
    giocati += m.minuti?.[playerId] ?? 0
  }
  return partite === 0 ? null : { giocati, disponibili, partite, quota: giocati / disponibili }
}

// null se non c'è nemmeno una partita con referto in cui era presente: senza
// minutaggio non c'è niente di cui essere contenti o scontenti.
export function calcolaUmore({ trainings = [], matches = [] }, playerId) {
  const min = minutaggio(matches, playerId)
  if (!min) return null
  const imp = impegno({ trainings, matches }, playerId)

  const base = SOGLIE_MINUTAGGIO.find((s) => min.quota >= s.min).livello
  let gradino = LIVELLI_UMORE.findIndex((l) => l.value === base)
  const neutro = LIVELLI_UMORE.findIndex((l) => l.value === 'neutro')

  let nota = null
  if (gradino > neutro && imp) {
    if (imp.quota < IMPEGNO_MINIMO) {
      gradino = neutro
      nota = 'Gioca poco, ma si vede poco: non se lo aspetta.'
    } else if (imp.quota < IMPEGNO_PIENO) {
      gradino -= 1
      nota = 'Gioca poco, ma non è sempre presente: lo scontento si attenua.'
    } else {
      nota = 'È sempre presente ma gioca poco.'
    }
  }

  const livello = LIVELLI_UMORE[gradino]
  return {
    ...livello,
    livello: livello.value,
    nota,
    fattori: [
      {
        nome: 'Presenze',
        valore: imp ? pct(imp.quota) : '—',
        dettaglio: imp
          ? `${imp.presenti} su ${imp.totale} tra allenamenti e partite`
          : 'Nessun appello compilato',
      },
      {
        nome: 'Minutaggio',
        valore: pct(min.quota),
        dettaglio: `${min.giocati}′ su ${min.disponibili}′ ${min.partite === 1 ? 'nella partita' : `nelle ${min.partite} partite`} in cui era presente`,
      },
    ],
  }
}
