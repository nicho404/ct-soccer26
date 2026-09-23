// Girone (M11): classifica, giornate, marcatori e cartellini avversari.
// Tutto puro: riceve le righe del db già lette, non tocca Dexie.
//
// Due fonti per le gare della competizione:
// - partiteGirone: partite tra altre squadre (casaId/ospiteId = opponents.id)
// - matches: le nostre, dove noi siamo la squadra NOI e l'avversario è
//   opponentId; i loro marcatori e cartellini sono in eventiAvversari.
import { partitaGiocata } from './partite'

// squadraId della nostra squadra in classifica e nelle penalità
export const NOI = 0

export const TIPI_EVENTO_AVVERSARI = [
  { value: 'gol', label: 'Gol', icona: '⚽' },
  { value: 'giallo', label: 'Giallo', icona: '🟨' },
  { value: 'rosso', label: 'Rosso', icona: '🟥' },
]

export const conRisultato = (g) => Number.isFinite(g?.golCasa) && Number.isFinite(g?.golOspite)

// Porta partiteGirone e matches nella stessa forma: { fonte, id, casaId,
// ospiteId, golCasa, golOspite, eventi: [{ tipo, squadraId, giocatoreId }] }.
// Una nostra partita in trasferta ci mette ospiti; casa e campo neutro, in casa.
export function gare({ partiteGirone = [], matches = [] }) {
  const out = []
  for (const p of partiteGirone) {
    out.push({
      fonte: 'girone',
      id: p.id,
      competitionId: p.competitionId ?? null,
      giornata: p.giornata ?? null,
      data: p.data || null,
      ora: p.ora ?? '',
      casaId: p.casaId,
      ospiteId: p.ospiteId,
      golCasa: Number.isFinite(p.golCasa) ? p.golCasa : null,
      golOspite: Number.isFinite(p.golOspite) ? p.golOspite : null,
      eventi: p.eventi ?? [],
    })
  }
  for (const m of matches) {
    if (m.opponentId == null) continue
    const fuori = m.campo === 'trasferta'
    const giocata = partitaGiocata(m)
    out.push({
      fonte: 'match',
      id: m.id,
      competitionId: m.competitionId ?? null,
      giornata: m.giornata ?? null,
      data: m.data || null,
      ora: m.ora ?? '',
      casaId: fuori ? m.opponentId : NOI,
      ospiteId: fuori ? NOI : m.opponentId,
      golCasa: giocata ? (fuori ? m.golSubiti : m.golFatti) : null,
      golOspite: giocata ? (fuori ? m.golFatti : m.golSubiti) : null,
      eventi: (m.eventiAvversari ?? []).map((e) => ({ ...e, squadraId: m.opponentId })),
    })
  }
  return out
}

// Ordine cronologico per i cartellini: una gara senza data va in fondo,
// perché di solito è una riga importata o appena inserita.
const chiaveTempo = (g) => `${g.data ?? '9999-99-99'} ${g.ora ?? ''} ${String(g.giornata ?? 0).padStart(3, '0')}`
const perTempo = (a, b) => chiaveTempo(a).localeCompare(chiaveTempo(b))

export const nomeSquadra = (id, { opponents = [], nomeNostro = '' }) =>
  id === NOI
    ? nomeNostro || 'Noi'
    : opponents.find((o) => o.id === id)?.nome ?? 'Squadra sconosciuta'

const rigaVuota = (squadraId) => ({
  squadraId, pt: 0, g: 0, v: 0, n: 0, p: 0, f: 0, s: 0, dr: 0, penalita: 0,
})

// Somma le gare con risultato sulle righe della mappa (solo le squadre presenti).
function accumula(righe, lista) {
  for (const g of lista) {
    const lati = [[g.casaId, g.golCasa, g.golOspite], [g.ospiteId, g.golOspite, g.golCasa]]
    for (const [id, fatti, subiti] of lati) {
      const r = righe.get(id)
      if (!r) continue
      r.g += 1
      r.f += fatti
      r.s += subiti
      if (fatti > subiti) { r.v += 1; r.pt += 3 }
      else if (fatti === subiti) { r.n += 1; r.pt += 1 }
      else r.p += 1
    }
  }
}

// Classifica con tie-break Serie C LC8:
// punti → punti negli scontri diretti (mini-classifica sulle sole gare già
// giocate tra le squadre a pari punti) → differenza reti → gol fatti → gol
// subiti. Oltre non si va: ranking e sorteggio non sono dati che abbiamo,
// quindi la parità residua esce come pariNonRisolta, non come ordine inventato.
export function classifica(competitionId, dati) {
  const { competitions = [] } = dati
  const tutte = gare(dati).filter((g) => g.competitionId === competitionId)
  const giocate = tutte.filter(conRisultato)
  const penalita = competitions.find((c) => c.id === competitionId)?.penalita ?? []

  const ids = new Set()
  for (const g of tutte) { ids.add(g.casaId); ids.add(g.ospiteId) }
  for (const p of penalita) ids.add(p.squadraId)

  const righe = new Map([...ids].map((id) => [id, rigaVuota(id)]))
  accumula(righe, giocate)
  for (const p of penalita) {
    // i punti di penalità si tolgono: il segno con cui sono scritti non conta
    righe.get(p.squadraId).penalita += Math.abs(Number(p.punti) || 0)
  }
  for (const r of righe.values()) {
    r.pt -= r.penalita
    r.dr = r.f - r.s
    r.nome = nomeSquadra(r.squadraId, dati)
    r.nostra = r.squadraId === NOI
  }

  // mini-classifica per ogni gruppo a pari punti
  const gruppi = new Map()
  for (const r of righe.values()) {
    if (!gruppi.has(r.pt)) gruppi.set(r.pt, [])
    gruppi.get(r.pt).push(r)
  }
  for (const gruppo of gruppi.values()) {
    if (gruppo.length < 2) { gruppo[0].ptDiretti = 0; continue }
    const set = new Set(gruppo.map((r) => r.squadraId))
    const mini = new Map(gruppo.map((r) => [r.squadraId, rigaVuota(r.squadraId)]))
    accumula(mini, giocate.filter((g) => set.has(g.casaId) && set.has(g.ospiteId)))
    for (const r of gruppo) r.ptDiretti = mini.get(r.squadraId).pt
  }

  const criteri = (a, b) =>
    b.pt - a.pt || b.ptDiretti - a.ptDiretti || b.dr - a.dr || b.f - a.f || a.s - b.s
  const lista = [...righe.values()].sort((a, b) => criteri(a, b) || a.nome.localeCompare(b.nome))

  // parità residua: conta solo tra squadre che hanno giocato, altrimenti a
  // inizio stagione sarebbe tutto "non risolto"
  for (let i = 0; i < lista.length; i += 1) {
    const r = lista[i]
    r.pos = i > 0 && criteri(lista[i - 1], r) === 0 ? lista[i - 1].pos : i + 1
    const pari = [lista[i - 1], lista[i + 1]].some((x) => x && criteri(x, r) === 0)
    r.pariNonRisolta = pari && r.g > 0
  }

  return { righe: lista, pariNonRisolta: lista.some((r) => r.pariNonRisolta) }
}

// Per giornata: gare inserite (nostre comprese) su quelle attese. Le attese
// sono squadre / 2, con le squadre contate su tutta la competizione.
export function statoGiornate(competitionId, dati) {
  const tutte = gare(dati).filter((g) => g.competitionId === competitionId)
  const squadre = new Set(tutte.flatMap((g) => [g.casaId, g.ospiteId]))
  const attese = Math.floor(squadre.size / 2)
  const perGiornata = new Map()
  for (const g of tutte) {
    if (g.giornata == null) continue
    const s = perGiornata.get(g.giornata) ?? { giornata: g.giornata, inserite: 0, giocate: 0, attese }
    s.inserite += 1
    if (conRisultato(g)) s.giocate += 1
    perGiornata.set(g.giornata, s)
  }
  return [...perGiornata.values()]
    .map((s) => ({ ...s, incompleta: s.inserite < s.attese }))
    .sort((a, b) => a.giornata - b.giornata)
}

const nomeGiocatore = (id, giocatori) => giocatori.find((g) => g.id === id)?.nome ?? 'Giocatore sconosciuto'

// Marcatori avversari, dal più prolifico. Di default solo la competizione
// indicata; con tutteLeCompetizioni la somma di tutto quello che è inserito.
export function marcatori(competitionId, dati, { tutteLeCompetizioni = false } = {}) {
  const { giocatoriAvversari = [] } = dati
  const conta = new Map()
  for (const g of gare(dati)) {
    if (!tutteLeCompetizioni && g.competitionId !== competitionId) continue
    for (const e of g.eventi) {
      if (e.tipo !== 'gol' || e.giocatoreId == null || e.squadraId === NOI) continue
      const r = conta.get(e.giocatoreId) ?? { giocatoreId: e.giocatoreId, squadraId: e.squadraId, gol: 0 }
      r.gol += 1
      conta.set(e.giocatoreId, r)
    }
  }
  return [...conta.values()]
    .map((r) => ({
      ...r,
      nome: nomeGiocatore(r.giocatoreId, giocatoriAvversari),
      squadra: nomeSquadra(r.squadraId, dati),
    }))
    .sort((a, b) => b.gol - a.gol || a.nome.localeCompare(b.nome))
}

// Cartellini avversari su tutte le competizioni (reg. 3.14: si sommano).
// Squalifica per la gara successiva con: rosso; due gialli nella stessa
// gara; il 4° giallo e ogni multiplo di 4. Diffidato chi è a gialli % 4 === 3.
// La squalifica è da scontare finché la squadra del giocatore non gioca una
// gara (con risultato) successiva a quella della sanzione.
export function cartellini(dati) {
  const { giocatoriAvversari = [] } = dati
  const cronologia = gare(dati).sort(perTempo)
  const perGiocatore = new Map()

  cronologia.forEach((g, indice) => {
    const inGara = new Map()
    for (const e of g.eventi) {
      if ((e.tipo !== 'giallo' && e.tipo !== 'rosso') || e.giocatoreId == null || e.squadraId === NOI) continue
      const c = inGara.get(e.giocatoreId) ?? { squadraId: e.squadraId, gialli: 0, rossi: 0 }
      if (e.tipo === 'giallo') c.gialli += 1
      else c.rossi += 1
      inGara.set(e.giocatoreId, c)
    }
    for (const [giocatoreId, c] of inGara) {
      const r = perGiocatore.get(giocatoreId) ??
        { giocatoreId, squadraId: c.squadraId, gialli: 0, rossi: 0, squalifica: null }
      const prima = r.gialli
      r.gialli += c.gialli
      r.rossi += c.rossi
      const motivo =
        c.rossi > 0 ? 'Espulsione'
        : c.gialli >= 2 ? 'Doppia ammonizione'
        : Math.floor(r.gialli / 4) > Math.floor(prima / 4) ? `${r.gialli}° giallo`
        : null
      if (motivo) r.squalifica = { motivo, data: g.data, fonte: g.fonte, garaId: g.id, indice }
      perGiocatore.set(giocatoreId, r)
    }
  })

  const haGiocatoDopo = (squadraId, s) =>
    cronologia.some((g, i) =>
      conRisultato(g) &&
      (g.casaId === squadraId || g.ospiteId === squadraId) &&
      i !== s.indice &&
      (s.data && g.data ? g.data > s.data : i > s.indice)
    )

  return [...perGiocatore.values()]
    .map((r) => ({
      ...r,
      nome: nomeGiocatore(r.giocatoreId, giocatoriAvversari),
      squadra: nomeSquadra(r.squadraId, dati),
      diffidato: r.gialli % 4 === 3,
      daScontare: Boolean(r.squalifica) && !haGiocatoDopo(r.squadraId, r.squalifica),
    }))
    .sort((a, b) => a.squadra.localeCompare(b.squadra) || a.nome.localeCompare(b.nome))
}

// Gol negli eventi che non tornano col risultato. Solo un avviso: non si
// segnala nulla finché non c'è almeno un marcatore inserito, perché spesso
// i marcatori degli altri non si sanno. Accetta una partita del girone
// ({ casaId, ospiteId, golCasa, golOspite, eventi }) o una nostra
// ({ golSubiti, eventiAvversari }, dove contano solo i gol subiti).
// Restituisce null se è tutto a posto, altrimenti [{ squadraId, risultato, eventi }].
export function disallineamentoGirone(partita) {
  const lati = 'eventiAvversari' in partita || !('casaId' in partita)
    ? [{ squadraId: null, risultato: partita.golSubiti, eventi: partita.eventiAvversari ?? [] }]
    : [
        { squadraId: partita.casaId, risultato: partita.golCasa },
        { squadraId: partita.ospiteId, risultato: partita.golOspite },
      ].map((l) => ({ ...l, eventi: (partita.eventi ?? []).filter((e) => e.squadraId === l.squadraId) }))

  const conGol = lati.map((l) => ({
    squadraId: l.squadraId,
    risultato: Number.isFinite(l.risultato) ? l.risultato : null,
    eventi: l.eventi.filter((e) => e.tipo === 'gol').length,
  }))
  if (conGol.every((l) => l.eventi === 0)) return null
  const storti = conGol.filter((l) => l.eventi !== (l.risultato ?? 0))
  return storti.length > 0 ? storti : null
}

// Nomi dei giocatori avversari: "Cognome Nome", spazi normalizzati, e il
// confronto non guarda le maiuscole, così "costa t." ritrova "Costa T.".
export const pulisciNome = (s) => (s ?? '').trim().replace(/\s+/g, ' ')

export function trovaGiocatore(giocatori, opponentId, nome) {
  const cercato = pulisciNome(nome).toLowerCase()
  if (!cercato) return null
  return giocatori.find(
    (g) => g.opponentId === opponentId && pulisciNome(g.nome).toLowerCase() === cercato
  ) ?? null
}
