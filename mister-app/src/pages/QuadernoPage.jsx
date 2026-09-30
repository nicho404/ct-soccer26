import { Link, useNavigate } from 'react-router-dom'
import AnalisiPage from './AnalisiPage'
import ManualePage from './ManualePage'

// Quaderno del mister: analisi e manuale nella stessa sezione, due schede.
// Le rotte restano /analisi e /manuale, così ogni link già esistente (e il
// ritorno dai form) porta alla scheda giusta.
export default function QuadernoPage({ scheda }) {
  const navigate = useNavigate()
  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Quaderno</h1>
      </div>

      <div className="schede" role="tablist">
        <Link
          to="/analisi"
          replace
          role="tab"
          aria-selected={scheda === 'analisi'}
          className={`scheda ${scheda === 'analisi' ? 'attiva' : ''}`}
        >
          Analisi
        </Link>
        <Link
          to="/manuale"
          replace
          role="tab"
          aria-selected={scheda === 'manuale'}
          className={`scheda ${scheda === 'manuale' ? 'attiva' : ''}`}
        >
          Manuale
        </Link>
      </div>

      {scheda === 'manuale' ? <ManualePage incorporata /> : <AnalisiPage incorporata />}
    </div>
  )
}
