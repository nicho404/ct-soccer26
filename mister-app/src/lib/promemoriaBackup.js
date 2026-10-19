// Promemoria backup: i dati vivono solo in questo browser, il file JSON è
// l'unica copia di sicurezza. Pura: riceve la data dell'ultimo export
// (db.meta 'ultimoBackup', ISO) e "adesso".
export const GIORNI_AVVISO = 7
export const GIORNI_ALLARME = 14

const GIORNO = 24 * 60 * 60 * 1000
const mezzanotte = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

// livello: 'recente' fino a 7 giorni, 'vecchio' oltre, 'scaduto' oltre 14
// o se non c'è mai stato un backup
export function statoBackup(ultimo, ora = new Date()) {
  const data = ultimo ? new Date(ultimo) : null
  if (!data || Number.isNaN(data.getTime())) return { giorni: null, livello: 'scaduto' }
  const giorni = Math.max(0, Math.round((mezzanotte(ora) - mezzanotte(data)) / GIORNO))
  const livello = giorni > GIORNI_ALLARME ? 'scaduto' : giorni > GIORNI_AVVISO ? 'vecchio' : 'recente'
  return { giorni, livello }
}

export const testoBackup = ({ giorni }) =>
  giorni == null ? 'Nessun backup ancora'
  : giorni === 0 ? 'Ultimo backup oggi'
  : giorni === 1 ? 'Ultimo backup ieri'
  : `Ultimo backup ${giorni} giorni fa`
