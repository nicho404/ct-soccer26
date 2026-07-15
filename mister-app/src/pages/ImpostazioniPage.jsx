import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasDemoData, seedDemoData, clearDemoData } from '../db/demo'

export default function ImpostazioniPage() {
  const navigate = useNavigate()
  const [demoOn, setDemoOn] = useState(null)

  useEffect(() => {
    hasDemoData().then(setDemoOn)
  }, [])

  const toggleDemo = async () => {
    if (demoOn) {
      const ok = window.confirm('Rimuovere tutti i dati demo? I dati reali non vengono toccati.')
      if (!ok) return
      await clearDemoData()
      setDemoOn(false)
    } else {
      await seedDemoData()
      setDemoOn(true)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Impostazioni</h1>
      </div>

      <div className="section-title">Dati di prova</div>
      <div className="card">
        <div className="switch-row">
          <div>
            <div className="label">Dati demo</div>
            <div className="muted small">Rosa finta di 14 giocatori con intese e competizioni</div>
          </div>
          <button
            className={`toggle ${demoOn ? 'on' : ''}`}
            aria-label="Dati demo"
            disabled={demoOn === null}
            onClick={toggleDemo}
          />
        </div>
      </div>

      <div className="section-title">Backup</div>
      <div className="card">
        <p className="muted small" style={{ marginTop: 0 }}>
          Esporta e importa tutti i dati in un file JSON: è l'unico ponte tra telefono e PC.
          Disponibile con la milestone M8.
        </p>
        <div className="row">
          <button className="btn btn-sm" disabled style={{ opacity: 0.5 }}>Esporta backup</button>
          <button className="btn btn-sm" disabled style={{ opacity: 0.5 }}>Importa backup</button>
        </div>
      </div>

      <div className="section-title">Info</div>
      <div className="card muted small">
        Mister App — gestione squadra calcio a 7 (CSI).
        <br />
        I dati vivono solo su questo dispositivo.
      </div>
    </div>
  )
}
