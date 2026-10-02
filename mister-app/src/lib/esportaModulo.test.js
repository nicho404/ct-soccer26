import { describe, it, expect } from 'vitest'
import { svgModulo, altezzaImmagine } from './esportaModulo'
import { MODULI_FORMATO } from './formazioni'

const modulo = MODULI_FORMATO[8]['4-2-1']
const players = [
  { id: 1, nome: 'Mario Rossi', soprannome: 'Rossi', numero: 9, ruoloNaturale: 'ATT' },
  { id: 2, nome: 'Luca Bianchi', soprannome: 'Bianchi', numero: 4, ruoloNaturale: 'DC' },
]
const base = { modulo, moduloKey: '4-2-1', slots: [null, null, null, null, null, null, null, 1], players, formato: 8, team: { nome: 'Test FC' } }

describe('immagine del modulo', () => {
  it('senza partita: solo il campo, come prima', () => {
    const svg = svgModulo(base)
    expect(svg).not.toContain('PANCHINA')
    expect(altezzaImmagine(base)).toBe(altezzaImmagine({}))
  })

  it('con una partita: avversario nel titolo e panchina sotto il campo', () => {
    const dati = { ...base, panchina: [players[1]], partita: { avversario: 'Bisonti', data: 'sab 4 ott' } }
    const svg = svgModulo(dati)
    expect(svg).toContain('vs Bisonti · sab 4 ott · 4-2-1')
    expect(svg).toContain('PANCHINA (1)')
    expect(svg).toContain('Bianchi')
    expect(altezzaImmagine(dati)).toBeGreaterThan(altezzaImmagine(base))
    expect(svg).toContain(`height="${altezzaImmagine(dati)}"`)
  })
})
