import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { isAttivo } from '../db/constants'
import EmptyState from '../components/EmptyState'

export default function HomePage() {
  const navigate = useNavigate()
  const players = useLiveQuery(() => db.players.toArray(), [])

  if (!players) return null

  const attivi = players.filter(isAttivo)
  const acciaccati = attivi.filter((p) => p.acciaccato || p.statoAttivita === 'infortunato')
  const daVerificare = attivi.filter((p) => p.tesseramento === 'da_verificare')
  const nonTesserabili = attivi.filter((p) => p.tesseramento === 'non_tesserabile')
  const portieri = attivi.filter((p) => p.porta === 'si')

  const alerts = []
  if (attivi.length > 0 && portieri.length === 0) {
    alerts.push({ level: 'danger', icon: '🧤', text: 'Porta scoperta: nessun giocatore attivo copre la porta stabilmente.' })
  }
  if (acciaccati.length > 0) {
    alerts.push({ level: 'warn', icon: '🩹', text: `Acciaccati o infortunati: ${acciaccati.map((p) => p.soprannome || p.nome).join(', ')}.` })
  }
  if (daVerificare.length > 0) {
    alerts.push({ level: 'warn', icon: '📄', text: `Tesseramenti CSI da verificare: ${daVerificare.map((p) => p.soprannome || p.nome).join(', ')}.` })
  }
  if (nonTesserabili.length > 0) {
    alerts.push({ level: 'danger', icon: '🚫', text: `Non tesserabili: ${nonTesserabili.map((p) => p.soprannome || p.nome).join(', ')}.` })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Home</h1>
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="Benvenuto, mister"
          text="Parti dalla rosa: inserisci i tuoi giocatori, poi arriveranno osservazioni, formazioni e partite."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>
              + Aggiungi il primo giocatore
            </button>
          }
        />
      ) : (
        <>
          <div className="section-title">Prossima partita</div>
          <div className="card muted small">
            Nessuna partita in calendario. Il calendario arriva con la milestone M3.
          </div>

          <div className="section-title">La rosa oggi</div>
          <div className="stat-grid">
            <Link to="/rosa" className="stat-tile" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="value">{attivi.length}</div>
              <div className="label">Rosa attiva</div>
            </Link>
            <div className="stat-tile">
              <div className="value">{portieri.length}</div>
              <div className="label">Coprono la porta</div>
            </div>
            <div className="stat-tile">
              <div className="value">{acciaccati.length}</div>
              <div className="label">Acciaccati</div>
            </div>
          </div>

          {alerts.length > 0 && <div className="section-title">Da tenere d'occhio</div>}
          {alerts.map((a, i) => (
            <div key={i} className={`alert-card ${a.level === 'danger' ? 'danger' : ''}`}>
              <span>{a.icon}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
