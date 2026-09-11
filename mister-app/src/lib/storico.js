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

// Minuti giocati da ciascuno, ricostruiti da titolari + cambi + espulsioni.
// La porta segue la catena delle sostituzioni: se esce il portiere, chi
// entra al suo posto eredita il ruolo fino a fine partita (o a un altro cambio).
export function calcolaMinuti({
  titolari = [],
  eventi = [],
  durata = DURATA_DEFAULT,
  portiereIniziale: portiereDa = null,
} = {}) {
  const minuti = {}
  const portaMinuti = {}
  const entrata = new Map()
  for (const pid of titolari) if (pid != null) entrata.set(pid, 0)

  let portiere = portiereDa
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

  const ordinati = [...eventi].sort((a, b) => clampa(a.minuto) - clampa(b.minuto))

  for (const ev of ordinati) {
    const m = clampa(ev.minuto)
    if (ev.tipo === 'cambio') {
      const eraPortiere = ev.outId != null && ev.outId === portiere
      if (ev.outId != null) chiudi(ev.outId, m)
      if (eraPortiere) {
        chiudiPorta(m)
        portiere = ev.inId ?? null
        portaDa = ev.inId == null ? null : m
      }
      // chi è già in campo non "rientra": un cambio duplicato non raddoppia i minuti
      if (ev.inId != null && !entrata.has(ev.inId)) entrata.set(ev.inId, m)
    } else if (ev.tipo === 'rosso') {
      if (ev.playerId != null && ev.playerId === portiere) {
        chiudiPorta(m)
        portiere = null
      }
      if (ev.playerId != null) chiudi(ev.playerId, m)
    }
  }

  for (const pid of [...entrata.keys()]) chiudi(pid, durata)
  chiudiPorta(durata)

  return { minuti, portaMinuti }
}

// Chi ha occupato ogni slot durante la partita: titolare, e ogni sostituto
// che ne ha ereditato la posizione via evento 'cambio' (stessa logica della
// porta in calcolaMinuti, generalizzata a tutti gli slot). Un cambio senza
// un uscente riconoscibile in nessuno slot (dato incoerente, o inId senza
// outId) non si può agganciare a una posizione: resta fuori.
// Ritorna un elemento per ogni slot con almeno un occupante, in ordine
// cronologico di occupazione.
export function occupantiPerSlot(match, modulo) {
  const slotsIniziali = match?.formazione?.slots ?? []
  const occupante = new Map() // slotIndex -> playerId attuale
  const storia = slotsIniziali.map((pid) => (pid != null ? [pid] : []))
  slotsIniziali.forEach((pid, i) => { if (pid != null) occupante.set(i, pid) })

  const eventi = [...(match?.eventi ?? [])].sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0))
  for (const ev of eventi) {
    if (ev.tipo !== 'cambio' || ev.outId == null) continue
    const voce = [...occupante.entries()].find(([, pid]) => pid === ev.outId)
    if (!voce) continue
    const [slotIndex] = voce
    if (ev.inId != null) {
      occupante.set(slotIndex, ev.inId)
      storia[slotIndex].push(ev.inId)
    } else {
      occupante.delete(slotIndex)
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
