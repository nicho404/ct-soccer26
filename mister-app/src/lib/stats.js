// Statistiche presenze e minutaggio calcolate dalle tabelle Dexie.

// % presenze di un giocatore sugli allenamenti in cui era in rosa
// (ha una voce nell'appello). null se nessun dato.
export function presenzaPct(trainings, playerId) {
  let tot = 0
  let presenti = 0
  for (const t of trainings) {
    const stato = t.presenze?.[playerId]
    if (!stato) continue
    tot += 1
    if (stato === 'presente') presenti += 1
  }
  if (tot === 0) return null
  return Math.round((presenti / tot) * 100)
}

// Minuti totali stagione di un giocatore dalle partite.
export function minutiTotali(matches, playerId) {
  let tot = 0
  for (const m of matches) {
    tot += m.minuti?.[playerId] ?? 0
  }
  return tot
}

// Minuti per competizione: [{ competitionId, minuti }] solo dove > 0.
export function minutiPerCompetizione(matches, playerId) {
  const acc = new Map()
  for (const m of matches) {
    const min = m.minuti?.[playerId] ?? 0
    if (min === 0) continue
    const key = m.competitionId ?? null
    acc.set(key, (acc.get(key) ?? 0) + min)
  }
  return [...acc.entries()].map(([competitionId, minuti]) => ({ competitionId, minuti }))
}

// Porta a rotazione: quante partite e quanti minuti ha coperto la porta.
// m.portaMinuti = { playerId: minuti }
export function statPorta(matches, playerId) {
  let partite = 0
  let minuti = 0
  for (const m of matches) {
    const min = m.portaMinuti?.[playerId] ?? 0
    if (min > 0) {
      partite += 1
      minuti += min
    }
  }
  return { partite, minuti }
}
