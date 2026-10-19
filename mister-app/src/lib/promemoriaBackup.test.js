import { describe, it, expect } from 'vitest'
import { statoBackup, testoBackup } from './promemoriaBackup'

const ora = new Date(2026, 9, 19, 10, 0)
const fa = (giorni, ore = 12) => new Date(2026, 9, 19 - giorni, ore, 0).toISOString()

describe('promemoria backup', () => {
  it('neutro fino a 7 giorni, avviso oltre, allarme oltre 14', () => {
    expect([0, 1, 7, 8, 14, 15, 40].map((g) => statoBackup(fa(g), ora).livello)).toEqual([
      'recente', 'recente', 'recente', 'vecchio', 'vecchio', 'scaduto', 'scaduto',
    ])
  })

  it('mai fatto o data illeggibile: allarme', () => {
    expect(statoBackup(null, ora)).toEqual({ giorni: null, livello: 'scaduto' })
    expect(statoBackup('boh', ora).livello).toBe('scaduto')
  })

  it('conta i giorni di calendario, non le ore', () => {
    // ieri sera alle 23 è "ieri", anche se sono passate poche ore
    expect(statoBackup(new Date(2026, 9, 18, 23, 0).toISOString(), ora).giorni).toBe(1)
  })

  it('il testo della riga', () => {
    expect(testoBackup(statoBackup(null, ora))).toBe('Nessun backup ancora')
    expect(testoBackup(statoBackup(fa(0), ora))).toBe('Ultimo backup oggi')
    expect(testoBackup(statoBackup(fa(1), ora))).toBe('Ultimo backup ieri')
    expect(testoBackup(statoBackup(fa(9), ora))).toBe('Ultimo backup 9 giorni fa')
  })
})
