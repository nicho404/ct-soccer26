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

// Badge presenze per l'allenatore: solo presenze complessive (allenamenti +
// partite), il minutaggio non c'entra. Dall'alto: la prima soglia raggiunta.
export const BADGE_PRESENZE = [
  { min: 0.9, value: 'diamante', label: 'Diamante', icona: '💎' },
  { min: 0.8, value: 'oro', label: 'Oro', icona: '🥇' },
  { min: 0.7, value: 'argento', label: 'Argento', icona: '🥈' },
  { min: 0.6, value: 'bronzo', label: 'Bronzo', icona: '🥉' },
  { min: 0.5, value: 'ferro', label: 'Ferro', icona: '🔩' },
  { min: 0.4, value: 'legno', label: 'Legno', icona: '🪵' },
  { min: 0, value: 'cartone', label: 'Cartone', icona: '📦' },
]

export const badgePresenze = (quota) =>
  quota == null ? null : BADGE_PRESENZE.find((b) => quota >= b.min)

// Il cuore del calcolo, in una riga: il minutaggio dà l'umore, le presenze
// decidono quanto conta lo scontento. Chi c'è poco e gioca poco resta neutro.
// `quotaPresenze` null (nessun appello): conta solo il minutaggio.
export function umoreDa(quotaMinuti, quotaPresenze) {
  const base = SOGLIE_MINUTAGGIO.find((s) => quotaMinuti >= s.min).livello
  const neutro = LIVELLI_UMORE.findIndex((l) => l.value === 'neutro')
  let gradino = LIVELLI_UMORE.findIndex((l) => l.value === base)
  let nota = null
  if (gradino > neutro && quotaPresenze != null) {
    if (quotaPresenze < IMPEGNO_MINIMO) {
      gradino = neutro
      nota = 'Gioca poco, ma si vede poco: non se lo aspetta.'
    } else if (quotaPresenze < IMPEGNO_PIENO) {
      gradino -= 1
      nota = 'Gioca poco, ma non è sempre presente: lo scontento si attenua.'
    } else {
      nota = 'È sempre presente ma gioca poco.'
    }
  }
  return { livello: LIVELLI_UMORE[gradino], nota }
}

// Presenze su sedute e partite. I giustificati non contano né a favore né
// contro: chi avvisa non manca di impegno, ma nemmeno era lì.
// È la stessa percentuale in Rosa, nella scheda giocatore e nella tabella
// di Presenze e sedute. null se non compare in nessun appello; quota null se
// ha solo giustificati.
export function impegno({ trainings = [], matches = [] }, playerId) {
  let presenti = 0
  let assenti = 0
  let giustificati = 0
  for (const ev of [...trainings, ...matches]) {
    const stato = ev?.presenze?.[playerId]
    if (!stato) continue
    if (stato === 'presente') presenti += 1
    else if (stato === 'giustificato') giustificati += 1
    else assenti += 1
  }
  const totale = presenti + assenti
  if (totale + giustificati === 0) return null
  return { presenti, assenti, giustificati, totale, quota: totale === 0 ? null : presenti / totale }
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

  const { livello, nota } = umoreDa(min.quota, imp?.quota ?? null)
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
