import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { IconChart } from '../components/icons'
import { normalizzaAnalisi, avanzamentoObiettivi, ultimaAnalisi, intestazioneAnalisi } from '../lib/analisi'

export default function AnalisiPage() {
  const navigate = useNavigate()
  const righe = useLiveQuery(() => db.analisi.toArray(), [])
  if (!righe) return null

  const lista = righe.map(normalizzaAnalisi).sort((a, b) =>
    b.data.localeCompare(a.data) || b.id - a.id
  )
  const inHome = ultimaAnalisi(lista)

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>Analisi</h1>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<IconChart />}
          title="Nessuna analisi"
          text="Dopo un blocco di partite e allenamenti fissa i punti chiave e gli obiettivi: la più recente resta in Home."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/analisi/nuova')}>
              + Nuova analisi
            </button>
          }
        />
      ) : (
        <>
          {lista.map((a) => {
            const { fatti, totale } = avanzamentoObiettivi(a)
            return (
              <Link to={`/analisi/${a.id}`} className="card tappable" key={a.id}>
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{a.titolo || 'Analisi'}</strong>
                    <div className="muted small">{intestazioneAnalisi(a)}</div>
                  </div>
                  {a.id === inHome.id && <span className="badge badge-accent">In Home</span>}
                  {totale > 0 && <span className="badge">{fatti}/{totale}</span>}
                </div>
              </Link>
            )
          })}
          <button className="fab" aria-label="Nuova analisi" onClick={() => navigate('/analisi/nuova')}>
            +
          </button>
        </>
      )}
    </div>
  )
}
