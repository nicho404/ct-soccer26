import { describe, it, expect } from 'vitest'
import { PALETTE, TOKEN, MODI, TEMA_DEFAULT } from './palette'
import { normalizzaTema, versioneDi, tokenDi } from './tema'

// Contrasto WCAG 2: (L1 + 0.05) / (L2 + 0.05) con la luminanza relativa
const canale = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminanza = (hex) => {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16))
  return 0.2126 * canale(r) + 0.7152 * canale(g) + 0.0722 * canale(b)
}
export const contrasto = (a, b) => {
  const [l1, l2] = [luminanza(a), luminanza(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// Coppie testo/fondo che devono reggere l'AA (4.5:1)
const COPPIE = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['muted', 'surface'],
  ['muted', 'bg'],
  ['on-accent', 'accent'],
  ['accent-strong', 'surface'],
  ['ok', 'surface'],
  ['warn', 'surface'],
  ['danger', 'surface'],
]

describe('palette', () => {
  it('il calcolo del contrasto è quello WCAG', () => {
    expect(contrasto('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrasto('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  it('id unici e default valido', () => {
    expect(new Set(PALETTE.map((p) => p.id)).size).toBe(PALETTE.length)
    expect(PALETTE.some((p) => p.id === TEMA_DEFAULT.palette)).toBe(true)
    expect(MODI.map((m) => m.value)).toEqual(['chiaro', 'scuro', 'sistema'])
  })

  for (const p of PALETTE) {
    for (const versione of ['light', 'dark']) {
      it(`${p.nome} ${versione === 'light' ? 'chiara' : 'scura'}: tutti i token`, () => {
        expect(Object.keys(p[versione]).sort()).toEqual([...TOKEN].sort())
      })

      for (const [testo, fondo] of COPPIE) {
        it(`${p.nome} ${versione === 'light' ? 'chiara' : 'scura'}: --${testo} su --${fondo} ≥ 4.5`, () => {
          expect(contrasto(p[versione][testo], p[versione][fondo])).toBeGreaterThanOrEqual(4.5)
        })
      }
    }
  }
})

describe('scelta del tema', () => {
  it('modo e palette sconosciuti tornano ai default', () => {
    expect(normalizzaTema(null)).toEqual(TEMA_DEFAULT)
    expect(normalizzaTema({ palette: 'arcobaleno', modo: 'boh' })).toEqual(TEMA_DEFAULT)
    expect(normalizzaTema({ palette: 'blu', modo: 'chiaro' })).toEqual({ palette: 'blu', modo: 'chiaro' })
  })

  it('"Come il sistema" segue prefers-color-scheme', () => {
    expect(versioneDi('sistema', true)).toBe('dark')
    expect(versioneDi('sistema', false)).toBe('light')
    expect(versioneDi('chiaro', true)).toBe('light')
    expect(versioneDi('scuro', false)).toBe('dark')
  })

  it('il campo resta verde in entrambe le versioni', () => {
    const scuro = tokenDi({ palette: 'rosso', modo: 'scuro' }, false).token
    const chiaro = tokenDi({ palette: 'rosso', modo: 'chiaro' }, false).token
    expect(scuro.campo).toBe(chiaro.campo)
    expect(scuro.bg).not.toBe(chiaro.bg)
  })
})
