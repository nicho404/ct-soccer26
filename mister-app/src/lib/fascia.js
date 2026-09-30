// Fasce del gruppo: capitano e vice, salvati in meta ('capitano', 'vice').
// Un giocatore ne ha al massimo una.
export const FASCE = {
  capitano: { label: 'Capitano', sigla: 'C', className: 'fascia-capitano' },
  vice: { label: 'Vice', sigla: 'VC', className: 'fascia-vice' },
}

export const fasciaDi = (playerId, { capitanoId, viceId }) =>
  playerId == null ? null : playerId === capitanoId ? 'capitano' : playerId === viceId ? 'vice' : null
