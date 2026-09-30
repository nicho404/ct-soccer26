// Storico partite (M6): dal referto di una partita ai minuti e agli aggregati
// stagionali. Tutto puro: le pagine passano i dati, qui non si tocca Dexie.
//
// I minuti NON si ricalcolano a ogni lettura: il referto li scrive sulla
// partita (`minuti`, `portaMinuti`), che è la forma che lib/stats.js già legge.

export const DURATA_DEFAULT = 60

// Un referto esiste quando la formazione è stata compilata: è quella a dire
// chi era in campo al minuto 0, senza la quale nessun minuto è calcolabile.
export const refertoCompilato = (m) =>
  Array.isArray(m?.formazione?.slots) && m.formazione.slots.some(Boolean)

export const titolariDi = (m) => (m?.formazione?.slots ?? []).filter(Boolean)

// Chi ha iniziato in porta: il giocatore nello slot con sigla POR.
// `sigle` sono le sigle del modulo usato, nello stesso ordine degli slot.
export function portiereIniziale(formazione, sigle) {
  const i = (sigle ?? []).indexOf('POR')
  if (i === -1) return null
  return formazione?.slots?.[i] ?? null
}

// Ordine cronologico degli eventi: a parità di minuto vale l'ordine di
// inserimento (sort stabile), che è l'ordine in cui il mister li ha visti.
const perMinuto = (eventi) => [...eventi].sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0))

const slotValido = (slots, i) => Number.isInteger(i) && i >= 0 && i < slots.length

// Applica un evento alla fotografia del campo (slotIndex -> playerId) e
// ritorna gli slot il cui occupante è cambiato. Muta `slots`.
//
// - cambio: chi esce libera il suo slot; chi entra va in `slotIndex` se
//   indicato, altrimenti al posto di chi esce (o nel primo slot libero, se
//   non esce nessuno). Se lo slot scelto è occupato, chi c'era scala nel posto
//   lasciato da chi esce: "entra l'ala, l'ala arretra in difesa".
//   Chi è già in campo non rientra, chi è uscito può rientrare (cambi volanti).
// - spostamento: il giocatore va in `slotIndex`, scambiandosi con chi c'era.
// - rosso: lo slot resta vuoto.
export function applicaEvento(slots, ev) {
  const toccati = []
  const metti = (i, pid) => { slots[i] = pid; toccati.push(i) }

  if (ev.tipo === 'cambio') {
    const da = ev.outId != null ? slots.indexOf(ev.outId) : -1
    if (da !== -1) metti(da, null)
    if (ev.inId == null || slots.includes(ev.inId)) return toccati
    let verso = slotValido(slots, ev.slotIndex) ? ev.slotIndex : da
    if (verso !== -1 && slots[verso] != null && verso !== da) {
      // lo slot scelto è occupato: chi c'era scala nel posto di chi esce, o
      // se non esce nessuno il subentrato ripiega sul primo slot libero
      if (da !== -1) metti(da, slots[verso])
      else verso = -1
    }
    if (verso === -1) verso = slots.indexOf(null)
    if (verso !== -1) metti(verso, ev.inId)
  } else if (ev.tipo === 'spostamento') {
    const da = ev.playerId != null ? slots.indexOf(ev.playerId) : -1
    if (da === -1 || !slotValido(slots, ev.slotIndex) || da === ev.slotIndex) return toccati
    const altro = slots[ev.slotIndex]
    metti(ev.slotIndex, ev.playerId)
    metti(da, altro)
  } else if (ev.tipo === 'rosso') {
    const da = ev.playerId != null ? slots.indexOf(ev.playerId) : -1
    if (da !== -1) metti(da, null)
  }
  return toccati
}

// Chi è in campo, slot per slot, dopo tutti gli eventi fino al minuto
// indicato compreso (senza minuto: a fine partita). Serve al referto per
// proporre "chi esce" tra chi gioca davvero in quel momento e "chi entra"
// tra tutti gli altri, compreso chi era già uscito.
export function campoAlMinuto(slotsIniziali = [], eventi = [], minuto = Infinity) {
  const slots = [...slotsIniziali]
  for (const ev of perMinuto(eventi)) {
    if ((ev.minuto ?? 0) > minuto) break
    applicaEvento(slots, ev)
  }
  return slots
}

// Espulsi fino al minuto indicato: non possono più rientrare.
export function espulsiAlMinuto(eventi = [], minuto = Infinity) {
  return new Set(
    eventi
      .filter((ev) => ev.tipo === 'rosso' && ev.playerId != null && (ev.minuto ?? 0) <= minuto)
      .map((ev) => ev.playerId)
  )
}

// Minuti giocati da ciascuno, ricostruiti da titolari + cambi + espulsioni.
// Un giocatore può uscire e rientrare: i minuti si sommano sui vari spezzoni.
//
// La porta: se si conoscono gli slot iniziali e l'indice dello slot POR, il
// portiere è chi occupa quello slot istante per istante (segue cambi con
// posizione e spostamenti). Altrimenti vale la catena delle sostituzioni:
// se esce il portiere, chi entra al suo posto eredita il ruolo.
export function calcolaMinuti({
  titolari = [],
  eventi = [],
  durata = DURATA_DEFAULT,
  portiereIniziale: portiereDa = null,
  slots: slotsIniziali = null,
  slotPortiere = -1,
} = {}) {
  const minuti = {}
  const portaMinuti = {}
  const entrata = new Map()
  for (const pid of titolari) if (pid != null) entrata.set(pid, 0)

  const campo = Array.isArray(slotsIniziali) && slotValido(slotsIniziali, slotPortiere)
    ? [...slotsIniziali]
    : null
  let portiere = campo ? campo[slotPortiere] ?? null : portiereDa
  let portaDa = portiere == null ? null : 0

  // Un minuto fuori scala (99′ in una partita da 60) non deve produrre
  // minutaggi assurdi: si schiaccia dentro la durata.
  const clampa = (m) => Math.max(0, Math.min(durata, Number(m) || 0))

  const chiudi = (pid, fine) => {
    const da = entrata.get(pid)
    if (da == null) return
    minuti[pid] = (minuti[pid] ?? 0) + Math.max(0, fine - da)
    entrata.delete(pid)
  }

  const chiudiPorta = (fine) => {
    if (portiere == null || portaDa == null) return
    portaMinuti[portiere] = (portaMinuti[portiere] ?? 0) + Math.max(0, fine - portaDa)
    portaDa = null
  }

  const nuovoPortiere = (pid, m) => {
    if (pid === portiere) return
    chiudiPorta(m)
    portiere = pid ?? null
    portaDa = pid == null ? null : m
  }

  const ordinati = [...eventi].sort((a, b) => clampa(a.minuto) - clampa(b.minuto))

  for (const ev of ordinati) {
    const m = clampa(ev.minuto)
    if (ev.tipo === 'cambio') {
      if (ev.outId != null) chiudi(ev.outId, m)
      // chi è già in campo non "rientra": un cambio duplicato non raddoppia i minuti
      if (ev.inId != null && !entrata.has(ev.inId)) entrata.set(ev.inId, m)
    } else if (ev.tipo === 'rosso') {
      if (ev.playerId != null) chiudi(ev.playerId, m)
    }

    if (campo) {
      applicaEvento(campo, ev)
      nuovoPortiere(campo[slotPortiere], m)
    } else if (ev.tipo === 'cambio' && ev.outId != null && ev.outId === portiere) {
      nuovoPortiere(ev.inId, m)
    } else if (ev.tipo === 'rosso' && ev.playerId != null && ev.playerId === portiere) {
      nuovoPortiere(null, m)
    }
  }

  for (const pid of [...entrata.keys()]) chiudi(pid, durata)
  chiudiPorta(durata)

  return { minuti, portaMinuti }
}

// Eventi che non tornano con la formazione: chi esce non è in campo, chi
// entra c'è già o è stato espulso, chi cambia posizione non sta giocando.
// Succede se si inserisce un cambio a un minuto sbagliato o se si ritocca la
// formazione iniziale dopo aver registrato i cambi: l'evento resta salvato
// ma non ha effetto, e i minuti non tornano. Ritorna evento.id -> motivo.
export function eventiIncoerenti(slotsIniziali = [], eventi = [], nomeDi = String) {
  const slots = [...slotsIniziali]
  const espulsi = new Set()
  const problemi = new Map()
  for (const ev of perMinuto(eventi)) {
    const al = `al ${ev.minuto ?? 0}′`
    const motivi = []
    if (ev.tipo === 'cambio') {
      if (ev.outId != null && !slots.includes(ev.outId)) motivi.push(`${nomeDi(ev.outId)} non è in campo ${al}`)
      if (ev.inId != null && slots.includes(ev.inId)) motivi.push(`${nomeDi(ev.inId)} è già in campo ${al}`)
      if (ev.inId != null && espulsi.has(ev.inId)) motivi.push(`${nomeDi(ev.inId)} è stato espulso`)
    } else if (ev.tipo === 'spostamento') {
      if (ev.playerId != null && !slots.includes(ev.playerId)) motivi.push(`${nomeDi(ev.playerId)} non è in campo ${al}`)
    }
    if (motivi.length > 0 && ev.id != null) problemi.set(ev.id, motivi.join('; '))
    if (ev.tipo === 'rosso' && ev.playerId != null) espulsi.add(ev.playerId)
    applicaEvento(slots, ev)
  }
  return problemi
}

// Incarico assegnato e svolto da un giocatore, partita per partita (solo
// quelle in cui almeno uno dei due è segnato), dalla più recente.
export function incarichiGiocatore(matches = [], playerId) {
  return matches
    .map((m) => ({
      matchId: m.id,
      data: m.data,
      opponentId: m.opponentId,
      assegnato: m.formazione?.incarichi?.[playerId] ?? null,
      svolto: m.formazione?.incarichiSvolti?.[playerId] ?? null,
    }))
    .filter((r) => r.assegnato || r.svolto)
    .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
}

// Chi ha occupato ogni slot durante la partita: titolare, e ogni giocatore
// che ci è passato via cambio (anche con posizione scelta) o spostamento.
// Un cambio senza un uscente riconoscibile e senza slot libero (dato
// incoerente) non si può agganciare a una posizione: resta fuori.
// Ritorna un elemento per ogni slot con almeno un occupante, in ordine
// cronologico di occupazione.
export function occupantiPerSlot(match, modulo) {
  const slots = [...(match?.formazione?.slots ?? [])]
  const storia = slots.map((pid) => (pid != null ? [pid] : []))

  for (const ev of perMinuto(match?.eventi ?? [])) {
    for (const i of applicaEvento(slots, ev)) {
      const pid = slots[i]
      if (pid != null && storia[i].at(-1) !== pid) storia[i].push(pid)
    }
  }

  return storia
    .map((playerIds, i) => ({ slotIndex: i, sigla: modulo?.slots?.[i]?.sigla, playerIds }))
    .filter((r) => r.playerIds.length > 0)
}

// Gol contati dagli eventi, da confrontare col risultato scritto a mano in M3.
export function golDaEventi(eventi = []) {
  let fatti = 0
  let subiti = 0
  for (const ev of eventi) {
    if (ev.tipo === 'gol') fatti += 1
    else if (ev.tipo === 'golSubito') subiti += 1
  }
  return { fatti, subiti }
}

// null se non c'è niente da segnalare, altrimenti i due risultati a confronto.
// Il risultato scritto a mano resta la verità: gli eventi possono essere
// incompleti (nessuno segna i marcatori avversari a bordo campo).
export function disallineamentoRisultato(match) {
  if (!match || !Array.isArray(match.eventi) || match.eventi.length === 0) return null
  if (!Number.isFinite(match.golFatti) || !Number.isFinite(match.golSubiti)) return null
  const da = golDaEventi(match.eventi)
  if (da.fatti === match.golFatti && da.subiti === match.golSubiti) return null
  return { eventi: da, risultato: { fatti: match.golFatti, subiti: match.golSubiti } }
}

const VUOTO = () => ({
  presenze: 0, titolarita: 0, minuti: 0, gol: 0, assist: 0, gialli: 0, rossi: 0,
})

// Aggregati stagionali per giocatore, dalle partite con referto.
// Ritorna un array ordinato per minuti giocati (decrescente).
export function aggregaGiocatori(matches = []) {
  const acc = new Map()
  const riga = (pid) => {
    if (!acc.has(pid)) acc.set(pid, { playerId: pid, ...VUOTO() })
    return acc.get(pid)
  }

  for (const m of matches) {
    if (!refertoCompilato(m)) continue

    for (const [pid, min] of Object.entries(m.minuti ?? {})) {
      if (min <= 0) continue
      const r = riga(Number(pid))
      r.presenze += 1
      r.minuti += min
    }
    for (const pid of titolariDi(m)) riga(pid).titolarita += 1

    for (const ev of m.eventi ?? []) {
      if (ev.tipo === 'gol') {
        if (ev.playerId != null) riga(ev.playerId).gol += 1
        if (ev.assistId != null) riga(ev.assistId).assist += 1
      } else if (ev.tipo === 'giallo' && ev.playerId != null) {
        riga(ev.playerId).gialli += 1
      } else if (ev.tipo === 'rosso' && ev.playerId != null) {
        riga(ev.playerId).rossi += 1
      }
    }
  }

  return [...acc.values()].sort((a, b) => b.minuti - a.minuti || b.gol - a.gol)
}

// Solo chi ha almeno un gol o un assist, ordinato per gol e poi assist.
export function classificaMarcatori(matches = []) {
  return aggregaGiocatori(matches)
    .filter((r) => r.gol > 0 || r.assist > 0)
    .sort((a, b) => b.gol - a.gol || b.assist - a.assist)
}
