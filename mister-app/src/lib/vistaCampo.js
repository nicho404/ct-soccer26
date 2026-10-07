// Indicatori sul campo del Modulo che il mister può accendere e spegnere.
// Salvati in meta 'vistaCampo' ({ chiave: boolean }); quello che manca vale
// acceso, così un indicatore nuovo compare senza dover toccare niente.
export const VOCI_VISTA = [
  { key: 'foto', label: 'Foto dei giocatori', desc: 'Spenta: al posto della foto il numero di maglia.' },
  { key: 'intese', label: 'Linee delle intese', desc: 'Le coppie e catene che si capiscono, tratteggiate.' },
  { key: 'ruoli', label: 'Ruolo tattico', desc: 'Il compito sotto la sigla (es. Mediano, Terzino).' },
  { key: 'compatibilita', label: 'Ruolo ricoperto', desc: '+ ruolo suo · ~ adattabile · ⚠️ fuori ruolo.' },
  { key: 'incarichi', label: 'Incarico per fase', desc: '⚔️ offensivo · 🛡️ difensivo · 🔄 entrambe.' },
  { key: 'cambi', label: 'Cambi pianificati', desc: '🔁 chi entra, sotto il giocatore che esce.' },
]

export const vistaCompleta = (salvata = {}) =>
  Object.fromEntries(VOCI_VISTA.map((v) => [v.key, salvata?.[v.key] ?? true]))
