import { describe, it, expect } from 'vitest'
import {
  calcolaMinuti, golDaEventi, disallineamentoRisultato, refertoCompilato,
  portiereIniziale, aggregaGiocatori, classificaMarcatori, occupantiPerSlot,
} from './storico'

const SIGLE_7 = ['POR', 'DC', 'DC', 'ES', 'CC', 'ED', 'ATT']

describe('calcolaMinuti', () => {
  it('dà a tutti i titolari la partita intera se non succede nulla', () => {
    const { minuti } = calcolaMinuti({ titolari: [1, 2, 3], durata: 60 })
    expect(minuti).toEqual({ 1: 60, 2: 60, 3: 60 })
  })

  it('spezza i minuti sul cambio', () => {
    const { minuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'cambio', minuto: 40, outId: 2, inId: 3 }],
      durata: 60,
    })
    expect(minuti).toEqual({ 1: 60, 2: 40, 3: 20 })
  })

  it('ferma il giocatore espulso al minuto del rosso', () => {
    const { minuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'rosso', minuto: 25, playerId: 2 }],
      durata: 60,
    })
    expect(minuti).toEqual({ 1: 60, 2: 25 })
  })

  it('non raddoppia i minuti se un cambio fa entrare chi è già in campo', () => {
    const { minuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'cambio', minuto: 30, outId: null, inId: 2 }],
      durata: 60,
    })
    expect(minuti[2]).toBe(60)
  })

  it('schiaccia dentro la durata un minuto fuori scala', () => {
    const { minuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'cambio', minuto: 99, outId: 2, inId: 3 }],
      durata: 60,
    })
    expect(minuti).toEqual({ 1: 60, 2: 60, 3: 0 })
  })

  it('ordina gli eventi per minuto anche se inseriti alla rinfusa', () => {
    const { minuti } = calcolaMinuti({
      titolari: [1],
      eventi: [
        { tipo: 'cambio', minuto: 45, outId: 2, inId: 3 },
        { tipo: 'cambio', minuto: 20, outId: 1, inId: 2 },
      ],
      durata: 60,
    })
    expect(minuti).toEqual({ 1: 20, 2: 25, 3: 15 })
  })
})

describe('minuti in porta', () => {
  it('assegna tutta la partita al portiere titolare', () => {
    const { portaMinuti } = calcolaMinuti({
      titolari: [1, 2], portiereIniziale: 1, durata: 60,
    })
    expect(portaMinuti).toEqual({ 1: 60 })
  })

  it('passa la porta a chi entra al posto del portiere', () => {
    const { portaMinuti, minuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'cambio', minuto: 35, outId: 1, inId: 9 }],
      portiereIniziale: 1,
      durata: 60,
    })
    expect(portaMinuti).toEqual({ 1: 35, 9: 25 })
    expect(minuti[9]).toBe(25)
  })

  it('lascia la porta scoperta dopo il rosso al portiere', () => {
    const { portaMinuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'rosso', minuto: 20, playerId: 1 }],
      portiereIniziale: 1,
      durata: 60,
    })
    expect(portaMinuti).toEqual({ 1: 20 })
  })

  it('non conta come porta il cambio di un giocatore di movimento', () => {
    const { portaMinuti } = calcolaMinuti({
      titolari: [1, 2],
      eventi: [{ tipo: 'cambio', minuto: 30, outId: 2, inId: 3 }],
      portiereIniziale: 1,
      durata: 60,
    })
    expect(portaMinuti).toEqual({ 1: 60 })
  })
})

describe('referto e risultato', () => {
  it('riconosce un referto compilato dalla formazione', () => {
    expect(refertoCompilato({ formazione: { slots: [1, null, 2] } })).toBe(true)
    expect(refertoCompilato({ formazione: { slots: [null, null] } })).toBe(false)
    expect(refertoCompilato({})).toBe(false)
  })

  it('trova il portiere dallo slot POR', () => {
    expect(portiereIniziale({ slots: [7, 1, 2, 3, 4, 5, 6] }, SIGLE_7)).toBe(7)
    expect(portiereIniziale({ slots: [7] }, ['ATT'])).toBe(null)
  })

  it('conta gol fatti e subiti dagli eventi', () => {
    expect(golDaEventi([
      { tipo: 'gol' }, { tipo: 'gol' }, { tipo: 'golSubito' }, { tipo: 'giallo' },
    ])).toEqual({ fatti: 2, subiti: 1 })
  })

  it('segnala solo il disallineamento vero tra eventi e risultato', () => {
    const base = { golFatti: 2, golSubiti: 1 }
    expect(disallineamentoRisultato({
      ...base, eventi: [{ tipo: 'gol' }, { tipo: 'gol' }, { tipo: 'golSubito' }],
    })).toBe(null)
    expect(disallineamentoRisultato({ ...base, eventi: [{ tipo: 'gol' }] })).toEqual({
      eventi: { fatti: 1, subiti: 0 },
      risultato: { fatti: 2, subiti: 1 },
    })
  })

  it('tace se manca il risultato o non ci sono eventi', () => {
    expect(disallineamentoRisultato({ eventi: [{ tipo: 'gol' }] })).toBe(null)
    expect(disallineamentoRisultato({ golFatti: 1, golSubiti: 0, eventi: [] })).toBe(null)
  })
})

describe('occupantiPerSlot', () => {
  const modulo = { slots: [{ sigla: 'POR' }, { sigla: 'DC' }, { sigla: 'ED' }] }

  it('senza cambi, ogni slot ha solo il titolare', () => {
    const match = { formazione: { slots: [1, 2, 3] }, eventi: [] }
    expect(occupantiPerSlot(match, modulo)).toEqual([
      { slotIndex: 0, sigla: 'POR', playerIds: [1] },
      { slotIndex: 1, sigla: 'DC', playerIds: [2] },
      { slotIndex: 2, sigla: 'ED', playerIds: [3] },
    ])
  })

  it('un cambio aggiunge il subentrato allo stesso slot di chi esce', () => {
    const match = {
      formazione: { slots: [1, 2, 3] },
      eventi: [{ tipo: 'cambio', minuto: 40, outId: 3, inId: 4 }],
    }
    const ed = occupantiPerSlot(match, modulo).find((s) => s.slotIndex === 2)
    expect(ed).toEqual({ slotIndex: 2, sigla: 'ED', playerIds: [3, 4] })
  })

  it('due cambi sullo stesso slot in sequenza si incatenano', () => {
    const match = {
      formazione: { slots: [1, 2, 3] },
      eventi: [
        { tipo: 'cambio', minuto: 50, outId: 4, inId: 5 },
        { tipo: 'cambio', minuto: 20, outId: 3, inId: 4 },
      ],
    }
    const ed = occupantiPerSlot(match, modulo).find((s) => s.slotIndex === 2)
    expect(ed.playerIds).toEqual([3, 4, 5])
  })

  it('un cambio senza uscente riconoscibile in nessuno slot non si aggancia a niente', () => {
    const match = {
      formazione: { slots: [1, 2, 3] },
      eventi: [{ tipo: 'cambio', minuto: 40, outId: 99, inId: 4 }],
    }
    expect(occupantiPerSlot(match, modulo).flatMap((s) => s.playerIds)).toEqual([1, 2, 3])
  })

  it('uno slot mai schierato non compare nel risultato', () => {
    const match = { formazione: { slots: [1, null, 3] }, eventi: [] }
    expect(occupantiPerSlot(match, modulo).map((s) => s.slotIndex)).toEqual([0, 2])
  })

  it('senza formazione ritorna un elenco vuoto, non crasha', () => {
    expect(occupantiPerSlot({}, modulo)).toEqual([])
    expect(occupantiPerSlot(undefined, modulo)).toEqual([])
  })
})

describe('aggregati stagionali', () => {
  const partite = [
    {
      formazione: { slots: [1, 2, 3] },
      minuti: { 1: 60, 2: 60, 3: 40, 4: 20 },
      eventi: [
        { tipo: 'gol', minuto: 10, playerId: 2, assistId: 3 },
        { tipo: 'gol', minuto: 50, playerId: 4 },
        { tipo: 'golSubito', minuto: 30 },
        { tipo: 'giallo', minuto: 22, playerId: 3 },
        { tipo: 'cambio', minuto: 40, outId: 3, inId: 4 },
      ],
    },
    {
      formazione: { slots: [1, 4, 3] },
      minuti: { 1: 60, 4: 60, 3: 60 },
      eventi: [{ tipo: 'gol', minuto: 5, playerId: 2 }],
    },
    // senza referto: non deve entrare in nessun conteggio
    { golFatti: 3, golSubiti: 0, eventi: [{ tipo: 'gol', playerId: 1 }] },
  ]

  it('somma presenze, titolarità, minuti, gol e cartellini', () => {
    const righe = aggregaGiocatori(partite)
    const di = (id) => righe.find((r) => r.playerId === id)
    expect(di(1)).toMatchObject({ presenze: 2, titolarita: 2, minuti: 120, gol: 0 })
    expect(di(3)).toMatchObject({ presenze: 2, titolarita: 2, minuti: 100, assist: 1, gialli: 1 })
    expect(di(4)).toMatchObject({ presenze: 2, titolarita: 1, minuti: 80, gol: 1 })
    // ha segnato entrando senza referto-formazione nella seconda: presenza dai minuti
    expect(di(2)).toMatchObject({ presenze: 1, titolarita: 1, minuti: 60, gol: 2 })
  })

  it('ordina per minuti giocati', () => {
    expect(aggregaGiocatori(partite).map((r) => r.playerId)).toEqual([1, 3, 4, 2])
  })

  it('la classifica marcatori tiene solo chi ha gol o assist', () => {
    expect(classificaMarcatori(partite).map((r) => r.playerId)).toEqual([2, 4, 3])
  })
})
