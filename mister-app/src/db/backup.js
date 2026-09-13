import {
  db, migrazioneV7RuoliTattici, migrazioneV8SlotRuoliOverride, migrazioneV9PresenzePartite,
  migrazioneV12ChecklistInObservations,
} from './db'

const FORMAT = 'mister-app-backup'

// Serializza tutte le tabelle in un oggetto JSON e avvia il download del file.
export async function exportBackup() {
  const tables = {}
  await db.transaction('r', db.tables, async () => {
    for (const table of db.tables) {
      tables[table.name] = await table.toArray()
    }
  })

  const payload = {
    format: FORMAT,
    dbVersion: db.verno,
    exportedAt: new Date().toISOString(),
    tables,
  }

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mister-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Sostituisce l'intero database con il contenuto del file di backup.
// Lancia un Error con messaggio leggibile se il file non è valido.
export async function importBackup(file) {
  let payload
  try {
    payload = JSON.parse(await file.text())
  } catch {
    throw new Error('Il file non è un JSON valido.')
  }

  if (payload?.format !== FORMAT || typeof payload.tables !== 'object') {
    throw new Error('Il file non è un backup di Mister App.')
  }
  if (payload.dbVersion > db.verno) {
    throw new Error(
      "Il backup viene da una versione più recente dell'app: aggiorna l'app prima di importarlo."
    )
  }

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      const rows = payload.tables[table.name]
      if (Array.isArray(rows) && rows.length > 0) {
        await table.bulkPut(rows)
      }
    }
    // bulkPut scrive i dati "as-is": un backup di una versione precedente
    // non passa dalle migration di Dexie (che scattano solo sui cambi di
    // versione dello schema). Vanno riapplicate a mano quelle rilevanti.
    if (payload.dbVersion < 7) {
      await migrazioneV7RuoliTattici(db)
    }
    if (payload.dbVersion < 8) {
      await migrazioneV8SlotRuoliOverride(db)
    }
    if (payload.dbVersion < 9) {
      await migrazioneV9PresenzePartite(db)
    }
    // letturePartita non esiste più nello schema corrente (v12 l'ha ritirata
    // dentro observations): un backup che la conteneva ancora non la scrive
    // mai tramite il loop qui sopra, quindi le sue righe vanno lette dal
    // payload direttamente, non da `db`.
    if (payload.dbVersion < 12) {
      await migrazioneV12ChecklistInObservations(db, payload.tables.letturePartita ?? [])
    }
  })
}
