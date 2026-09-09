import { describe, it, expect } from 'vitest'
import {
  partitaGiocata, esitoPartita, partiteInProgramma, partiteGiocate,
  prossimaPartita, bilancio, formatDataPartita, quandoPartita, partiteContro,
} from './partite'

const OGGI = '2026-10-10'

const P = (data, extra = {}) => ({ data, ...extra })

describe('partitaGiocata / esitoPartita', () => {
  it('considera giocata solo la partita con entrambi i risultati', () => {
    expect(partitaGiocata(P('2026-10-01', { golFatti: 2, golSubiti: 1 }))).toBe(true)
    expect(partitaGiocata(P('2026-10-01', { golFatti: 2 }))).toBe(false)
    expect(partitaGiocata(P('2026-10-01'))).toBe(false)
  })

  it('tratta lo 0-0 come risultato valido, non come assenza di risultato', () => {
    const m = P('2026-10-01', { golFatti: 0, golSubiti: 0 })
    expect(partitaGiocata(m)).toBe(true)
    expect(esitoPartita(m)).toBe('N')
  })

  it('distingue vittoria, pareggio e sconfitta', () => {
    expect(esitoPartita(P('x', { golFatti: 3, golSubiti: 1 }))).toBe('V')
    expect(esitoPartita(P('x', { golFatti: 1, golSubiti: 1 }))).toBe('N')
    expect(esitoPartita(P('x', { golFatti: 0, golSubiti: 2 }))).toBe('P')
    expect(esitoPartita(P('x'))).toBe(null)
  })
})

describe('calendario', () => {
  const partite = [
    P('2026-10-18'),
    P('2026-10-10', { ora: '18:00' }),
    P('2026-10-10', { ora: '15:00' }),
    P('2026-10-03', { golFatti: 1, golSubiti: 0 }),
    P('2026-09-27', { golFatti: 0, golSubiti: 3 }),
  ]

  it('mette in programma anche la partita di oggi, ordinata per ora', () => {
    const p = partiteInProgramma(partite, OGGI)
    expect(p.map((m) => m.ora ?? m.data)).toEqual(['15:00', '18:00', '2026-10-18'])
  })

  it('archivia le partite passate dalla più recente', () => {
    expect(partiteGiocate(partite, OGGI).map((m) => m.data)).toEqual(['2026-10-03', '2026-09-27'])
  })

  it('la prossima è la più vicina in programma', () => {
    expect(prossimaPartita(partite, OGGI).ora).toBe('15:00')
    expect(prossimaPartita([], OGGI)).toBe(null)
  })

  it('una partita passata senza risultato resta nello storico, non diventa la prossima', () => {
    const conBuco = [P('2026-10-05'), ...partite]
    expect(prossimaPartita(conBuco, OGGI).data).toBe(OGGI)
    expect(partiteGiocate(conBuco, OGGI)[0].data).toBe('2026-10-05')
  })
})

describe('bilancio', () => {
  it('ignora le partite senza risultato', () => {
    expect(bilancio([
      P('a', { golFatti: 2, golSubiti: 1 }),
      P('b', { golFatti: 1, golSubiti: 1 }),
      P('c', { golFatti: 0, golSubiti: 2 }),
      P('d'),
    ])).toEqual({ giocate: 3, vinte: 1, pari: 1, perse: 1, golFatti: 3, golSubiti: 4 })
  })
})

describe('formattazione date', () => {
  it('formatta in italiano compatto', () => {
    expect(formatDataPartita('2026-10-10')).toBe('sab 10 ott')
    expect(formatDataPartita('')).toBe('—')
  })

  it('descrive la distanza dal giorno corrente', () => {
    expect(quandoPartita('2026-10-10', OGGI)).toBe('Oggi')
    expect(quandoPartita('2026-10-11', OGGI)).toBe('Domani')
    expect(quandoPartita('2026-10-09', OGGI)).toBe('Ieri')
    expect(quandoPartita('2026-10-15', OGGI)).toBe('tra 5 giorni')
    expect(quandoPartita('2026-10-07', OGGI)).toBe('3 giorni fa')
  })
})

describe('scontri diretti', () => {
  const partite = [
    P('2026-10-03', { opponentId: 1 }),
    P('2026-09-27', { opponentId: 2 }),
    P('2026-10-18', { opponentId: 1 }),
    P('2026-10-10', { opponentId: null }),
  ]

  it('tiene solo le partite con quella squadra, dalla più recente', () => {
    expect(partiteContro(partite, 1).map((m) => m.data)).toEqual(['2026-10-18', '2026-10-03'])
  })

  it('non confonde le partite senza avversario con una ricerca senza id', () => {
    expect(partiteContro(partite, null)).toEqual([])
    expect(partiteContro(partite, 99)).toEqual([])
  })
})
