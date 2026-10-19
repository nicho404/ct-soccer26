import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { iniettaPrecache } from './precache.js'

const sw = readFileSync(join(__dirname, '..', 'public', 'sw.js'), 'utf8')

describe('precache del service worker', () => {
  it('scrive tutti i file della build, chunk compresi, e una versione', () => {
    const out = iniettaPrecache(sw, ['assets/index-a1.js', 'assets/CapitanoPage-b2.js', 'assets/index-c3.css'])
    expect(out).toContain('const PRECACHE = ["./","assets/CapitanoPage-b2.js","assets/index-a1.js","assets/index-c3.css"]')
    expect(out).toMatch(/const CACHE = 'mister-app-[0-9a-f]{10}'/)
  })

  it('build diverse, cache diverse', () => {
    const una = iniettaPrecache(sw, ['assets/a-1.js']).match(/mister-app-(\w+)/)[1]
    const altra = iniettaPrecache(sw, ['assets/a-2.js']).match(/mister-app-(\w+)/)[1]
    expect(una).not.toBe(altra)
  })

  it('senza segnaposto la build si ferma invece di pubblicare un sw senza elenco', () => {
    expect(() => iniettaPrecache('const CACHE = "x"', [])).toThrow(/segnaposto/)
  })
})
