import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { IconClipboardCheck } from '../components/icons'
import { durataPiano } from '../lib/presenze'

export default function PianiPage() {
  const navigate = useNavigate()
  const piani = useLiveQuery(() => db.sessionPlans.toArray(), [])

  if (!piani) return null

  const modelli = piani.filter((p) => p.isTemplate)

  const elimina = async (m) => {
    if (!window.confirm(`Eliminare il modello "${m.nome}"?`)) return
    await db.sessionPlans.delete(m.id)
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/presenze')}>‹</button>
        <h1>Modelli di seduta</h1>
        <span className="muted small">{modelli.length}</span>
      </div>

      {modelli.length === 0 ? (
        <EmptyState
          icon={<IconClipboardCheck />}
          title="Nessun modello"
          text="I modelli nascono dalle sedute: prepara il piano di un allenamento e salvalo con “Salva modello”. Da lì in poi lo riusi con un tocco."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/presenze/nuova')}>
              + Nuova seduta
            </button>
          }
        />
      ) : (
        modelli.map((m) => (
          <div className="card" key={m.id}>
            <div className="row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{m.nome}</strong>
                <div className="muted small">
                  {(m.blocchi ?? []).length} blocchi · {durataPiano(m)}′
                </div>
              </div>
              <button className="btn btn-sm" aria-label="Elimina modello" onClick={() => elimina(m)}>
                ✕
              </button>
            </div>
            {m.obiettivo && (
              <p className="small muted" style={{ margin: '8px 0 0' }}>{m.obiettivo}</p>
            )}
            {(m.blocchi ?? []).length > 0 && (
              <div className="muted small" style={{ marginTop: 8, opacity: 0.75 }}>
                {m.blocchi.map((b) => b.titolo || 'Blocco').join(' · ')}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
