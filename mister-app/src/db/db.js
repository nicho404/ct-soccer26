import Dexie from 'dexie'
import { RUOLI, ruoloInfo, ruoloNpInfo } from '../tactics/constants'

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

// Nomi provvisori dei ruoli tattici → nomi ufficiali FC26
const RUOLI_FC26 = {
  'Portiere moderno': 'Portiere libero',
  'Portiere di posizione': 'Portiere',
  'Marcatore': 'Difensore',
  'Terzino di spinta': 'Tornante offensivo',
  'Terzino bloccato': 'Terzino',
  'Mediano incontrista': 'Mediano',
  'Trequartista': 'Classico 10',
  'Ala tornante': 'Esterno di centrocampo',
  'Ala offensiva': 'Ala',
  'Punta centrale': 'Attaccante avanzato',
  'Seconda punta': 'Attaccante ombra',
  "Rapace d'area": 'Opportunista',
}

db.version(5)
  .stores({})
  .upgrade((tx) =>
    tx.table('players').toCollection().modify((p) => {
      p.ruoliTattici = [
        ...new Set((p.ruoliTattici ?? []).map((r) => RUOLI_FC26[r] ?? r)),
      ]
    })
  )

// Nome italiano corretto dei ruoli da terzino: Tornante, non Fluidificante
const RINOMINE_TERZINO = {
  'Fluidificante': 'Tornante',
  'Fluidificante offensivo': 'Tornante offensivo',
}

db.version(6)
  .stores({})
  .upgrade((tx) =>
    tx.table('players').toCollection().modify((p) => {
      p.ruoliTattici = [
        ...new Set((p.ruoliTattici ?? []).map((r) => RINOMINE_TERZINO[r] ?? r)),
      ]
    })
  )

// Motore tattico (src/tactics): vocabolario ruoli chiuso a 27 codici.
// Nomi FC26 riusati per un concetto che coincide passano senza flag.
// Nomi riusati per un concetto più specifico (restringimento) vengono
// comunque adottati ma marcati per revisione, insieme all'originale.
// Nomi senza alcun corrispondente restano solo come storico.
const RUOLI_TATTICI_RESTRITTIVI = new Set(['Difensore largo', 'Tornante', 'Mediano', 'Mezzala'])

// impostazione/costruzione/linea: dal vecchio vocabolario (src/lib/formazioni.js,
// pre-motore-tattico) al nuovo. "pressing" e "aggressiva" non hanno un
// corrispondente diretto: restano sul default e vengono marcati da rivedere.
const IMPOSTAZIONE_LEGACY_TO_NUOVA = {
  possesso: 'possesso',
  ali: 'ali',
  pallalunga: 'lunga',
  contropiede: 'contropiede',
  difesa: 'oltranza',
}
const COSTRUZIONE_LEGACY_TO_NUOVA = {
  equilibrata: 'equilibrata',
  corta: 'corti',
  contropiede: 'diretta',
}
const LINEA_LEGACY_TO_NUOVA = {
  bassa: 'bassa',
  normale: 'normale',
  alta: 'alta',
}

function convertiValoreTattico(mappa, valoreLegacy, fallback) {
  if (valoreLegacy === undefined) return { valore: fallback, daRivedere: false }
  const convertito = mappa[valoreLegacy]
  if (convertito !== undefined) return { valore: convertito, daRivedere: false }
  return { valore: fallback, daRivedere: true }
}

function convertiTatticaSalvata(s) {
  const imp = convertiValoreTattico(IMPOSTAZIONE_LEGACY_TO_NUOVA, s.impostazione, 'possesso')
  const cos = convertiValoreTattico(COSTRUZIONE_LEGACY_TO_NUOVA, s.costruzione, 'equilibrata')
  const lin = convertiValoreTattico(LINEA_LEGACY_TO_NUOVA, s.linea, 'normale')
  const next = {
    ...s,
    impostazione: imp.valore,
    costruzione: cos.valore,
    linea: lin.valore,
    slotRuoliOverride: s.slotRuoliOverride ?? {},
  }
  if (imp.daRivedere || cos.daRivedere || lin.daRivedere) next.tatticaDaRivedere = true
  return next
}

// Applica la conversione v6→v7 (motore tattico) a un ambito con .table():
// `tx` dentro l'upgrade di Dexie, oppure `db` stesso quando viene richiamata
// fuori da un upgrade — ad es. da importBackup() dopo aver ripristinato un
// backup più vecchio della versione corrente, che altrimenti bulkPut-erebbe
// i dati vecchi senza mai passare dalla migration (Dexie la esegue solo sui
// cambi di versione dello schema, non sulle scritture manuali).
export async function migrazioneV7RuoliTattici(scope) {
  const nomiValidi = new Set(RUOLI.map((r) => r.nome))

  await scope.table('players').toCollection().modify((p) => {
    const originali = p.ruoliTattici ?? []
    const confermati = []
    const legacy = []
    let daRivedere = false
    for (const nome of originali) {
      if (nomiValidi.has(nome)) {
        confermati.push(nome)
        if (RUOLI_TATTICI_RESTRITTIVI.has(nome)) {
          legacy.push(nome)
          daRivedere = true
        }
      } else {
        legacy.push(nome)
        daRivedere = true
      }
    }
    p.ruoliTattici = confermati
    if (legacy.length > 0) {
      p.ruoliTatticiLegacy = [...new Set([...(p.ruoliTatticiLegacy ?? []), ...legacy])]
    }
    if (daRivedere) p.ruoliTatticiDaRivedere = true
  })

  await scope.table('meta').toCollection().modify((row) => {
    if (row.key === 'modulo' && row.value) {
      const imp = convertiValoreTattico(IMPOSTAZIONE_LEGACY_TO_NUOVA, row.value.impostazione, 'possesso')
      const cos = convertiValoreTattico(COSTRUZIONE_LEGACY_TO_NUOVA, row.value.costruzione, 'equilibrata')
      const lin = convertiValoreTattico(LINEA_LEGACY_TO_NUOVA, row.value.linea, 'normale')
      row.value.impostazione = imp.valore
      row.value.costruzione = cos.valore
      row.value.linea = lin.valore
      if (imp.daRivedere || cos.daRivedere || lin.daRivedere) row.value.tatticaDaRivedere = true
      if (row.value.byFormato) {
        for (const f of Object.keys(row.value.byFormato)) {
          row.value.byFormato[f].slotRuoliOverride = row.value.byFormato[f].slotRuoliOverride ?? {}
        }
      }
    }
    if (row.key === 'moduliSalvati' && Array.isArray(row.value)) {
      row.value = row.value.map(convertiTatticaSalvata)
    }
  })
}

db.version(7)
  .stores({})
  .upgrade((tx) => migrazioneV7RuoliTattici(tx))

// slotRuoliOverride: da "{ [slotIndex]: codice }" (solo possesso, implicito)
// a "{ possesso: {...}, nonPossesso: {...} }" — un override per fase, non
// più uno solo. Riconosce la forma vecchia controllando l'ASSENZA delle
// chiavi possesso/nonPossesso, non il tipo: una forma vecchia con uno slot
// letteralmente chiamato "possesso" o "nonPossesso" non è mai esistita
// (sono indici numerici), ma la guardia esplicita è più onesta di un duck type.
function filtraOverride(mappa, risolutore) {
  const pulito = {}
  for (const [slotIndex, codice] of Object.entries(mappa ?? {})) {
    if (risolutore(codice)) pulito[slotIndex] = codice
  }
  return pulito
}

export function convertiSlotRuoliOverride(override) {
  const eraGiaNuovaForma = override != null && ('possesso' in override || 'nonPossesso' in override)
  if (eraGiaNuovaForma) {
    return {
      possesso: filtraOverride(override.possesso, ruoloInfo),
      nonPossesso: filtraOverride(override.nonPossesso, ruoloNpInfo),
    }
  }
  // forma vecchia: era tutto e solo di possesso
  return { possesso: filtraOverride(override, ruoloInfo), nonPossesso: {} }
}

// Vedi il commento su migrazioneV7RuoliTattici: richiamabile anche fuori
// dall'upgrade Dexie, per importBackup() su backup precedenti alla v8.
export async function migrazioneV8SlotRuoliOverride(scope) {
  await scope.table('meta').toCollection().modify((row) => {
    if (row.key === 'modulo' && row.value?.byFormato) {
      for (const f of Object.keys(row.value.byFormato)) {
        row.value.byFormato[f].slotRuoliOverride = convertiSlotRuoliOverride(row.value.byFormato[f].slotRuoliOverride)
      }
    }
    if (row.key === 'moduliSalvati' && Array.isArray(row.value)) {
      row.value = row.value.map((s) => ({
        ...s,
        slotRuoliOverride: convertiSlotRuoliOverride(s.slotRuoliOverride),
      }))
    }
  })
}

db.version(8)
  .stores({})
  .upgrade((tx) => migrazioneV8SlotRuoliOverride(tx))
