import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from './db'
import { exportBackup, importBackup } from './backup'

// data URL minima ma vera: è così che la foto profilo vive in Dexie
const FOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAg='

// exportBackup fa partire un download vero (Blob + <a download>.click()):
// qui il browser non c'è, quindi si intercetta il contenuto del Blob e si
// restituisce il testo che finirebbe nel file.
function catturaExport() {
  const chunks = []
  URL.createObjectURL = () => 'blob:finto'
  URL.revokeObjectURL = () => {}
  vi.stubGlobal('document', { createElement: () => ({ click() {} }) })
  const BlobVero = globalThis.Blob
  vi.stubGlobal('Blob', class extends BlobVero {
    constructor(parts, options) {
      super(parts, options)
      chunks.push(parts.join(''))
    }
  })
  return () => chunks[chunks.length - 1]
}

describe('backup: giro completo esporta → importa', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals()
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('non perde la foto profilo del giocatore', async () => {
    await db.players.add({ nome: 'Luca Ferrari', foto: FOTO, ruoloNaturale: 'POR' })

    const leggi = catturaExport()
    await exportBackup()
    const json = leggi()
    vi.unstubAllGlobals()

    // il file arriva dal disco: quello che conta è il testo, non l'oggetto File
    await importBackup({ text: async () => json })

    const [tornato] = await db.players.toArray()
    expect(tornato.nome).toBe('Luca Ferrari')
    expect(tornato.foto).toBe(FOTO)
  })

  it('non perde il logo della squadra, salvato in meta', async () => {
    await db.meta.put({ key: 'team', nome: 'Mia Squadra', logo: FOTO, setupDone: true })

    const leggi = catturaExport()
    await exportBackup()
    const json = leggi()
    vi.unstubAllGlobals()

    await importBackup({ text: async () => json })

    const team = await db.meta.get('team')
    expect(team.logo).toBe(FOTO)
  })
})
