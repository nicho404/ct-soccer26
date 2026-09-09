import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { IconTarget } from '../components/icons'
import { partiteContro, bilancio, esitoPartita, ESITO_INFO, formatDataPartita } from '../lib/partite'

export default function AvversariPage() {
  const navigate = useNavigate()
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const partite = useLiveQuery(() => db.matches.toArray(), [])

  if (!opponents || !partite) return null

  const ordinati = [...opponents].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Avversari</h1>
        <span className="muted small">{opponents.length}</span>
      </div>

      {opponents.length === 0 ? (
        <EmptyState
          icon={<IconTarget />}
          title="Nessuna squadra schedata"
          text="Le squadre nascono da sole quando metti una partita in calendario. Qui aggiungi quello che conta: come giocano e chi fa male."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/avversari/nuovo')}>
              + Prima squadra
            </button>
          }
        />
      ) : (
        <>
          {ordinati.map((o) => {
            const scontri = partiteContro(partite, o.id)
            const b = bilancio(scontri)
            const ultima = scontri.find((m) => esitoPartita(m))
            const esito = ultima ? esitoPartita(ultima) : null
            const schedata = Boolean(o.moduloAbituale || o.stile || (o.pericolosi ?? []).length > 0)
            return (
              <Link to={`/avversari/${o.id}`} className="card tappable" key={o.id}>
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{o.nome}</strong>
                    <div className="muted small">
                      {b.giocate > 0
                        ? `${b.vinte}V ${b.pari}N ${b.perse}P · ${b.golFatti}-${b.golSubiti}`
                        : 'Mai affrontata'}
                    </div>
                  </div>
                  {esito && (
                    <span className={`badge ${ESITO_INFO[esito].badge}`}>
                      {ultima.golFatti}-{ultima.golSubiti}
                    </span>
                  )}
                  {!schedata && <span className="badge badge-warn">Da schedare</span>}
                </div>
                {ultima && (
                  <div className="muted small" style={{ marginTop: 6, opacity: 0.75 }}>
                    Ultimo incontro: {formatDataPartita(ultima.data)}
                  </div>
                )}
              </Link>
            )
          })}

          <button className="fab" aria-label="Nuova squadra" onClick={() => navigate('/avversari/nuovo')}>
            +
          </button>
        </>
      )}
    </div>
  )
}
