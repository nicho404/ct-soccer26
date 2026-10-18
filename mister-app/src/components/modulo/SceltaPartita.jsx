import Scelta from '../Scelta'
import { partiteInProgramma, partiteGiocate, formatDataPartita } from '../../lib/partite'
import { presentiIds } from '../../lib/presenze'

// Di quale partita sono i giocatori: con una partita scelta, disponibili e
// panchina sono solo i presenti. Sempre visibile, anche a rosa vuota:
// altrimenti selezionare una partita senza presenti segnati blocca la pagina
// senza via d'uscita se non seguire il link "Vai alla partita".
export default function SceltaPartita({ matches, matchId, partita, nomeAvversarioDi, onCambia }) {
  const opzioni = [
    { value: '__nessuna__', label: 'Tutti gli attivi' },
    ...[...partiteInProgramma(matches), ...partiteGiocate(matches)].map((m) => ({
      value: m.id,
      label: `${nomeAvversarioDi(m)} · ${formatDataPartita(m.data)}`,
    })),
  ]
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Scelta
          titolo="Giocatori di quale partita?"
          className="select select-compatta"
          value={matchId ?? '__nessuna__'}
          onChange={(e) => onCambia(e.target.value === '__nessuna__' ? null : Number(e.target.value))}
        >
          {opzioni.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Scelta>
      </div>
      {partita && (
        <p className="muted small" style={{ margin: '0 0 10px' }}>
          Solo i {presentiIds(partita).length} presenti per {nomeAvversarioDi(partita)}.
        </p>
      )}
    </>
  )
}
