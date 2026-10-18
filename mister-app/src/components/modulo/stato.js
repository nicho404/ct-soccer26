import { convertiSlotRuoliOverride } from '../../db/db'
import {
  MODULI_FORMATO, FORMATI, MODULO_DEFAULT, IMPOSTAZIONI, COSTRUZIONI, LINEE_DIFESA, lineaDifesaInfo,
} from '../../lib/formazioni'
import { famigliaRuolo } from '../../db/constants'
import { LINEA_COERENTE } from '../../tactics/constants'

// Logica pura della pagina Modulo: come si legge e si scrive il record
// meta 'modulo' e gli assetti salvati. Nessun componente qui.

export const VUOTO = (formato) => Array(formato).fill(null)
export const OVERRIDE_VUOTO = () => ({ possesso: {}, nonPossesso: {} })

// Perché un cambio previsto scatta: libero abbastanza da coprire i casi reali
// ("dentro Rossi al 60'", "se siamo in vantaggio", "se non ingrana"), il
// dettaglio libero fa il resto.
export const TRIGGER_CAMBIO = [
  { value: 'minuto', label: 'Al minuto' },
  { value: 'risultato', label: 'Se il risultato è' },
  { value: 'prestazione', label: 'Se la prestazione è' },
]

export const nuovoIdRiga = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const DEFAULT_BY_FORMATO = () =>
  Object.fromEntries(
    FORMATI.map((f) => [f, { modulo: MODULO_DEFAULT[f], slots: VUOTO(f), slotRuoliOverride: OVERRIDE_VUOTO(), cambi: {}, incarichi: {} }])
  )

const valida = (elenco, v) => elenco.some((x) => x.value === v)

// Dal record salvato allo stato della pagina. Restituisce solo i campi
// validi: quelli mancanti restano ai default della pagina.
export function statoDaRecord(v) {
  const base = DEFAULT_BY_FORMATO()
  if (v.byFormato) {
    for (const f of FORMATI) {
      const cfg = v.byFormato[f]
      if (!cfg) continue
      if (MODULI_FORMATO[f][cfg.modulo]) base[f].modulo = cfg.modulo
      if (Array.isArray(cfg.slots) && cfg.slots.length === f) base[f].slots = cfg.slots
      // normalizza sempre: un record non ancora migrato (o corrotto a
      // mano) non deve mai far crashare il caricamento
      base[f].slotRuoliOverride = convertiSlotRuoliOverride(cfg.slotRuoliOverride)
      if (cfg.cambi && typeof cfg.cambi === 'object') base[f].cambi = cfg.cambi
      if (cfg.incarichi && typeof cfg.incarichi === 'object') base[f].incarichi = cfg.incarichi
    }
  } else {
    // dati salvati prima dello switch di formato: erano solo calcio a 7
    if (MODULI_FORMATO[7][v.modulo]) base[7].modulo = v.modulo
    if (Array.isArray(v.slots) && v.slots.length === 7) base[7].slots = v.slots
  }
  return {
    byFormato: base,
    impostazione: valida(IMPOSTAZIONI, v.impostazione) ? v.impostazione : undefined,
    costruzione: valida(COSTRUZIONI, v.costruzione) ? v.costruzione : undefined,
    linea: valida(LINEE_DIFESA, v.linea) ? v.linea : undefined,
    matchId: v.matchId != null ? v.matchId : undefined,
  }
}

// Assetto salvato → configurazione del formato. I cambi previsti sono
// salvati per giocatore (chi esce/entra), non per slot: si ritrova lo slot
// cercando dove l'uscente era schierato in *questo* assetto salvato, non in
// quello attualmente in campo.
export function formatoDaAssetto(s) {
  return {
    modulo: s.modulo,
    slots: [...s.slots],
    slotRuoliOverride: convertiSlotRuoliOverride(s.slotRuoliOverride),
    incarichi: s.incarichi && typeof s.incarichi === 'object' ? { ...s.incarichi } : {},
    cambi: Object.fromEntries(
      (s.cambiPrevisti ?? [])
        .map((r) => [s.slots.indexOf(r.escePlayerId), r.entraPlayerId])
        .filter(([idx, entra]) => idx !== -1 && entra != null)
    ),
  }
}

export const tatticaDaAssetto = (s, impostazioneAttuale) => ({
  impostazione: valida(IMPOSTAZIONI, s.impostazione) ? s.impostazione : impostazioneAttuale,
  costruzione: valida(COSTRUZIONI, s.costruzione) ? s.costruzione : 'equilibrata',
  linea: valida(LINEE_DIFESA, s.linea) ? s.linea : 'normale',
})

// Righe del form "Salva assetto" precompilate dai cambi già pianificati sul
// campo (scheda "Cambi"): senza questo, un cambio impostato lì e mai
// ritoccato nel form andrebbe perso, perché sono due elenchi distinti
// (slot->playerId vs righe con trigger).
export const righeDaCambi = (cambi, slots) =>
  Object.entries(cambi).map(([slotIndex, playerId]) => ({
    id: nuovoIdRiga(),
    escePlayerId: slots[Number(slotIndex)] ?? null,
    entraPlayerId: playerId,
    trigger: 'minuto',
    dettaglio: '',
    slotIndex: null,
  }))

// Candidati per lo slot selezionato: prima chi è in posizione, poi i
// titolari, poi in ordine di nome
export function ordinaCandidati(attivi, slot, esclusoId) {
  const fit = (p) =>
    p.ruoloNaturale === slot.sigla ? 0
    : (p.ruoliAdattati ?? []).includes(slot.sigla) ? 1
    : famigliaRuolo(p.ruoloNaturale) === famigliaRuolo(slot.sigla) ? 2
    : 3
  return [...attivi]
    .sort((a, b) =>
      fit(a) - fit(b) ||
      (b.titolare === true) - (a.titolare === true) ||
      a.nome.localeCompare(b.nome)
    )
    .filter((p) => p.id !== esclusoId)
}

// Il messaggio della linea nel motore descrive cosa serve, non cosa non va:
// nell'avviso diventa un problema leggibile ("Linea normale: …").
export function testoProblema(p, impostazione, linea) {
  if (p.tipo !== 'linea') return p.messaggio
  const lc = LINEA_COERENTE[impostazione]
  const consigliate = (lc?.raccomandate ?? []).map((l) => lineaDifesaInfo(l).label.toLowerCase())
  const quale = `Linea ${lineaDifesaInfo(linea).label.toLowerCase()}`
  return consigliate.length > 0
    ? `${quale}, meglio ${consigliate.join(' o ')}: ${p.messaggio.charAt(0).toLowerCase()}${p.messaggio.slice(1)}`
    : `${quale}: ${p.messaggio}`
}
