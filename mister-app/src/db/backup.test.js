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

describe('backup: girone (v13)', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals()
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('esporta e reimporta giocatori avversari, partite del girone e i campi nuovi', async () => {
    await db.opponents.bulkAdd([{ id: 1, nome: 'Aquile' }, { id: 2, nome: 'Bisonti' }])
    await db.competitions.add({ id: 5, nome: 'Contesto', tipo: 'campionato', penalita: [{ squadraId: 0, punti: 1, motivo: 'Distinta' }] })
    await db.giocatoriAvversari.add({ id: 9, opponentId: 1, nome: 'Rossi Marco', sportxId: 4412 })
    await db.partiteGirone.add({
      id: 3, competitionId: 5, giornata: 1, data: null, ora: '', luogo: '', sportxId: null,
      casaId: 1, ospiteId: 2, golCasa: 1, golOspite: 0,
      eventi: [{ tipo: 'gol', squadraId: 1, giocatoreId: 9 }],
    })
    await db.matches.add({
      id: 4, data: '2026-09-20', opponentId: 2, competitionId: 5, giornata: 1,
      golFatti: 0, golSubiti: 1, eventiAvversari: [{ tipo: 'giallo', giocatoreId: 9 }],
    })

    const leggi = catturaExport()
    await exportBackup()
    const json = leggi()
    vi.unstubAllGlobals()

    const payload = JSON.parse(json)
    expect(payload.dbVersion).toBe(db.verno)
    expect(payload.tables.giocatoriAvversari).toHaveLength(1)
    expect(payload.tables.partiteGirone).toHaveLength(1)

    await Promise.all(db.tables.map((t) => t.clear()))
    await importBackup({ text: async () => json })

    expect(await db.giocatoriAvversari.get(9)).toMatchObject({ opponentId: 1, sportxId: 4412 })
    expect((await db.partiteGirone.get(3)).eventi).toEqual([{ tipo: 'gol', squadraId: 1, giocatoreId: 9 }])
    expect(await db.matches.get(4)).toMatchObject({ giornata: 1, eventiAvversari: [{ tipo: 'giallo', giocatoreId: 9 }] })
    expect((await db.competitions.get(5)).penalita).toEqual([{ squadraId: 0, punti: 1, motivo: 'Distinta' }])
  })

  it('carica un backup v13 scritto a mano, così com\'è', async () => {
    const payload = {
      format: 'mister-app-backup',
      dbVersion: 13,
      exportedAt: '2026-09-23T10:00:00.000Z',
      tables: {
        opponents: [{ id: 1, nome: 'Delfini United' }, { id: 2, nome: 'Gufi' }],
        competitions: [{ id: 1, nome: 'Contesto', tipo: 'campionato' }],
        giocatoriAvversari: [
          { id: 1, opponentId: 1, nome: 'Mascarò Luca', sportxId: null },
          { id: 2, opponentId: 2, nome: 'Gatti Paolo', sportxId: 77 },
        ],
        partiteGirone: [{
          id: 1, competitionId: 1, giornata: 2, data: '2026-09-14', ora: '20:30', luogo: 'Falchi',
          sportxId: 1001, casaId: 2, ospiteId: 1, golCasa: 1, golOspite: 4,
          eventi: [
            { tipo: 'gol', squadraId: 2, giocatoreId: 2 },
            { tipo: 'gol', squadraId: 1, giocatoreId: 1 },
            { tipo: 'gol', squadraId: 1, giocatoreId: 1 },
          ],
        }],
      },
    }
    await importBackup({ text: async () => JSON.stringify(payload) })

    expect(await db.giocatoriAvversari.where('opponentId').equals(1).count()).toBe(1)
    expect(await db.partiteGirone.where('competitionId').equals(1).count()).toBe(1)
    expect((await db.partiteGirone.get(1)).eventi).toHaveLength(3)
  })
})

describe('backup: analisi (v14)', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals()
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('esporta e reimporta le analisi con gli obiettivi spuntati', async () => {
    await db.analisi.add({
      id: 1, data: '2026-09-23', titolo: 'Titolo', contesto: 'Contesto', sintesi: 'Sintesi',
      puntiChiave: [{ tipo: 'problema', testo: 'Primo punto' }],
      obiettivi: [{ testo: 'Obiettivo A', fatto: true }, { testo: 'Obiettivo B', fatto: false }],
      sezioni: [{ titolo: 'Sezione', punti: ['A', 'B'] }], fonte: 'note',
    })
    const leggi = catturaExport()
    await exportBackup()
    const json = leggi()
    vi.unstubAllGlobals()
    await Promise.all(db.tables.map((t) => t.clear()))
    await importBackup({ text: async () => json })

    const a = await db.analisi.get(1)
    expect(a.obiettivi).toEqual([{ testo: 'Obiettivo A', fatto: true }, { testo: 'Obiettivo B', fatto: false }])
    expect(a.sezioni[0].punti).toEqual(['A', 'B'])
  })
})
