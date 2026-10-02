import { describe, it, expect } from 'vitest'
import { fuoriRuolo, sigleAccettate, MODULI_FORMATO } from './formazioni'

const slot = (sigla, u = 0.5) => ({ sigla, u, t: 0.5 })

describe('fuoriRuolo: il triangolo solo quando serve', () => {
  it('nella sua posizione o in una coperta non è fuori ruolo', () => {
    expect(fuoriRuolo({ player: { ruoloNaturale: 'DC' }, slot: slot('DC') })).toBe(false)
    expect(fuoriRuolo({ player: { ruoloNaturale: 'ED', ruoliAdattati: ['ATT'] }, slot: slot('ATT') })).toBe(false)
  })

  it('CDC e COC in uno slot CC sono la stessa posizione', () => {
    expect(fuoriRuolo({ player: { ruoloNaturale: 'CDC' }, slot: slot('CC') })).toBe(false)
    expect(fuoriRuolo({ player: { ruoloNaturale: 'COC' }, slot: slot('CC') })).toBe(false)
  })

  it('chi ha già il ruolo tattico richiesto non è fuori ruolo', () => {
    const player = { ruoloNaturale: 'ATT', ruoliTattici: ['Mezzala'] }
    expect(fuoriRuolo({ player, slot: slot('CC'), ruoloNome: 'Mezzala' })).toBe(false)
    expect(fuoriRuolo({ player, slot: slot('CC'), ruoloNome: 'Mediano' })).toBe(true)
  })

  it('i difensori larghi del 4-2-1 accettano i terzini, i braccetti del 3-3-1 no', () => {
    const [, sx, , , dx] = MODULI_FORMATO[8]['4-2-1'].slots
    expect(sigleAccettate(sx)).toContain('TS')
    expect(fuoriRuolo({ player: { ruoloNaturale: 'TD' }, slot: dx })).toBe(false)
    const braccetto = MODULI_FORMATO[8]['3-3-1'].slots[1]
    expect(fuoriRuolo({ player: { ruoloNaturale: 'TD' }, slot: braccetto })).toBe(true)
  })

  it('fuori da tutto resta fuori ruolo', () => {
    expect(fuoriRuolo({ player: { ruoloNaturale: 'ATT' }, slot: slot('DC') })).toBe(true)
  })
})
