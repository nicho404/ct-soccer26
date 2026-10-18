import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Tutti i colori passano dai token: un colore scritto a mano fuori da
// src/theme non cambierebbe con la palette né col modo chiaro/scuro.
const SRC = join(__dirname, '..')
const COLORE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/

function file(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? file(p) : [p]
  })
}

describe('colori', () => {
  it('nessun colore letterale fuori da src/theme', () => {
    const trovati = file(SRC)
      .filter((p) => /\.(jsx?|css)$/.test(p) && !/\.test\./.test(p))
      .filter((p) => !relative(SRC, p).startsWith('theme'))
      .flatMap((p) =>
        readFileSync(p, 'utf8').split('\n')
          .map((riga, i) => (COLORE.test(riga) ? `${relative(SRC, p)}:${i + 1}: ${riga.trim()}` : null))
          .filter(Boolean)
      )
    expect(trovati).toEqual([])
  })
})
