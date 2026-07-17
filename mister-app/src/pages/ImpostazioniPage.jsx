import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { hasDemoData, seedDemoData, clearDemoData } from '../db/demo'
import { exportBackup, importBackup } from '../db/backup'
import { resizeToDataUrl } from '../lib/image'

export default function ImpostazioniPage() {
  const navigate = useNavigate()
  const [demoOn, setDemoOn] = useState(null)
  const [backupMsg, setBackupMsg] = useState(null)
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)

  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])

  useEffect(() => {
    hasDemoData().then(setDemoOn)
  }, [])

  const saveTeam = async (patch) => {
    const cur = (await db.meta.get('team')) ?? { key: 'team', nome: '', torneo: '', logo: '' }
    await db.meta.put({ ...cur, ...patch })
  }

  const onLogoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const logo = await resizeToDataUrl(file, 256, 'image/png')
      await saveTeam({ logo })
    } catch {
      alert('Immagine non leggibile')
    }
  }

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

      <div className="section-title">Squadra</div>
      {/* key: rimonta gli input quando i dati arrivano da IndexedDB,
          così restano uncontrolled e la digitazione non perde caratteri */}
      <div className="card" key={team === undefined ? 'loading' : 'loaded'}>
        <div className="field">
          <label>Nome mister</label>
          <input
            className="input"
            defaultValue={team?.mister ?? ''}
            onChange={(e) => saveTeam({ mister: e.target.value })}
            placeholder="Come ti chiami"
          />
        </div>
        <div className="field">
          <label>Formato</label>
          <div className="chip-row">
            {[7, 8].map((f) => (
              <button
                key={f}
                className={`chip chip-sm ${team?.formato === f ? 'selected' : ''}`}
                onClick={() => saveTeam({ formato: f })}
              >
                Calcio a {f}
              </button>
            ))}
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Determina i moduli disponibili nel builder tattico.
          </p>
        </div>
        <div className="field">
          <label>Nome squadra</label>
          <input
            className="input"
            defaultValue={team?.nome ?? ''}
            onChange={(e) => saveTeam({ nome: e.target.value })}
            placeholder="Es. Vecchia Guardia FC"
          />
        </div>
        <div className="field">
          <label>Torneo / campionato</label>
          <input
            className="input"
            defaultValue={team?.torneo ?? ''}
            onChange={(e) => saveTeam({ torneo: e.target.value })}
            placeholder="Es. LC8 Milano – Serie C"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Logo squadra</label>
          <div className="row">
            {team?.logo ? (
              <img src={team.logo} alt="Logo squadra" className="team-logo-preview" />
            ) : (
              <span className="team-logo-preview muted small" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</span>
            )}
            <button className="btn btn-sm" onClick={() => logoInputRef.current?.click()}>
              {team?.logo ? 'Cambia logo' : 'Carica logo'}
            </button>
            {team?.logo && (
              <button className="btn btn-sm" onClick={() => saveTeam({ logo: '' })}>
                Rimuovi
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onLogoFile}
            />
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Compare in alto a sinistra e in Home. Meglio un'immagine quadrata.
          </p>
        </div>
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
        Mister App — gestione squadra e scouting personale del mister.
        <br />
        I dati vivono solo su questo dispositivo.
      </div>
    </div>
  )
}
