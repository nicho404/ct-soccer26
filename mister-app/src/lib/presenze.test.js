import { describe, it, expect } from 'vitest'
import {
  contaSeduta, pctSeduta, aggregaPresenze, serieRecente, meritocrazia, durataPiano,
} from './presenze'

const sedute = [
  { data: '2026-09-01', presenze: { 1: 'presente', 2: 'presente', 3: 'assente' } },
  { data: '2026-09-08', presenze: { 1: 'presente', 2: 'giustificato', 3: 'assente' } },
  { data: '2026-09-15', presenze: { 1: 'presente', 2: 'assente', 3: 'presente' } },
  { data: '2026-09-22', presenze: { 1: 'presente', 2: 'presente' } },
]

describe('conteggio di una seduta', () => {
  it('separa presenti, assenti e giustificati', () => {
    expect(contaSeduta(sedute[1])).toEqual({
      presenti: 1, assenti: 1, giustificati: 1, totale: 3,
    })
  })

  it('ignora chi non è nell appello', () => {
    expect(contaSeduta(sedute[3]).totale).toBe(2)
    expect(contaSeduta({}).totale).toBe(0)
  })

  it('la percentuale di squadra è null senza appello', () => {
    expect(pctSeduta(sedute[0])).toBe(67)
    expect(pctSeduta({ presenze: {} })).toBe(null)
  })
})

describe('aggregato per giocatore', () => {
  it('conta solo le sedute in cui il giocatore era all appello', () => {
    const righe = aggregaPresenze(sedute)
    const di = (id) => righe.find((r) => r.playerId === id)
    expect(di(1)).toMatchObject({ sedute: 4, presenti: 4, pct: 100 })
    expect(di(2)).toMatchObject({ sedute: 4, presenti: 2, assenti: 1, giustificati: 1, pct: 50 })
    // il 3 manca dall'ultima seduta: 3 sedute, non 4
    expect(di(3)).toMatchObject({ sedute: 3, presenti: 1, pct: 33 })
  })

  it('ordina dal più presente', () => {
    expect(aggregaPresenze(sedute).map((r) => r.playerId)).toEqual([1, 2, 3])
  })
})

describe('serie recente', () => {
  it('restituisce le ultime sedute dalla più recente', () => {
    expect(serieRecente(sedute, 2, 3)).toEqual(['presente', 'assente', 'giustificato'])
  })

  it('salta le sedute in cui il giocatore non era all appello', () => {
    expect(serieRecente(sedute, 3)).toEqual(['presente', 'assente', 'assente'])
  })
})

describe('meritocrazia', () => {
  // 1 si allena sempre ma gioca poco, 2 il contrario, 3 in linea
  const matches = [
    { minuti: { 1: 20, 2: 60, 3: 25 } },
    { minuti: { 1: 10, 2: 60, 3: 23 } },
  ]

  it('rapporta i minuti al giocatore più impiegato', () => {
    const righe = meritocrazia({ trainings: sedute, matches })
    const di = (id) => righe.find((r) => r.playerId === id)
    expect(di(2).pctMinuti).toBe(100)
    expect(di(1).pctMinuti).toBe(25)
    expect(di(3).pctMinuti).toBe(40)
  })

  it('segnala chi gioca più di quanto si alleni e viceversa', () => {
    const righe = meritocrazia({ trainings: sedute, matches })
    const di = (id) => righe.find((r) => r.playerId === id)
    expect(di(2).livello).toBe('premiato')     // 100% minuti, 50% allenamenti
    expect(di(1).livello).toBe('penalizzato')  // 25% minuti, 100% allenamenti
    expect(di(3).livello).toBe('inLinea')      // 40% minuti, 33% allenamenti
  })

  it('non giudica chi ha meno di 3 sedute', () => {
    const poche = [{ data: '2026-09-01', presenze: { 1: 'presente', 2: 'assente' } }]
    const righe = meritocrazia({ trainings: poche, matches })
    expect(righe.every((r) => r.livello === 'nd')).toBe(true)
  })

  it('resta neutro se nessuno ha ancora giocato', () => {
    const righe = meritocrazia({ trainings: sedute, matches: [] })
    expect(righe.every((r) => r.pctMinuti === null && r.livello === 'nd')).toBe(true)
  })

  it('ordina dal più premiato al più penalizzato', () => {
    expect(meritocrazia({ trainings: sedute, matches }).map((r) => r.playerId))
      .toEqual([2, 3, 1])
  })
})

describe('piano seduta', () => {
  it('somma i minuti dei blocchi ignorando quelli vuoti', () => {
    expect(durataPiano({ blocchi: [{ minuti: 15 }, { minuti: '20' }, { minuti: '' }] })).toBe(35)
    expect(durataPiano(null)).toBe(0)
  })
})
