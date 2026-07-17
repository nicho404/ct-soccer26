import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasDemoData, seedDemoData, clearDemoData } from '../db/demo'
import { exportBackup, importBackup } from '../db/backup'

export default function ImpostazioniPage() {
  const navigate = useNavigate()
  const [demoOn, setDemoOn] = useState(null)
  const [backupMsg, setBackupMsg] = useState(null)
  const fileInputRef = useRef(null)

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

  const onExport = async () => {
    try {
      await exportBackup()
      setBackupMsg({ ok: true, text: 'Backup esportato.' })
    } catch (e) {
      setBackupMsg({ ok: false, text: `Errore durante l'esportazione: ${e.message}` })
    }
  }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const ok = window.confirm(
      'Importare il backup? Tutti i dati attuali su questo dispositivo verranno sostituiti.'
    )
    if (!ok) return
    try {
      await importBackup(file)
      setBackupMsg({ ok: true, text: 'Backup importato.' })
      hasDemoData().then(setDemoOn)
    } catch (err) {
      setBackupMsg({ ok: false, text: err.message })
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
        </p>
        <div className="row">
          <button className="btn btn-sm" onClick={onExport}>Esporta backup</button>
          <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
            Importa backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={onImportFile}
          />
        </div>
        {backupMsg && (
          <p className="small" style={{ marginBottom: 0, color: backupMsg.ok ? undefined : '#e05555' }}>
            {backupMsg.text}
          </p>
        )}
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
