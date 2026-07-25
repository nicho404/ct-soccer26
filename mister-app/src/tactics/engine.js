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
  ZONE, RUOLI, ruoloInfo, zonaSigla, IMPOSTAZIONI,
  MATRICE_COSTRUZIONE, MATRICE_IMPOSTAZIONE, MATRICE_COERENZA, LINEA_COERENTE,
  REQUISITI_IMPOSTAZIONE, ECCEZIONI_MODULO,
  ruoloNpInfo, MATRICE_LINEA, TRANSIZIONE, COMPRESSIONE,
} from './constants'

const FAMIGLIA_CC = ['CC', 'COC']
const SIGLE_MEDIANO_DEDICATO = ['CDC', 'MED']

function slotDcCentrale(dcSlots) {
  if (dcSlots.length < 3) return null // difesa a due: nessuna distinzione centrale/laterale
  return dcSlots.slice().sort((a, b) => Math.abs(a.u - 0.5) - Math.abs(b.u - 0.5))[0]
}

// zoneEffettive(modulo) → string[] (una zona per slot, stesso ordine di modulo.slots)
// Applica la regola di precedenza del centrocampo conteso, mappa-tattica.md §6:
// il MEDIANO segue sempre la costruzione, i CENTROCAMPISTI AVANZATI seguono
// sempre l'impostazione. Quando un modulo non ha uno slot dedicato al
// mediano (sigla CDC/MED), è il primo slot della famiglia CC/COC ad
// assorbire quel compito — mappa-tattica.md §5: "Un solo centrocampista
// centrale → deve essere M-R o M-E, mai CC-M" (3-3-1); "uno M-E che resta,
// uno CC-M che si inserisce" (2-4-1).
export function zoneEffettive(modulo) {
  const slots = modulo.slots
  const haMedianoDedicato = slots.some((s) => SIGLE_MEDIANO_DEDICATO.includes(s.sigla))
  const primoSlotCC = slots.find((s) => FAMIGLIA_CC.includes(s.sigla))
  const slotCCAssorbeMediano = !haMedianoDedicato ? primoSlotCC : null

  return slots.map((slot) => {
    const siglaZona = zonaSigla(slot.sigla)
    if (siglaZona === ZONE.CENTROCAMPISTA_CENTRALE && slot === slotCCAssorbeMediano) {
      return ZONE.MEDIANO
    }
    return siglaZona
  })
}

// risolviRuoli({ modulo, formato, impostazione, costruzione })
//   → [{ slotIndex, zona, ruoloSuggerito, posizione, nome, compito }]
export function risolviRuoli({ modulo, impostazione, costruzione }) {
  const slots = modulo.slots
  const zone = zoneEffettive(modulo)
  const dcSlots = slots.filter((s) => s.sigla === 'DC')
  const dcCentrale = slotDcCentrale(dcSlots)

  return slots.map((slot, slotIndex) => {
    const zonaEffettiva = zone[slotIndex]
    let codice

    switch (zonaEffettiva) {
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
        codice = MATRICE_IMPOSTAZIONE[impostazione].ccOffensivo
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

// Zona effettiva → chiave delle matrici di non possesso (stessa distinzione
// centrale/laterale già usata per la costruzione, per coerenza architetturale
// anche se in MATRICE_LINEA i due valori oggi coincidono).
function chiaveMatriceLinea(zonaEffettiva, slot, dcCentrale) {
  switch (zonaEffettiva) {
    case ZONE.PORTIERE: return 'portiere'
    case ZONE.DIFENSORE_CENTRALE:
      return slot === dcCentrale || !dcCentrale ? 'dcCentrale' : 'dcLaterale'
    case ZONE.TERZINO: return 'terzino'
    case ZONE.MEDIANO: return 'mediano'
    case ZONE.CENTROCAMPISTA_CENTRALE: return 'ccOffensivo'
    case ZONE.ESTERNO_OFFENSIVO: return 'esterno'
    case ZONE.PUNTA: return 'punta'
    default: return null
  }
}

// risolviRuoliNonPossesso({ modulo, linea, impostazione })
//   → [{ slotIndex, zona, ruoloSuggerito, nome, compito }]
// Ordine di risoluzione: TRANSIZIONE[impostazione][zona] ?? MATRICE_LINEA[linea][zona].
// Usa zoneEffettive: la regola di precedenza del centrocampo conteso vale
// anche senza palla. Nessuno slot resta senza ruolo: una zona scoperta dalle
// matrici è un bug (fallisce rumorosamente), non un fallback silenzioso.
export function risolviRuoliNonPossesso({ modulo, linea, impostazione }) {
  const slots = modulo.slots
  const zone = zoneEffettive(modulo)
  const dcSlots = slots.filter((s) => s.sigla === 'DC')
  const dcCentrale = slotDcCentrale(dcSlots)
  const transizione = TRANSIZIONE[impostazione] ?? {}
  const matriceLinea = MATRICE_LINEA[linea]

  return slots.map((slot, slotIndex) => {
    const zonaEffettiva = zone[slotIndex]
    const chiave = chiaveMatriceLinea(zonaEffettiva, slot, dcCentrale)
    const codice = transizione[chiave] ?? matriceLinea?.[chiave]
    if (!codice) {
      throw new Error(
        `risolviRuoliNonPossesso: nessun ruolo di non possesso per la zona "${zonaEffettiva}" (chiave "${chiave}", linea "${linea}")`
      )
    }
    const ruolo = ruoloNpInfo(codice)
    return {
      slotIndex,
      zona: zonaEffettiva,
      ruoloSuggerito: codice,
      nome: ruolo?.nome ?? '',
      compito: ruolo?.compito ?? '',
    }
  })
}

// geometriaNonPossesso({ modulo, linea }) → [{ u, t }] (stesso ordine di modulo.slots)
// Derivata dalle coordinate {u, t} già in formazioni.js, non un secondo set
// scritto a mano. Il portiere non si muove; gli altri slot si accorciano
// verso la propria porta (fattoreT) e si stringono verso il centro (fattoreU).
export function geometriaNonPossesso({ modulo, linea }) {
  const slots = modulo.slots
  const { ancora, fattoreT, fattoreU } = COMPRESSIONE[linea]
  const nonPortiere = slots.filter((s) => zonaSigla(s.sigla) !== ZONE.PORTIERE)
  const tMin = Math.min(...nonPortiere.map((s) => s.t))

  return slots.map((slot) => {
    if (zonaSigla(slot.sigla) === ZONE.PORTIERE) return { u: slot.u, t: slot.t }
    return {
      u: 0.5 + (slot.u - 0.5) * fattoreU,
      t: ancora + (slot.t - tMin) * fattoreT,
    }
  })
}

// applicaOverrideRuoli(ruoliBase, override, risolutore) → ruoli con gli
// override manuali sovrapposti al calcolo automatico (mai il contrario).
// `risolutore` è `ruoloInfo` per il possesso o `ruoloNpInfo` per il non
// possesso: un codice che il risolutore giusto non riconosce (vocabolario
// sbagliato o codice inesistente) viene scartato in silenzio, il ruolo
// calcolato dal motore resta quello buono — mai un crash.
export function applicaOverrideRuoli(ruoliBase, override, risolutore) {
  return ruoliBase.map((r, i) => {
    const codice = override?.[i]
    if (!codice) return r
    const ruolo = risolutore(codice)
    if (!ruolo) return r
    const { codice: ruoloSuggerito, ...campi } = ruolo
    return { ...r, ...campi, ruoloSuggerito, manuale: true }
  })
}

const ORDINE_LIVELLO = { ok: 0, warn: 1, rotto: 2 }

function contaZona(modulo, zona) {
  return zoneEffettive(modulo).filter((z) => z === zona).length
}

const LABEL_ZONA = {
  [ZONE.PORTIERE]: 'portieri',
  [ZONE.DIFENSORE_CENTRALE]: 'difensori centrali',
  [ZONE.TERZINO]: 'terzini',
  [ZONE.MEDIANO]: 'mediani',
  [ZONE.CENTROCAMPISTA_CENTRALE]: 'centrocampisti centrali',
  [ZONE.ESTERNO_OFFENSIVO]: 'slot esterni offensivi',
  [ZONE.PUNTA]: 'punte',
}

// Messaggio generato (non hardcodato per modulo): nomina la zona mancante e
// il numero, così regge anche sui moduli aggiunti in futuro.
function messaggioRequisito(chiave, impostazione, minimo, conteggio) {
  const impLabel = (IMPOSTAZIONI.find((i) => i.value === impostazione)?.label ?? impostazione).toLowerCase()
  if (chiave === 'difensivi') {
    return `Difendere a oltranza con solo ${conteggio} uom${conteggio === 1 ? 'o' : 'ini'} di reparto arretrato (ne servono almeno ${minimo}): il blocco basso non si forma, restano solo uno-contro-uno.`
  }
  const label = LABEL_ZONA[chiave] ?? chiave
  return `Il modulo non ha ${label} a sufficienza (${conteggio} su ${minimo} richiesti): '${impLabel}' non ha chi lo esegue.`
}

// Requisito strutturale: se il modulo non possiede le zone minime richieste
// dall'impostazione, quell'impostazione gira a vuoto → sempre "rotto".
function valutaRequisitoStrutturale(modulo, impostazione) {
  const requisiti = REQUISITI_IMPOSTAZIONE[impostazione]
  if (!requisiti) return null
  for (const [chiave, minimo] of Object.entries(requisiti)) {
    const conteggio = chiave === 'difensivi'
      ? contaZona(modulo, ZONE.DIFENSORE_CENTRALE) + contaZona(modulo, ZONE.TERZINO)
      : contaZona(modulo, chiave)
    if (conteggio < minimo) {
      return {
        tipo: 'modulo',
        livello: 'rotto',
        messaggio: messaggioRequisito(chiave, impostazione, minimo, conteggio),
      }
    }
  }
  return null
}

// Requisito strutturale ed eccezione documentata possono riguardare la
// stessa coppia modulo×impostazione: vince il livello peggiore.
function valutaModulo(modulo, moduloKey, impostazione) {
  const candidati = []

  const requisito = valutaRequisitoStrutturale(modulo, impostazione)
  if (requisito) candidati.push(requisito)

  const eccezione = ECCEZIONI_MODULO[moduloKey]?.[impostazione]
  if (eccezione) candidati.push({ tipo: 'modulo', livello: eccezione.livello, messaggio: eccezione.messaggio })

  if (candidati.length === 0) return null
  return candidati.reduce((peggiore, c) =>
    ORDINE_LIVELLO[c.livello] > ORDINE_LIVELLO[peggiore.livello] ? c : peggiore
  )
}

// Coerenza modulo × linea — derivata dalle zone effettive, non hardcodata
// per modulo. Solo questi due casi per ora (mappa-tattica.md §6); il resto
// è materia del layer successivo.
function valutaModuloLinea(modulo, linea) {
  const difensivi = contaZona(modulo, ZONE.DIFENSORE_CENTRALE) + contaZona(modulo, ZONE.TERZINO)
  if (difensivi < 3 && linea === 'alta') {
    return {
      tipo: 'modulo-linea',
      livello: 'warn',
      messaggio: 'Con due soli difensori e la linea alta, ogni palla dietro la linea è un uno-contro-uno col portiere.',
    }
  }

  const punte = contaZona(modulo, ZONE.PUNTA)
  if (punte >= 2 && linea === 'bassa') {
    return {
      tipo: 'modulo-linea',
      livello: 'warn',
      messaggio: 'Due uomini che restano alti lasciano il blocco basso a cinque: davanti alla difesa si apre la zona di rifinitura.',
    }
  }

  return null
}

// verificaCoerenza({ impostazione, costruzione, linea, modulo, moduloKey })
//   → { livello: "ok"|"warn"|"rotto", problemi: [{ tipo, livello, messaggio }] }
// `modulo`/`moduloKey` sono opzionali: senza, il controllo modulo×impostazione
// viene saltato e il comportamento resta quello di prima di questo controllo.
export function verificaCoerenza({ impostazione, costruzione, linea, modulo, moduloKey }) {
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

  if (modulo && moduloKey) {
    const problemaModulo = valutaModulo(modulo, moduloKey, impostazione)
    if (problemaModulo) problemi.push(problemaModulo)

    const problemaModuloLinea = valutaModuloLinea(modulo, linea)
    if (problemaModuloLinea) problemi.push(problemaModuloLinea)
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
