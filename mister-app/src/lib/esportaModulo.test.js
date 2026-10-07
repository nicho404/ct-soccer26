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

  describe('indicatori del campo', () => {
    const dati = {
      ...base,
      slots: [null, 2, null, null, null, null, null, 1],
      ruoli: modulo.slots.map(() => ({ nome: 'Opportunista', ruoloSuggerito: 'P-A' })),
      players: [
        { ...players[0], foto: 'data:image/png;base64,AAAA', ruoliTattici: ['Opportunista'] },
        players[1],
      ],
      intese: [{ id: 1, tipo: 'confermata', playerIds: [1, 2] }],
      incarichi: { 1: 'offensivo' },
    }
    const tutti = { foto: true, intese: true, ruoli: true, compatibilita: true, incarichi: true }
    const nessuno = { foto: false, intese: false, ruoli: false, compatibilita: false, incarichi: false }

    it('tutti spenti: solo campo, posizioni e nomi', () => {
      const svg = svgModulo({ ...dati, mostra: nessuno })
      expect(svg).not.toContain('Opportunista')
      expect(svg).not.toContain('<image')
      expect(svg).not.toContain('stroke-dasharray="6 4"')
      expect(svg).not.toContain('⚔️')
      expect(svg).not.toContain('#34d399')
      expect(svg).toContain('Rossi')
    })

    it('tutti accesi: foto, intese, ruolo tattico, ruolo ricoperto e incarico', () => {
      const svg = svgModulo({ ...dati, mostra: tutti })
      expect(svg).toContain('Opportunista')
      expect(svg).toContain('<image href="data:image/png;base64,AAAA"')
      expect(svg).toContain('stroke-dasharray="6 4"')
      expect(svg).toContain('⚔️')
      expect(svg).toContain('#34d399') // "+" ruolo suo
      expect(svg).toContain('⚠️') // il DC schierato da terzino è fuori ruolo
    })

    it('solo alcuni accesi: si vedono quelli e non gli altri', () => {
      const svg = svgModulo({ ...dati, mostra: { ...nessuno, ruoli: true } })
      expect(svg).toContain('Opportunista')
      expect(svg).not.toContain('<image')
      expect(svg).not.toContain('⚔️')
    })
  })
})
