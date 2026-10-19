import { describe, it, expect } from 'vitest'
import {
  calcolaRischio, impegno, minutaggio, fasciaPresenze, gradinoDa, IMPEGNO_PIENO, IMPEGNO_MINIMO,
} from './umore'

// Una partita con referto da 50′ in cui il giocatore 1 era presente e ha
// giocato `min` minuti.
const partita = (min, stato = 'presente') => ({
  durata: 50,
  formazione: { slots: [2] },
  presenze: { 1: stato },
  minuti: { 1: min },
})
const sedute = (presenti, assenti = 0) => [
  ...Array(presenti).fill({ presenze: { 1: 'presente' } }),
  ...Array(assenti).fill({ presenze: { 1: 'assente' } }),
]

const stima = (minuti, trainings = sedute(10)) =>
  calcolaRischio({ trainings, matches: minuti.map((m) => partita(m)) }, 1)
const rischio = (minuti, trainings) => stima(minuti, trainings)?.livello
const gradino = (minuti, trainings) => stima(minuti, trainings)?.gradino

// Mappatura dai cinque gradini di prima (sorridente, contento, neutro,
// triste, arrabbiato) ai tre livelli: le soglie non cambiano.
describe('rischio scontento: sempre presente, cambia solo il minutaggio', () => {
  it('minutaggio massimo (era sorridente): nessuno', () => {
    expect(gradino([50, 50, 45])).toBe('pieno')
    expect(rischio([50, 50, 45])).toBe('nessuno')
  })
  it('minutaggio maggiore (era contento): nessuno', () => expect(rischio([35, 35, 30])).toBe('nessuno'))
  it('minutaggio equo da panchinaro (era neutro): da monitorare', () => expect(rischio([25, 20, 20])).toBe('monitorare'))
  it('un po\' di minutaggio (era triste): alto', () => expect(rischio([10, 10, 10])).toBe('alto'))
  it('pochissimo minutaggio (era arrabbiato): alto', () => {
    expect(gradino([5, 0, 0])).toBe('minimo')
    expect(rischio([5, 0, 0])).toBe('alto')
  })
})

describe("rischio: l'impegno pesa sullo scontento", () => {
  it('presenze a metà: si scende di un gradino', () => {
    // 6 presenze su 10 contando le 3 partite
    expect(gradino([5, 0, 0], sedute(3, 4))).toBe('scarso')
    expect(rischio([5, 0, 0], sedute(3, 4))).toBe('alto')
    expect(gradino([10, 10, 10], sedute(3, 4))).toBe('equo')
    expect(rischio([10, 10, 10], sedute(3, 4))).toBe('monitorare')
  })

  it('presenze scarse: chi gioca poco resta da monitorare', () => {
    expect(rischio([5, 0, 0], sedute(0, 7))).toBe('monitorare')
  })

  it('le presenze non danno rischio a chi gioca', () => {
    expect(rischio([50, 50, 50], sedute(0, 7))).toBe('nessuno')
  })
})

describe('umore: fattori e casi limite', () => {
  it('le partite in cui era assente o senza referto non contano nel minutaggio', () => {
    const matches = [
      partita(25),
      partita(0, 'assente'),
      { durata: 50, presenze: { 1: 'presente' } }, // senza referto
    ]
    expect(minutaggio(matches, 1)).toEqual({ giocati: 25, disponibili: 50, partite: 1, quota: 0.5 })
  })

  it('i giustificati non contano nelle presenze', () => {
    const trainings = [{ presenze: { 1: 'presente' } }, { presenze: { 1: 'giustificato' } }]
    expect(impegno({ trainings }, 1)).toEqual({ presenti: 1, assenti: 0, giustificati: 1, totale: 1, quota: 1 })
    expect(impegno({ trainings: [{ presenze: { 1: 'giustificato' } }] }, 1).quota).toBe(null)
    expect(impegno({ trainings: [] }, 1)).toBe(null)
  })

  it('senza partite con referto non c\'è rischio da stimare', () => {
    expect(calcolaRischio({ trainings: sedute(10), matches: [] }, 1)).toBe(null)
  })

  it('spiega i fattori', () => {
    const u = calcolaRischio({ trainings: sedute(9), matches: [partita(5)] }, 1)
    expect(u.livello).toBe('alto')
    expect(u.label).toBe('Alto')
    expect(u.causa).toBe('Presente 100% · gioca 10% dei minuti')
    expect(u.fattori).toEqual([
      { nome: 'Presenze', valore: '100%', dettaglio: '10 su 10 tra allenamenti e partite' },
      { nome: 'Minutaggio', valore: '10%', dettaglio: '5′ su 50′ nella partita in cui era presente' },
    ])
    expect(u.nota).toBe('È sempre presente ma gioca poco.')
  })
})

describe('fasce presenze', () => {
  it('tre fasce con le soglie dello scontento: da 75% piena, da 50% media, sotto bassa', () => {
    expect([IMPEGNO_PIENO, IMPEGNO_MINIMO]).toEqual([0.75, 0.5])
    expect([1, 0.75, 0.74, 0.5, 0.49, 0].map(fasciaPresenze)).toEqual([
      'piena', 'piena', 'media', 'media', 'bassa', 'bassa',
    ])
    expect(fasciaPresenze(null)).toBe(null)
  })
})

describe('gradinoDa: presenze bassissime e pochi minuti non danno rischio alto', () => {
  it('stesso minutaggio minimo, presenze diverse', () => {
    expect(gradinoDa(0.05, 1).gradino).toBe('minimo')
    expect(gradinoDa(0.05, 0.6).gradino).toBe('scarso')
    expect(gradinoDa(0.05, 0.1).gradino).toBe('equo')
  })

  it('chi c\'è poco e gioca poco è da monitorare, non a rischio alto', () => {
    expect(rischio([5, 0, 0], sedute(1, 9))).toBe('monitorare')
  })
})
