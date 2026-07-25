// Motore tattico — funzioni pure, testabili. Nessuna dipendenza da Dexie,
// React o DOM: solo input → output (vedi docs/mappa-tattica.md).
//
// Regola di precedenza sui slot contesi (centrocampo), mappa-tattica.md §6:
// il MEDIANO segue sempre la costruzione, i CENTROCAMPISTI AVANZATI seguono
// sempre l'impostazione. Quando un modulo non ha uno slot dedicato al
// mediano (sigla CDC/MED), è il primo slot della famiglia CC/COC ad
// assorbire quel compito — mappa-tattica.md §5: "Un solo centrocampista
// centrale → deve essere M-R o M-E, mai CC-M" (3-3-1); "uno M-E che resta,
// uno CC-M che si inserisce" (2-4-1).
import {
  ZONE, RUOLI, ruoloInfo, zonaSigla,
  MATRICE_COSTRUZIONE, MATRICE_IMPOSTAZIONE, MATRICE_COERENZA, LINEA_COERENTE,
} from './constants'

const FAMIGLIA_CC = ['CC', 'COC']
const SIGLE_MEDIANO_DEDICATO = ['CDC', 'MED']

function slotDcCentrale(dcSlots) {
  if (dcSlots.length < 3) return null // difesa a due: nessuna distinzione centrale/laterale
  return dcSlots.slice().sort((a, b) => Math.abs(a.u - 0.5) - Math.abs(b.u - 0.5))[0]
}

// risolviRuoli({ modulo, formato, impostazione, costruzione })
//   → [{ slotIndex, zona, ruoloSuggerito, posizione, nome, compito }]
export function risolviRuoli({ modulo, impostazione, costruzione }) {
  const slots = modulo.slots
  const dcSlots = slots.filter((s) => s.sigla === 'DC')
  const dcCentrale = slotDcCentrale(dcSlots)

  const haMedianoDedicato = slots.some((s) => SIGLE_MEDIANO_DEDICATO.includes(s.sigla))
  const primoSlotCC = slots.find((s) => FAMIGLIA_CC.includes(s.sigla))
  const slotCCAssorbeMediano = !haMedianoDedicato ? primoSlotCC : null

  return slots.map((slot, slotIndex) => {
    const siglaZona = zonaSigla(slot.sigla)
    let zonaEffettiva = siglaZona
    let codice

    switch (siglaZona) {
      case ZONE.PORTIERE:
        codice = MATRICE_COSTRUZIONE[costruzione].portiere
        break
      case ZONE.DIFENSORE_CENTRALE:
        codice = slot === dcCentrale || !dcCentrale
          ? MATRICE_COSTRUZIONE[costruzione].dcCentrale
          : MATRICE_COSTRUZIONE[costruzione].dcLaterale
        break
      case ZONE.TERZINO:
        codice = MATRICE_COSTRUZIONE[costruzione].terzino
        break
      case ZONE.MEDIANO:
        codice = MATRICE_COSTRUZIONE[costruzione].mediano
        break
      case ZONE.CENTROCAMPISTA_CENTRALE:
        if (slot === slotCCAssorbeMediano) {
          zonaEffettiva = ZONE.MEDIANO
          codice = MATRICE_COSTRUZIONE[costruzione].mediano
        } else {
          codice = MATRICE_IMPOSTAZIONE[impostazione].ccOffensivo
        }
        break
      case ZONE.ESTERNO_OFFENSIVO:
        codice = MATRICE_IMPOSTAZIONE[impostazione].esterno
        break
      case ZONE.PUNTA:
        codice = MATRICE_IMPOSTAZIONE[impostazione].punta
        break
      default:
        codice = null
    }

    const ruolo = ruoloInfo(codice)
    return {
      slotIndex,
      zona: zonaEffettiva,
      ruoloSuggerito: codice,
      posizione: ruolo?.posizione ?? [],
      nome: ruolo?.nome ?? '',
      compito: ruolo?.compito ?? '',
    }
  })
}

const ORDINE_LIVELLO = { ok: 0, warn: 1, rotto: 2 }

// verificaCoerenza({ impostazione, costruzione, linea })
//   → { livello: "ok"|"warn"|"rotto", problemi: [{ tipo, livello, messaggio }] }
export function verificaCoerenza({ impostazione, costruzione, linea }) {
  const problemi = []

  const cc = MATRICE_COERENZA[impostazione]?.[costruzione]
  if (cc && cc.livello !== 'ok') {
    problemi.push({ tipo: 'costruzione', livello: cc.livello, messaggio: cc.messaggio })
  }

  const lc = LINEA_COERENTE[impostazione]
  if (lc) {
    let livelloLinea = 'ok'
    if (lc.critica && linea === lc.critica) livelloLinea = 'rotto'
    else if (!lc.raccomandate.includes(linea)) livelloLinea = 'warn'
    if (livelloLinea !== 'ok') {
      problemi.push({ tipo: 'linea', livello: livelloLinea, messaggio: lc.messaggio })
    }
  }

  const livello = problemi.reduce(
    (peggiore, p) => (ORDINE_LIVELLO[p.livello] > ORDINE_LIVELLO[peggiore] ? p.livello : peggiore),
    'ok'
  )
  return { livello, problemi }
}

// compatibilitaGiocatore({ slotRuolo, player })
//   → { livello: "naturale"|"adattabile"|"forzato", motivo }
// Confronta il codice di ruolo assegnato allo slot con i ruoliTattici del
// giocatore (nomi, non codici). Non scrive né modifica mai il giocatore.
export function compatibilitaGiocatore({ slotRuolo, player }) {
  const ruolo = ruoloInfo(slotRuolo)
  const tattici = player?.ruoliTattici ?? []

  if (!ruolo) {
    return { livello: 'forzato', motivo: 'Ruolo dello slot non riconosciuto.' }
  }
  if (tattici.includes(ruolo.nome)) {
    return { livello: 'naturale', motivo: `Ha già "${ruolo.nome}" tra i suoi ruoli tattici.` }
  }

  const stessaZona = tattici.some((nome) => RUOLI.find((r) => r.nome === nome)?.zona === ruolo.zona)
  if (stessaZona) {
    return {
      livello: 'adattabile',
      motivo: `Gioca già ruoli della stessa zona, ma non "${ruolo.nome}" nello specifico.`,
    }
  }
  return {
    livello: 'forzato',
    motivo: `Nessuno dei suoi ruoli tattici appartiene alla zona di "${ruolo.nome}".`,
  }
}
