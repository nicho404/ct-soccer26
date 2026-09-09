import { describe, it, expect } from 'vitest'
import { mediaCriterio, classificaCapitani, PESI } from './capitano'

const obs = (playerId, data, voti) => ({ playerId, data, voti })

describe('mediaCriterio', () => {
  const serie = [
    obs(1, '2026-09-01', { leadership: 3 }),
    obs(1, '2026-09-08', { leadership: 5 }),
    obs(1, '2026-09-15', { leadership: 4 }),
    obs(1, '2026-09-22', { leadership: 5 }),
  ]

  it('media le ultime 3 osservazioni, in scala 0-100', () => {
    // le più recenti: 5, 4, 5 → 4.67/5
    expect(mediaCriterio(serie, 'leadership')).toBe(93)
  })

  it('salta le osservazioni senza quel voto', () => {
    const misto = [...serie, obs(1, '2026-09-29', { intensita: 1 })]
    expect(mediaCriterio(misto, 'leadership')).toBe(93)
  })

  it('è null se il criterio non è mai stato votato o non esiste', () => {
    expect(mediaCriterio(serie, 'piedeDebole')).toBe(null)
    expect(mediaCriterio(serie, 'simpatia')).toBe(null)
    expect(mediaCriterio([], 'leadership')).toBe(null)
  })
})

describe('classificaCapitani', () => {
  const players = [
    { id: 1, nome: 'Capitano Naturale', carattere: 'leader' },
    { id: 2, nome: 'Fenomeno Assente', carattere: 'follower' },
    { id: 3, nome: 'Sconosciuto' },
  ]
  const observations = [
    obs(1, '2026-09-01', { leadership: 5, lettura: 4 }),
    obs(2, '2026-09-01', { leadership: 2, lettura: 5 }),
  ]
  const trainings = [
    { data: '2026-09-01', presenze: { 1: 'presente', 2: 'assente', 3: 'presente' } },
    { data: '2026-09-08', presenze: { 1: 'presente', 2: 'assente', 3: 'presente' } },
  ]
  const matches = [
    { formazione: { slots: [1, 2] }, minuti: { 1: 60, 2: 60 }, eventi: [] },
    { formazione: { slots: [1] }, minuti: { 1: 60 }, eventi: [] },
  ]

  const righe = classificaCapitani({ players, observations, trainings, matches })
  const di = (id) => righe.find((r) => r.playerId === id)

  it('mette davanti chi ha leadership, presenze e carattere', () => {
    expect(righe[0].playerId).toBe(1)
    expect(di(1).punteggio).toBeGreaterThan(di(2).punteggio)
  })

  it('non fa scavalcare chi ha un punteggio alto su pochissimi dati', () => {
    // il 3 ha 100 su una sola voce: resta dietro a chi ha un profilo completo
    expect(di(3).punteggio).toBeGreaterThan(di(1).punteggio)
    expect(righe.map((r) => r.playerId)).toEqual([1, 2, 3])
  })

  it('usa tutto il peso quando ci sono tutti i dati', () => {
    expect(di(1).copertura).toBe(100)
    // leadership 100, allenamenti 100, campo 100, carattere 100, lettura 80
    expect(di(1).punteggio).toBe(98)
  })

  it('rapporta la presenza in campo alle partite refertate', () => {
    expect(di(1).voci.find((v) => v.key === 'campo').valore).toBe(100)
    expect(di(2).voci.find((v) => v.key === 'campo').valore).toBe(50)
  })

  it('redistribuisce i pesi invece di contare zero i dati mancanti', () => {
    // il 3 non ha osservazioni, carattere né partite: resta solo l'appello
    const r = di(3)
    expect(r.voci.filter((v) => v.valore === null).map((v) => v.key).sort())
      .toEqual(['campo', 'carattere', 'leadership', 'lettura'])
    expect(r.copertura).toBe(25) // solo allenamenti: non ha mai giocato
    expect(r.punteggio).toBe(100) // 100% agli allenamenti, sul poco che si sa
  })

  it('non produce punteggi senza alcun dato', () => {
    const soloIgnoti = classificaCapitani({ players: [{ id: 9 }] })
    expect(soloIgnoti[0]).toMatchObject({ punteggio: null, copertura: 0 })
  })

  it('i pesi sommano a 100', () => {
    expect(PESI.reduce((a, v) => a + v.peso, 0)).toBe(100)
  })
})
