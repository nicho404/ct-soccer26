import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { TIPI_INTESA } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconLink } from '../components/icons'

export default function IntesePage() {
  const navigate = useNavigate()
  const intese = useLiveQuery(() => db.intese.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])

  if (!intese || !players) return null

  const nomeDi = (id) => {
    const p = players.find((x) => x.id === id)
    return p ? p.soprannome || p.nome : '?'
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Intese</h1>
        <span className="muted small">{intese.length}</span>
      </div>

      {intese.length === 0 ? (
        <EmptyState
          icon={<IconLink />}
          title="Nessuna intesa registrata"
          text="Le coppie e le catene di giocatori che si capiscono sono il vero motore del gioco. Registrale qui e le vedrai disegnate sul campo."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/intese/nuova')}>
              + Prima intesa
            </button>
          }
        />
      ) : (
        intese.map((i) => {
          const tipo = TIPI_INTESA.find((t) => t.value === i.tipo)
          return (
            <Link to={`/intese/${i.id}`} className="card tappable" key={i.id}>
              <div className="row">
                <span className="role-dot" style={{ background: tipo?.colore }} />
                <strong className="small" style={{ flex: 1 }}>
                  {(i.playerIds ?? []).map(nomeDi).join(' + ')}
                </strong>
                <span className="badge badge-accent">{tipo?.label ?? i.tipo}</span>
              </div>
              {i.descrizione && (
                <p className="small muted" style={{ margin: '8px 0 0' }}>{i.descrizione}</p>
              )}
              {i.fonte && (
                <p className="small muted" style={{ margin: '4px 0 0', opacity: 0.7 }}>
                  Fonte: {i.fonte}
                </p>
              )}
            </Link>
          )
        })
      )}

      {intese.length > 0 && (
        <button className="fab" aria-label="Nuova intesa" onClick={() => navigate('/intese/nuova')}>
          +
        </button>
      )}
    </div>
  )
}
