import { describe, it, expect } from 'vitest'
import { DOMANDE_PER_SLOT, domandePerSlot } from './domandeRuolo'

describe('domandePerSlot', () => {
  it('restituisce il set dedicato per uno slot che ce l\'ha', () => {
    expect(domandePerSlot('POR')).toBe(DOMANDE_PER_SLOT.POR)
    expect(domandePerSlot('DC').length).toBeGreaterThan(0)
  })

  it('ES e ED condividono lo stesso set (stessa funzione, lato opposto)', () => {
    expect(domandePerSlot('ES')).toBe(domandePerSlot('ED'))
  })

  it('le sigle senza set dedicato ricadono su quello analogo per funzione', () => {
    expect(domandePerSlot('TD')).toBe(domandePerSlot('ED'))
    expect(domandePerSlot('TS')).toBe(domandePerSlot('ES'))
    expect(domandePerSlot('CDC')).toBe(domandePerSlot('CC'))
    expect(domandePerSlot('COC')).toBe(domandePerSlot('CC'))
    expect(domandePerSlot('AD')).toBe(domandePerSlot('ED'))
    expect(domandePerSlot('AS')).toBe(domandePerSlot('ES'))
  })

  it('una sigla sconosciuta non crasha, dà un elenco vuoto', () => {
    expect(domandePerSlot('XYZ')).toEqual([])
    expect(domandePerSlot(undefined)).toEqual([])
  })

  it('ogni domanda ha un id unico nel proprio set', () => {
    for (const domande of Object.values(DOMANDE_PER_SLOT)) {
      const ids = domande.map((d) => d.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
