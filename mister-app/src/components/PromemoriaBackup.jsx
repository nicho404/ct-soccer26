import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { exportBackup, CHIAVE_ULTIMO_BACKUP } from '../db/backup'
import { statoBackup, testoBackup } from '../lib/promemoriaBackup'
import { TONO_BACKUP } from './simboli'
import { IconDownload } from './icons'

// Una riga in Home: da quanto non si fa un backup, neutra fino a 7 giorni,
// gialla oltre, rossa oltre 14 o se non c'è mai stato. Il pulsante esporta
// con un tocco, come "Esporta backup" in Impostazioni.
export default function PromemoriaBackup() {
  const riga = useLiveQuery(() => db.meta.get(CHIAVE_ULTIMO_BACKUP).then((r) => r ?? null), [])
  const [errore, setErrore] = useState(null)
  if (riga === undefined) return null

  const stato = statoBackup(riga?.value)
  const tono = TONO_BACKUP[stato.livello]
  const esporta = async () => {
    setErrore(null)
    try {
      await exportBackup()
    } catch (e) {
      setErrore(`Esportazione non riuscita: ${e.message}`)
    }
  }

  return (
    <div className={`card promemoria-backup ${tono ? `promemoria-${tono}` : ''}`}>
      <div className="promemoria-testo">
        <strong>{testoBackup(stato)}</strong>
        {errore
          ? <span className="small promemoria-errore">{errore}</span>
          : tono && <span className="small muted">I dati stanno solo in questo dispositivo.</span>}
      </div>
      <button type="button" className="btn btn-sm" onClick={esporta}>
        <IconDownload size={16} /> Esporta
      </button>
    </div>
  )
}
