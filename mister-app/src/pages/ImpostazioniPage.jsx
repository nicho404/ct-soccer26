import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { hasDemoData, seedDemoData, clearDemoData } from '../db/demo'
import { exportBackup, importBackup } from '../db/backup'
import { durataSquadra } from '../lib/storico'
import { resizeToDataUrl } from '../lib/image'
import Modal from '../components/Modal'

const DURATE_RAPIDE = [40, 50, 60, 70]

export default function ImpostazioniPage() {
  const navigate = useNavigate()
  const [demoOn, setDemoOn] = useState(null)
  const [backupMsg, setBackupMsg] = useState(null)
  // null = in lettura, 'na' = API non supportata, altrimenti true/false
  const [persistito, setPersistito] = useState(null)
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)
  // copia dei dati squadra in modifica: null = finestra chiusa. Si salva
  // tutto insieme con "Salva", niente scritture a ogni tasto.
  const [bozza, setBozza] = useState(null)

  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])

  useEffect(() => {
    hasDemoData().then(setDemoOn)
  }, [])

  useEffect(() => {
    if (!navigator.storage?.persisted) {
      setPersistito('na')
      return
    }
    navigator.storage.persisted().then(setPersistito, () => setPersistito('na'))
  }, [])

  const chiediPersistenza = async () => {
    try {
      setPersistito(await navigator.storage.persist())
    } catch {
      setPersistito(false)
    }
  }

  const saveTeam = async (patch) => {
    const cur = (await db.meta.get('team')) ?? { key: 'team', nome: '', torneo: '', logo: '' }
    await db.meta.put({ ...cur, ...patch })
  }

  const apriModifica = () => setBozza({
    nome: team?.nome ?? '',
    torneo: team?.torneo ?? '',
    mister: team?.mister ?? '',
    formato: team?.formato ?? 7,
    durataPartita: String(durataSquadra(team)),
    logo: team?.logo ?? '',
  })
  const setB = (patch) => setBozza((b) => ({ ...b, ...patch }))

  const modificata = bozza != null && (
    bozza.nome !== (team?.nome ?? '') || bozza.torneo !== (team?.torneo ?? '') ||
    bozza.mister !== (team?.mister ?? '') || bozza.formato !== (team?.formato ?? 7) ||
    Number(bozza.durataPartita) !== durataSquadra(team) || bozza.logo !== (team?.logo ?? '')
  )

  const chiudiModifica = () => {
    if (modificata && !window.confirm('Chiudere senza salvare le modifiche?')) return
    setBozza(null)
  }

  const salvaModifica = async () => {
    const durata = Number(bozza.durataPartita)
    if (!Number.isInteger(durata) || durata < 1 || durata > 150) {
      alert('La durata deve essere un numero di minuti tra 1 e 150')
      return
    }
    await saveTeam({
      nome: bozza.nome.trim(),
      torneo: bozza.torneo.trim(),
      mister: bozza.mister.trim(),
      formato: bozza.formato,
      durataPartita: durata,
      logo: bozza.logo,
    })
    setBozza(null)
  }

  const onLogoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setB({ logo: await resizeToDataUrl(file, 256, 'image/png') })
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
      {/* In lettura: si cambia solo dalla matita, e si salva con "Salva" */}
      <div className="card">
        <div className="row" style={{ gap: 12, marginBottom: 10 }}>
          {team?.logo ? (
            <img src={team.logo} alt="Logo squadra" className="team-logo-preview" />
          ) : (
            <span className="team-logo-preview muted small" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{team?.nome || 'Nome squadra da inserire'}</strong>
            <div className="muted small">{team?.torneo || 'Torneo non indicato'}</div>
          </div>
          <button
            className="btn btn-sm"
            aria-label="Modifica dati squadra"
            disabled={team === undefined}
            onClick={apriModifica}
          >
            ✎
          </button>
        </div>
        <div className="impostazioni-voci">
          <div><span className="muted small">Mister</span><strong>{team?.mister || '—'}</strong></div>
          <div><span className="muted small">Formato</span><strong>Calcio a {team?.formato ?? 7}</strong></div>
          <div><span className="muted small">Durata partita</span><strong>{durataSquadra(team)}′</strong></div>
        </div>
      </div>

      {bozza && (
        <Modal titolo="Modifica squadra" onClose={chiudiModifica}>
          <div className="field">
            <label>Nome squadra</label>
            <input
              className="input"
              value={bozza.nome}
              onChange={(e) => setB({ nome: e.target.value })}
              placeholder="Es. Vecchia Guardia FC"
            />
          </div>
          <div className="field">
            <label>Torneo / campionato</label>
            <input
              className="input"
              value={bozza.torneo}
              onChange={(e) => setB({ torneo: e.target.value })}
              placeholder="Es. LC8 Milano – Serie C"
            />
          </div>
          <div className="field">
            <label>Nome mister</label>
            <input
              className="input"
              value={bozza.mister}
              onChange={(e) => setB({ mister: e.target.value })}
              placeholder="Come ti chiami"
            />
          </div>
          <div className="field">
            <label>Formato</label>
            <div className="chip-row">
              {[7, 8].map((f) => (
                <button
                  key={f}
                  className={`chip chip-sm ${bozza.formato === f ? 'selected' : ''}`}
                  onClick={() => setB({ formato: f })}
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
            <label>Durata partita (minuti)</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {DURATE_RAPIDE.map((m) => (
                <button
                  key={m}
                  className={`chip chip-sm ${Number(bozza.durataPartita) === m ? 'selected' : ''}`}
                  onClick={() => setB({ durataPartita: String(m) })}
                >
                  {m}′
                </button>
              ))}
              <input
                className="input"
                style={{ width: 90 }}
                type="number"
                min="1"
                max="150"
                inputMode="numeric"
                aria-label="Durata partita in minuti"
                value={bozza.durataPartita}
                onChange={(e) => setB({ durataPartita: e.target.value })}
              />
            </div>
            <p className="muted small" style={{ marginBottom: 0 }}>
              Tempo di gioco totale, rigori esclusi. Ogni nuovo referto parte da qui; quelli già
              salvati tengono la loro durata.
            </p>
          </div>
          <div className="field">
            <label>Logo squadra</label>
            <div className="row">
              {bozza.logo ? (
                <img src={bozza.logo} alt="Logo squadra" className="team-logo-preview" />
              ) : (
                <span className="team-logo-preview muted small" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</span>
              )}
              <button className="btn btn-sm" onClick={() => logoInputRef.current?.click()}>
                {bozza.logo ? 'Cambia' : 'Carica'}
              </button>
              {bozza.logo && (
                <button
                  className="btn btn-sm"
                  onClick={() => { if (window.confirm('Rimuovere il logo della squadra?')) setB({ logo: '' }) }}
                >
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
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={salvaModifica}>
              Salva
            </button>
            <button className="btn" onClick={chiudiModifica}>Annulla</button>
          </div>
        </Modal>
      )}

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
        {persistito === true && (
          <p className="small muted" style={{ marginBottom: 0 }}>
            Dati protetti dalla pulizia del browser
          </p>
        )}
        {persistito === false && (
          <>
            <p className="small" style={{ marginBottom: 8, color: '#e05555' }}>
              Il browser può cancellare i dati: esporta un backup dopo ogni partita
            </p>
            <button className="btn btn-sm" onClick={chiediPersistenza}>Proteggi i dati</button>
          </>
        )}
        {persistito === 'na' && (
          <p className="small" style={{ marginBottom: 0, color: '#e05555' }}>
            Questo browser non permette di proteggere i dati: esporta un backup dopo ogni partita
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
