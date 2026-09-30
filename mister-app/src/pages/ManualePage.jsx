import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { CATEGORIE_MANUALE } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconBook } from '../components/icons'

const categoriaLabel = (value) =>
  CATEGORIE_MANUALE.find((c) => c.value === value)?.label ?? value ?? '—'

// Anteprima di una voce: la prima riga di testo. Il taglio a due righe lo
// fa il CSS, così usa tutta la larghezza dello schermo.
const anteprima = (testo) => (testo ?? '').trim().split('\n')[0]

export default function ManualePage({ incorporata = false }) {
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

  const corpo = (
    <>
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

          <div className="chip-row" style={{ marginBottom: 12 }}>
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
              <Link to={`/manuale/${v.id}`} className="card tappable voce-lista" key={v.id}>
                <span className="voce-categoria">{categoriaLabel(v.categoria)}</span>
                <strong>{v.titolo || 'Senza titolo'}</strong>
                {anteprima(v.testo) && <span className="voce-anteprima">{anteprima(v.testo)}</span>}
              </Link>
            ))
          )}

          <button className="fab" aria-label="Nuova voce" onClick={() => navigate('/manuale/nuova')}>
            +
          </button>
        </>
      )}
    </>
  )
  if (incorporata) return corpo

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Manuale</h1>
        <span className="muted small">{voci.length}</span>
      </div>

      {corpo}
    </div>
  )
}
