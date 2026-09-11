// Presenze agli allenamenti (M5) e confronto con il minutaggio in partita.
// Puro: le pagine passano le righe Dexie, qui non si legge il database.
//
// L'appello di una seduta è `training.presenze = { [playerId]: stato }`, con
// gli stati di STATI_PRESENZA. Chi non compare nell'appello non era in rosa
// quel giorno: non conta né come presente né come assente (stessa regola di
// presenzaPct in lib/stats.js, di cui questo file è l'estensione).

// Soglia oltre la quale il divario tra campo e allenamento è un fatto,
// non rumore statistico: 25 punti su 100.
export const SOGLIA_DIVARIO = 25

// Sotto le 3 sedute qualsiasi percentuale è un caso, non una tendenza.
export const SEDUTE_MINIME = 3

export function contaSeduta(training) {
  const conteggio = { presenti: 0, assenti: 0, giustificati: 0, totale: 0 }
  for (const stato of Object.values(training?.presenze ?? {})) {
    if (!stato) continue
    conteggio.totale += 1
    if (stato === 'presente') conteggio.presenti += 1
    else if (stato === 'giustificato') conteggio.giustificati += 1
    else conteggio.assenti += 1
  }
  return conteggio
}

// Percentuale di presenza della squadra su una seduta: quanti di chi era
// atteso all'appello si sono presentati davvero.
export function pctSeduta(training) {
  const c = contaSeduta(training)
  return c.totale === 0 ? null : Math.round((c.presenti / c.totale) * 100)
}

// Id dei presenti a un evento (seduta o partita, stesso appello): il posto
// unico da cui derivare "chi c'è" invece di rileggere training.presenze o
// match.presenze a mano in ogni pagina.
export function presentiIds(evento) {
  return Object.entries(evento?.presenze ?? {})
    .filter(([, stato]) => stato === 'presente')
    .map(([pid]) => Number(pid))
}

const RIGA_VUOTA = () => ({ sedute: 0, presenti: 0, assenti: 0, giustificati: 0 })

// Aggregato per giocatore su tutte le sedute, ordinato per presenza decrescente.
export function aggregaPresenze(trainings = []) {
  const acc = new Map()
  for (const t of trainings) {
    for (const [pid, stato] of Object.entries(t?.presenze ?? {})) {
      if (!stato) continue
      const id = Number(pid)
      if (!acc.has(id)) acc.set(id, { playerId: id, ...RIGA_VUOTA() })
      const r = acc.get(id)
      r.sedute += 1
      if (stato === 'presente') r.presenti += 1
      else if (stato === 'giustificato') r.giustificati += 1
      else r.assenti += 1
    }
  }
  return [...acc.values()]
    .map((r) => ({ ...r, pct: Math.round((r.presenti / r.sedute) * 100) }))
    .sort((a, b) => b.pct - a.pct || b.sedute - a.sedute)
}

// Ultime `n` sedute di un giocatore, dalla più recente: serve a vedere una
// serie negativa che una media stagionale nasconderebbe.
export function serieRecente(trainings = [], playerId, n = 5) {
  return [...trainings]
    .filter((t) => t?.presenze?.[playerId])
    .sort((a, b) => String(b.data ?? '').localeCompare(String(a.data ?? '')))
    .slice(0, n)
    .map((t) => t.presenze[playerId])
}

// Confronto tra quanto uno si allena e quanto gioca.
//
// Il minutaggio è rapportato a chi ha giocato di più, non a una durata
// teorica: nel calcio amatoriale le partite saltano, i tornei cambiano, e
// l'unico metro onesto è "quanto ha giocato rispetto al più impiegato".
export function meritocrazia({ trainings = [], matches = [] } = {}) {
  const presenze = aggregaPresenze(trainings)

  const minutiPer = new Map()
  for (const m of matches) {
    for (const [pid, min] of Object.entries(m?.minuti ?? {})) {
      if (!(min > 0)) continue
      const id = Number(pid)
      minutiPer.set(id, (minutiPer.get(id) ?? 0) + min)
    }
  }
  const maxMinuti = Math.max(0, ...minutiPer.values())

  return presenze
    .map((r) => {
      const minuti = minutiPer.get(r.playerId) ?? 0
      const pctMinuti = maxMinuti === 0 ? null : Math.round((minuti / maxMinuti) * 100)
      const divario = pctMinuti === null ? null : pctMinuti - r.pct
      let livello = 'nd'
      if (divario !== null && r.sedute >= SEDUTE_MINIME) {
        if (divario >= SOGLIA_DIVARIO) livello = 'premiato'
        else if (divario <= -SOGLIA_DIVARIO) livello = 'penalizzato'
        else livello = 'inLinea'
      }
      return { ...r, minuti, pctMinuti, divario, livello }
    })
    .sort((a, b) => (b.divario ?? -Infinity) - (a.divario ?? -Infinity))
}

export const LIVELLI_MERITOCRAZIA = {
  premiato: {
    label: 'Gioca più di quanto si alleni',
    badge: 'badge-warn',
  },
  penalizzato: {
    label: 'Si allena più di quanto giochi',
    badge: 'badge-accent',
  },
  inLinea: { label: 'In linea', badge: 'badge-ok' },
  nd: { label: 'Dati insufficienti', badge: '' },
}

// Somma dei minuti dei blocchi di un piano seduta.
export function durataPiano(piano) {
  return (piano?.blocchi ?? []).reduce((tot, b) => tot + (Number(b.minuti) || 0), 0)
}
