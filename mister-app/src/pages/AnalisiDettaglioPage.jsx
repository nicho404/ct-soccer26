import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { PuntiChiave, Obiettivi } from '../components/Analisi'
import { normalizzaAnalisi, avanzamentoObiettivi, TIPI_PUNTO, intestazioneAnalisi } from '../lib/analisi'

export default function AnalisiDettaglioPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  // null = non trovata, undefined = in lettura
  const riga = useLiveQuery(() => db.analisi.get(Number(id)).then((a) => a ?? null), [id])
  if (riga === undefined) return null

  const header = (titolo) => (
    <div className="page-header">
      <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
      <h1>{titolo}</h1>
    </div>
  )

  if (riga === null) {
    return (
      <div className="page">
        {header('Analisi')}
        <p className="muted">Analisi non trovata.</p>
      </div>
    )
  }

  const a = normalizzaAnalisi(riga)
  const { fatti, totale } = avanzamentoObiettivi(a)

  const elimina = async () => {
    if (!window.confirm(`Eliminare l'analisi "${a.titolo || 'senza titolo'}"?`)) return
    await db.analisi.delete(a.id)
    navigate('/analisi', { replace: true })
  }

  return (
    <div className="page">
      {header(a.titolo || 'Analisi')}

      <div className="card analisi-card">
        <div className="muted small">{intestazioneAnalisi(a)}</div>
        {a.sintesi && <p className="analisi-sintesi">{a.sintesi}</p>}
      </div>

      {TIPI_PUNTO.map((t) => {
        const punti = a.puntiChiave.filter((p) => (p.tipo ?? 'novita') === t.value)
        if (punti.length === 0) return null
        return (
          <div key={t.value}>
            <div className="section-title">{t.icona} {t.label}</div>
            <PuntiChiave punti={punti} />
          </div>
        )
      })}

      {totale > 0 && (
        <>
          <div className="section-title">Obiettivi ({fatti}/{totale})</div>
          <Obiettivi analisi={a} />
        </>
      )}

      {a.sezioni.map((s, i) => (
        <div className="analisi-sezione" key={i}>
          <div className="section-title">{s.titolo || 'Note'}</div>
          <div className="card">
            <ul style={{ margin: 0 }}>
              {s.punti.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
          </div>
        </div>
      ))}

      {a.fonte && <p className="muted small">Fonte: {a.fonte}</p>}

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 14 }}
        onClick={() => navigate(`/analisi/${a.id}/modifica`)}
      >
        Modifica
      </button>
      <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
        Elimina analisi
      </button>
    </div>
  )
}
