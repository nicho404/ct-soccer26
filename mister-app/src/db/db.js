import Dexie from 'dexie'

export const db = new Dexie('misterApp')

// Schema iniziale (scaffold M1, prima versione)
db.version(1).stores({
  players: '++id, nome, attivo',
  observations: '++id, playerId, data, contesto',
  trainings: '++id, data',
  matches: '++id, data, tipo, opponentId',
  sessionPlans: '++id, data, isTemplate',
  tactics: '++id, nome, tipo, opponentId',
  opponents: '++id, nome',
  meta: 'key',
})

// Schema completo modello v3: intese, competizioni, manuale,
// giocatore con stato attività a 5 valori invece del flag attivo.
db.version(2)
  .stores({
    players: '++id, nome, statoAttivita, ruoloNaturale',
    intese: '++id, tipo',
    competitions: '++id, nome, tipo',
    observations: '++id, playerId, data, contesto',
    trainings: '++id, data',
    matches: '++id, data, competitionId, opponentId',
    sessionPlans: '++id, data, isTemplate',
    tactics: '++id, nome, tipo, opponentId',
    opponents: '++id, nome',
    manualEntries: '++id, categoria, titolo',
    meta: 'key',
  })
  .upgrade((tx) =>
    tx.table('players').toCollection().modify((p) => {
      if (p.statoAttivita === undefined) {
        p.statoAttivita = p.attivo === false ? 'inattivo' : 'sicuro'
      }
      delete p.attivo
      if (p.porta === undefined) p.porta = p.ruoloNaturale === 'POR' ? 'si' : 'no'
      if (!Array.isArray(p.calciFissi)) p.calciFissi = []
      if (p.numero === undefined) p.numero = ''
      if (p.altezza === undefined) p.altezza = ''
    })
  )

// Sigle posizione stile FC26 al posto dei 5 ruoli generici.
// EST era senza lato: diventa ED, correggibile dalla scheda giocatore.
const SIGLE_FC = { DIF: 'DC', EST: 'ED', CEN: 'CC' }

db.version(3)
  .stores({})
  .upgrade((tx) =>
    tx.table('players').toCollection().modify((p) => {
      p.ruoloNaturale = SIGLE_FC[p.ruoloNaturale] ?? p.ruoloNaturale
      p.ruoliAdattati = (p.ruoliAdattati ?? []).map((r) => SIGLE_FC[r] ?? r)
      if (p.ruoloTattico === undefined) p.ruoloTattico = ''
    })
  )

// Ruolo tattico singolo (testo libero) → più ruoli tattici a spunta
db.version(4)
  .stores({})
  .upgrade((tx) =>
    tx.table('players').toCollection().modify((p) => {
      if (!Array.isArray(p.ruoliTattici)) {
        p.ruoliTattici = p.ruoloTattico ? [p.ruoloTattico] : []
      }
      delete p.ruoloTattico
    })
  )
