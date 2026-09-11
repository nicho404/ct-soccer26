import { STATI_PRESENZA, famigliaRuolo } from '../db/constants'
import { nomeBreve } from '../lib/nomi'

// Sigle sui bottoni dell'appello: la riga deve stare su una schermata da
// telefono accanto al nome. Stesso appello per sedute e partite (M8):
// presente/assente/giustificato, mai un semplice sì/no.
const SIGLA = { presente: 'P', assente: 'A', giustificato: 'G' }

export default function AppelloPresenze({ giocatori, presenze, onSegna }) {
  return (
    <div className="card">
      {giocatori.map((p) => (
        <div className="crit-row" key={p.id}>
          <div className="crit-label">
            <span
              className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
              style={{ marginRight: 6 }}
            />
            {nomeBreve(p)}
          </div>
          <div className="vote-row">
            {STATI_PRESENZA.map((s) => (
              <button
                key={s.value}
                className={`vote-btn ${presenze[p.id] === s.value ? 'on' : ''}`}
                aria-label={`${nomeBreve(p)}: ${s.label}`}
                onClick={() => onSegna(p.id, s.value)}
              >
                {SIGLA[s.value]}
              </button>
            ))}
          </div>
        </div>
      ))}
      {giocatori.length === 0 && (
        <div className="muted small">Nessun giocatore attivo in rosa.</div>
      )}
    </div>
  )
}
