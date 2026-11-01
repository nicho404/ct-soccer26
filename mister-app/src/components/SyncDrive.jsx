import { useState } from 'react'
import { exportBackup } from '../db/backup'
import { collega, scollega, sincronizza, risolviConflitto } from '../db/sync'
import { driveConfigurato } from '../lib/drive'
import Modal from './Modal'
import { IconAlert, IconDownload } from './icons'
import { useStatoSync } from './useStatoSync'

const dataOra = (iso) => (iso ? new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '—')

function FinestraConflitto({ dataDrive, onClose }) {
  const tieni = (lato, domanda) => {
    if (!window.confirm(domanda)) return
    onClose()
    risolviConflitto(lato)
  }
  return (
    <Modal titolo="Dati diversi su Drive" onClose={onClose}>
      <p className="small" style={{ marginTop: 0 }}>
        Questo dispositivo e Drive sono cambiati entrambi. Salvataggio su Drive: {dataOra(dataDrive)}.
        Quali dati vuoi tenere?
      </p>
      <div className="scelta-lista">
        <button
          type="button"
          className="scelta-opzione"
          onClick={() => tieni('locale', 'Sostituire i dati su Drive con quelli di questo dispositivo?')}
        >
          Tieni questo dispositivo
        </button>
        <button
          type="button"
          className="scelta-opzione"
          onClick={() => tieni('drive', 'Sostituire i dati di questo dispositivo con quelli di Drive?')}
        >
          Tieni Drive
        </button>
      </div>
      <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => exportBackup()}>
        Prima esporta una copia di questo dispositivo
      </button>
    </Modal>
  )
}

// Compare solo quando serve un'azione: se la sincronizzazione funziona, non si vede.
export function SyncAvviso() {
  const stato = useStatoSync()
  const [aperta, setAperta] = useState(false)

  if (stato.fase === 'accesso') {
    return (
      <div className="alert-card" style={{ margin: '10px 16px 0' }}>
        <span className="icona-testo"><IconDownload size={18} /></span>
        <span>
          Accedi a Google per sincronizzare i dati.
          <button className="btn btn-sm" style={{ marginTop: 8, display: 'block' }} onClick={collega}>
            Sincronizza
          </button>
        </span>
      </div>
    )
  }
  if (stato.fase === 'conflitto') {
    return (
      <>
        <div className="alert-card danger" style={{ margin: '10px 16px 0' }}>
          <span className="icona-testo"><IconAlert size={18} /></span>
          <span>
            Dati diversi tra questo dispositivo e Drive: la sincronizzazione è ferma.
            <button className="btn btn-sm" style={{ marginTop: 8, display: 'block' }} onClick={() => setAperta(true)}>
              Scegli quali tenere
            </button>
          </span>
        </div>
        {aperta && <FinestraConflitto dataDrive={stato.dataDrive} onClose={() => setAperta(false)} />}
      </>
    )
  }
  if (stato.fase === 'errore') {
    return (
      <div className="alert-card danger" style={{ margin: '10px 16px 0' }}>
        <span className="icona-testo"><IconAlert size={18} /></span>
        <span>
          Sincronizzazione non riuscita: {stato.messaggio}
          <button className="btn btn-sm" style={{ marginTop: 8, display: 'block' }} onClick={collega}>
            Riprova
          </button>
        </span>
      </div>
    )
  }
  return null
}

const TESTO_FASE = {
  accesso: 'Serve un nuovo accesso a Google',
  lavoro: 'Sincronizzazione in corso…',
  offline: 'Offline: le modifiche partono al ritorno della rete',
  conflitto: 'Ferma: dati diversi da risolvere',
  errore: 'Non riuscita',
}

export function SyncImpostazioni() {
  const stato = useStatoSync()

  if (!driveConfigurato) {
    return <div className="card muted small">Sincronizzazione con Google Drive non ancora configurata.</div>
  }
  if (stato.fase === 'spento') {
    return (
      <div className="card">
        <p className="muted small" style={{ marginTop: 0 }}>
          Accedi con lo stesso account Google su PC e telefono: i dati restano allineati da soli.
        </p>
        <button className="btn btn-sm" onClick={collega}>Accedi con Google</button>
      </div>
    )
  }
  return (
    <div className="card">
      <div className="small" style={{ marginBottom: 10 }}>
        {stato.fase === 'ok' ? `Sincronizzato: ${dataOra(stato.ultimo)}` : TESTO_FASE[stato.fase]}
      </div>
      <div className="row">
        <button
          className="btn btn-sm"
          disabled={stato.fase === 'lavoro'}
          onClick={stato.fase === 'accesso' ? collega : sincronizza}
        >
          Sincronizza ora
        </button>
        <button
          className="btn btn-sm"
          onClick={() => {
            if (window.confirm('Scollegare questo dispositivo da Drive? I dati restano sia qui sia su Drive.')) scollega()
          }}
        >
          Scollega
        </button>
      </div>
    </div>
  )
}
