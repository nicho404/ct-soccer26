// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from './db'
import { decidiSync, sincronizza, risolviConflitto, leggiStatoSync } from './sync'

// Drive finto: un solo file in memoria, con una revisione nuova a ogni scrittura.
const drive = vi.hoisted(() => ({ file: null, testo: null, giri: 0, scritture: 0 }))

vi.mock('../lib/drive', () => ({
  driveConfigurato: true,
  caricaGis: async () => {},
  tokenValido: () => 'token',
  cancellaToken: () => {},
  chiediToken: async () => 'token',
  trovaFile: async () => drive.file,
  scaricaFile: async () => drive.testo,
  caricaFile: async (_token, _id, testo) => {
    drive.giri += 1
    drive.scritture += 1
    drive.testo = testo
    drive.file = { id: 'f1', headRevisionId: `r${drive.giri}`, modifiedTime: '2026-11-01T10:00:00Z' }
    return drive.file
  },
}))

const base = { hashNoto: 'a', hashLocale: 'a', revisioneNota: 'r1', revisioneRemota: 'r1', vuoto: false }

describe('decidiSync', () => {
  it('niente di cambiato: non fa nulla', () => {
    expect(decidiSync(base)).toBe('niente')
  })
  it('cambiato solo qui: carica', () => {
    expect(decidiSync({ ...base, hashLocale: 'b' })).toBe('carica')
  })
  it('cambiato solo su Drive: scarica', () => {
    expect(decidiSync({ ...base, revisioneRemota: 'r2' })).toBe('scarica')
  })
  it('cambiati entrambi: chiede, non sovrascrive', () => {
    expect(decidiSync({ ...base, hashLocale: 'b', revisioneRemota: 'r2' })).toBe('conflitto')
  })
  it('dispositivo nuovo e vuoto: scarica', () => {
    expect(decidiSync({ hashNoto: null, hashLocale: 'v', revisioneNota: null, revisioneRemota: 'r1', vuoto: true })).toBe('scarica')
  })
  it('dati spariti su un dispositivo già collegato: non carica il vuoto su Drive', () => {
    expect(decidiSync({ ...base, hashLocale: 'v', vuoto: true })).toBe('conflitto')
  })
  it('vuoto e niente su Drive: non crea un file vuoto', () => {
    expect(decidiSync({ ...base, hashNoto: null, revisioneNota: null, revisioneRemota: null, vuoto: true })).toBe('niente')
  })
  it('primo collegamento con dati su entrambi i lati: chiede', () => {
    expect(decidiSync({ hashNoto: null, hashLocale: 'a', revisioneNota: null, revisioneRemota: 'r1', vuoto: false })).toBe('conflitto')
  })
})

describe('sincronizzazione tra due dispositivi', () => {
  // cambiare dispositivo: Drive resta, stato locale e database no
  const altroDispositivo = async () => {
    localStorage.setItem('mister-sync', JSON.stringify({ fileId: null, revisione: null, hash: null }))
    await Promise.all(db.tables.map((t) => t.clear()))
  }

  beforeEach(async () => {
    Object.assign(drive, { file: null, testo: null, giri: 0, scritture: 0 })
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    localStorage.setItem('mister-sync', JSON.stringify({ fileId: null, revisione: null, hash: null }))
  })

  it('il secondo dispositivo ritrova i dati, e il ritorno al primo li aggiorna', async () => {
    await db.meta.put({ key: 'team', nome: 'Test FC', setupDone: true })
    await db.players.add({ nome: 'Uno' })
    await sincronizza()
    expect(drive.scritture).toBe(1)

    const statoPrimo = localStorage.getItem('mister-sync')
    await altroDispositivo()
    await sincronizza()
    expect((await db.players.toArray()).map((p) => p.nome)).toEqual(['Uno'])

    await db.players.add({ nome: 'Due' })
    await sincronizza()
    expect(drive.scritture).toBe(2)

    localStorage.setItem('mister-sync', statoPrimo)
    await db.players.where('nome').equals('Due').delete()
    await sincronizza()
    expect((await db.players.toArray()).map((p) => p.nome)).toEqual(['Uno', 'Due'])
    expect(leggiStatoSync().fase).toBe('ok')
  })

  it('una sincronizzazione senza modifiche non riscrive su Drive', async () => {
    await db.players.add({ nome: 'Uno' })
    await sincronizza()
    await sincronizza()
    expect(drive.scritture).toBe(1)
  })

  it('con modifiche su entrambi i lati si ferma e tiene ciò che si sceglie', async () => {
    await db.players.add({ nome: 'Uno' })
    await sincronizza()
    const statoPrimo = localStorage.getItem('mister-sync')

    await altroDispositivo()
    await sincronizza()
    await db.players.add({ nome: 'Da Drive' })
    await sincronizza()

    localStorage.setItem('mister-sync', statoPrimo)
    await db.players.clear()
    await db.players.bulkPut([{ id: 1, nome: 'Uno' }, { id: 50, nome: 'Da qui' }])
    const scrittePrima = drive.scritture
    await sincronizza()
    expect(leggiStatoSync().fase).toBe('conflitto')
    expect(drive.scritture).toBe(scrittePrima)

    await risolviConflitto('drive')
    expect((await db.players.toArray()).map((p) => p.nome)).toEqual(['Uno', 'Da Drive'])
    expect(leggiStatoSync().fase).toBe('ok')
  })
})
