// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { render } from '@testing-library/react'
import { Simbolo, Cartellino } from './simboli'
import { TIPI_EVENTO, INCARICHI_FASE, STILI_GIOCO, STATI_ATTIVITA, TESSERAMENTO } from '../db/constants'
import { IMPOSTAZIONI } from '../lib/formazioni'
import { TIPI_PUNTO } from '../lib/analisi'
import { TIPI_EVENTO_AVVERSARI } from '../lib/girone'

const SRC = join(__dirname, '..')
// Emoji e pittogrammi (non frecce né punteggiatura tipografica)
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]/u

const file = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n)
  return statSync(p).isDirectory() ? file(p) : [p]
})

describe('emoji → icone', () => {
  it("nessuna emoji nel codice dell'interfaccia (i commenti non contano)", () => {
    const trovate = file(SRC)
      .filter((p) => /\.(jsx?|css)$/.test(p) && !/\.test\./.test(p))
      .flatMap((p) => readFileSync(p, 'utf8').split('\n')
        .map((riga, i) => ({ riga, i }))
        .filter(({ riga }) => EMOJI.test(riga) && !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(riga))
        .map(({ riga, i }) => `${relative(SRC, p)}:${i + 1}: ${riga.trim()}`))
    expect(trovate).toEqual([])
  })

  it('le costanti di dominio sono solo valori ed etichette', () => {
    for (const elenco of [TIPI_EVENTO, INCARICHI_FASE, STILI_GIOCO, STATI_ATTIVITA, TESSERAMENTO, IMPOSTAZIONI, TIPI_PUNTO, TIPI_EVENTO_AVVERSARI]) {
      for (const voce of elenco) {
        expect(voce).not.toHaveProperty('icona')
        expect(voce).not.toHaveProperty('emoji')
        expect(voce).not.toHaveProperty('badge')
        expect(voce).not.toHaveProperty('colore')
      }
    }
  })

  it('ogni evento, incarico, impostazione e punto ha la sua icona', () => {
    const gruppi = [['evento', TIPI_EVENTO], ['incarico', INCARICHI_FASE], ['impostazione', IMPOSTAZIONI],
      ['analisi', TIPI_PUNTO], ['eventoAvversari', TIPI_EVENTO_AVVERSARI]]
    for (const [gruppo, elenco] of gruppi) {
      for (const { value } of elenco) {
        const { container, unmount } = render(<Simbolo gruppo={gruppo} valore={value} />)
        expect(container.firstChild, `${gruppo}/${value}`).toBeTruthy()
        unmount()
      }
    }
  })

  it('i cartellini sono rettangoli, non caratteri', () => {
    const { container } = render(<><Cartellino colore="giallo" /><Cartellino colore="rosso" /></>)
    expect(container.querySelector('.cartellino-giallo').textContent).toBe('')
    expect(container.querySelector('.cartellino-rosso').getAttribute('aria-label')).toBe('Cartellino rosso')
  })
})
