// Rischio scontento del giocatore: quanto rischia di sentirsi poco ripagato
// di quello che dà. L'app non osserva l'umore, lo stima dai numeri.
// Puro: le pagine passano le righe Dexie, qui non si legge il database.
//
// Per ora due fattori:
// - impegno: presenze su allenamenti e partite messi insieme;
// - minutaggio: quota dei minuti giocati su quelli disponibili nelle partite
//   con referto in cui era presente (chi non c'era non si aspetta di giocare).
//
// Il minutaggio decide il gradino di partenza, l'impegno decide quanto pesa
// il giocare poco: chi c'è sempre e non gioca è a rischio, chi si vede ogni
// tanto no. Altri fattori (gol, ruolo, incarichi...) si aggiungeranno come
// voci in `fattori` e come ritocchi del gradino, senza cambiare la forma.

import { refertoCompilato, DURATA_DEFAULT } from './storico'

// Il calcolo lavora su cinque gradini, dal più ripagato al meno: sono interni.
// Al mister arrivano tre livelli di rischio (LIVELLI_RISCHIO):
// - 1 e 2 (gioca praticamente sempre / gioca tanto) → nessuno: gioca quanto
//   si aspetta;
// - 3 (panchinaro con minutaggio equo, o gioca poco ma si vede poco) → da
//   monitorare: oggi regge, basta poco per cambiare;
// - 4 e 5 (gioca poco / quasi mai, pur essendoci) → alto.
// Le soglie sono quelle di sempre: cambia solo come si chiama il risultato.
export const GRADINI = ['pieno', 'buono', 'equo', 'scarso', 'minimo']

export const LIVELLI_RISCHIO = [
  { value: 'nessuno', label: 'Nessuno' },
  { value: 'monitorare', label: 'Da monitorare' },
  { value: 'alto', label: 'Alto' },
]

const RISCHIO_DEL_GRADINO = {
  pieno: 'nessuno', buono: 'nessuno', equo: 'monitorare', scarso: 'alto', minimo: 'alto',
}

export const rischioInfo = (value) => LIVELLI_RISCHIO.find((l) => l.value === value) ?? null

// Soglie sulla quota di minuti (0–1). In un calcio a 8 con 11-12 presenti
// la media è intorno a 2/3: sotto il 35% si è panchinari che giocano poco.
export const SOGLIE_MINUTAGGIO = [
  { min: 0.85, gradino: 'pieno' }, // gioca praticamente sempre
  { min: 0.6, gradino: 'buono' }, // gioca tanto
  { min: 0.35, gradino: 'equo' }, // panchinaro con un minutaggio equo
  { min: 0.15, gradino: 'scarso' }, // gioca poco
  { min: 0, gradino: 'minimo' }, // quasi mai in campo
]

// Impegno (0–1) sopra cui lo scontento conta per intero; nella fascia di
// mezzo si attenua di un gradino; sotto, chi gioca poco resta sul gradino
// equo (da monitorare).
export const IMPEGNO_PIENO = 0.75
export const IMPEGNO_MINIMO = 0.5

const pct = (x) => `${Math.round(x * 100)}%`

// Presenze su tre fasce, con le stesse soglie che pesano lo scontento:
// piena da IMPEGNO_PIENO, media da IMPEGNO_MINIMO, bassa sotto. Solo
// presenze (allenamenti + partite), il minutaggio non c'entra.
export const fasciaPresenze = (quota) =>
  quota == null ? null : quota >= IMPEGNO_PIENO ? 'piena' : quota >= IMPEGNO_MINIMO ? 'media' : 'bassa'

// Il cuore del calcolo, in una riga: il minutaggio dà il gradino, le
// presenze decidono quanto conta il giocare poco. Chi c'è poco e gioca poco
// resta sul gradino equo. `quotaPresenze` null (nessun appello): conta solo
// il minutaggio.
export function gradinoDa(quotaMinuti, quotaPresenze) {
  const base = SOGLIE_MINUTAGGIO.find((s) => quotaMinuti >= s.min).gradino
  const equo = GRADINI.indexOf('equo')
  let i = GRADINI.indexOf(base)
  let nota = null
  if (i > equo && quotaPresenze != null) {
    if (quotaPresenze < IMPEGNO_MINIMO) {
      i = equo
      nota = 'Gioca poco, ma si vede poco: non se lo aspetta.'
    } else if (quotaPresenze < IMPEGNO_PIENO) {
      i -= 1
      nota = 'Gioca poco, ma non è sempre presente: il rischio si attenua.'
    } else {
      nota = 'È sempre presente ma gioca poco.'
    }
  }
  return { gradino: GRADINI[i], nota }
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
// minutaggio non c'è niente da stimare. `causa` è la riga per il mister
// ("Presente 90% · gioca 20% dei minuti").
export function calcolaRischio({ trainings = [], matches = [] }, playerId) {
  const min = minutaggio(matches, playerId)
  if (!min) return null
  const imp = impegno({ trainings, matches }, playerId)

  const { gradino, nota } = gradinoDa(min.quota, imp?.quota ?? null)
  const livello = RISCHIO_DEL_GRADINO[gradino]
  return {
    livello,
    label: rischioInfo(livello).label,
    gradino,
    causa: imp?.quota != null
      ? `Presente ${pct(imp.quota)} · gioca ${pct(min.quota)} dei minuti`
      : `Gioca ${pct(min.quota)} dei minuti`,
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
