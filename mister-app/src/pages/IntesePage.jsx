import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { TIPI_INTESA } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconLink } from '../components/icons'
import { nomeBreve } from '../lib/nomi'

export default function IntesePage() {
  const navigate = useNavigate()
  const intese = useLiveQuery(() => db.intese.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])

  if (!intese || !players) return null

  const nomeDi = (id) => {
    const p = players.find((x) => x.id === id)
    return nomeBreve(p)
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
            <Link to={`/intese/${i.id}`} className="card tappable voce-lista" key={i.id}>
              <span className="voce-categoria" style={{ color: tipo?.colore }}>
                ● {tipo?.label ?? i.tipo}
              </span>
              <strong>{(i.playerIds ?? []).map(nomeDi).join(' + ')}</strong>
              {i.descrizione && <span className="voce-anteprima">{i.descrizione}</span>}
              {i.fonte && <span className="voce-fonte">Fonte: {i.fonte}</span>}
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
