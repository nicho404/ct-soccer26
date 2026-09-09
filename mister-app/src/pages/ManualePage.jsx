import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { CATEGORIE_MANUALE } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconBook } from '../components/icons'

const categoriaLabel = (value) =>
  CATEGORIE_MANUALE.find((c) => c.value === value)?.label ?? value ?? '—'

// Anteprima di una voce: la prima riga di testo, tagliata.
const anteprima = (testo) => {
  const riga = (testo ?? '').trim().split('\n')[0]
  return riga.length > 120 ? `${riga.slice(0, 119)}…` : riga
}

export default function ManualePage() {
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState('tutte')
  const [cerca, setCerca] = useState('')
  const voci = useLiveQuery(() => db.manualEntries.toArray(), [])

  if (!voci) return null

  const q = cerca.trim().toLowerCase()
  const visibili = voci
    .filter((v) => categoria === 'tutte' || v.categoria === categoria)
    .filter((v) =>
      q === '' ||
      (v.titolo ?? '').toLowerCase().includes(q) ||
      (v.testo ?? '').toLowerCase().includes(q)
    )
    .sort((a, b) => (a.titolo ?? '').localeCompare(b.titolo ?? ''))

  // Solo le categorie che hanno qualcosa dentro: un filtro che porta sempre
  // a una lista vuota è un bottone che mente.
  const categoriePiene = CATEGORIE_MANUALE.filter((c) =>
    voci.some((v) => v.categoria === c.value)
  )

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Manuale</h1>
        <span className="muted small">{voci.length}</span>
      </div>

      {voci.length === 0 ? (
        <EmptyState
          icon={<IconBook />}
          title="Il manuale è vuoto"
          text="Principi, protocolli, regole del torneo, cosa dire nello spogliatoio: quello che oggi tieni a mente e domani non ricordi più."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/manuale/nuova')}>
              + Prima voce
            </button>
          }
        />
      ) : (
        <>
          <div className="field">
            <input
              className="input"
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
              placeholder="Cerca nel manuale…"
            />
          </div>

          <div className="chip-row">
            <button
              className={`chip chip-sm ${categoria === 'tutte' ? 'selected' : ''}`}
              onClick={() => setCategoria('tutte')}
            >
              Tutte
            </button>
            {categoriePiene.map((c) => (
              <button
                key={c.value}
                className={`chip chip-sm ${categoria === c.value ? 'selected' : ''}`}
                onClick={() => setCategoria(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {visibili.length === 0 ? (
            <div className="card muted small">Nessuna voce con questi filtri.</div>
          ) : (
            visibili.map((v) => (
              <Link to={`/manuale/${v.id}`} className="card tappable" key={v.id}>
                <div className="row">
                  <strong style={{ flex: 1, minWidth: 0 }}>{v.titolo || 'Senza titolo'}</strong>
                  <span className="badge badge-accent">{categoriaLabel(v.categoria)}</span>
                </div>
                {anteprima(v.testo) && (
                  <p className="small muted" style={{ margin: '8px 0 0' }}>{anteprima(v.testo)}</p>
                )}
              </Link>
            ))
          )}

          <button className="fab" aria-label="Nuova voce" onClick={() => navigate('/manuale/nuova')}>
            +
          </button>
        </>
      )}
    </div>
  )
}
