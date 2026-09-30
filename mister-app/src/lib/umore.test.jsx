// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { calcolaUmore, impegno, minutaggio, badgePresenze, umoreDa } from './umore'

// Una partita con referto da 50′ in cui il giocatore 1 era presente e ha
// giocato `min` minuti.
const partita = (min, stato = 'presente') => ({
  durata: 50,
  formazione: { slots: [2] },
  presenze: { 1: stato },
  minuti: { 1: min },
})
const sedute = (presenti, assenti = 0) => [
  ...Array(presenti).fill({ presenze: { 1: 'presente' } }),
  ...Array(assenti).fill({ presenze: { 1: 'assente' } }),
]

const umore = (minuti, trainings = sedute(10)) =>
  calcolaUmore({ trainings, matches: minuti.map((m) => partita(m)) }, 1)?.livello

describe('umore: sempre presente, cambia solo il minutaggio', () => {
  it('minutaggio massimo: sorridente', () => expect(umore([50, 50, 45])).toBe('sorridente'))
  it('minutaggio maggiore: contento', () => expect(umore([35, 35, 30])).toBe('contento'))
  it('minutaggio equo da panchinaro: neutro', () => expect(umore([25, 20, 20])).toBe('neutro'))
  it('un po\' di minutaggio: triste', () => expect(umore([10, 10, 10])).toBe('triste'))
  it('pochissimo minutaggio: arrabbiato', () => expect(umore([5, 0, 0])).toBe('arrabbiato'))
})

describe("umore: l'impegno pesa sullo scontento", () => {
  it('presenze a metà: lo scontento scende di un gradino', () => {
    // 6 presenze su 10 contando le 3 partite
    expect(umore([5, 0, 0], sedute(3, 4))).toBe('triste')
    expect(umore([10, 10, 10], sedute(3, 4))).toBe('neutro')
  })

  it('presenze scarse: chi gioca poco resta neutro', () => {
    expect(umore([5, 0, 0], sedute(0, 7))).toBe('neutro')
  })

  it('le presenze non tolgono la contentezza a chi gioca', () => {
    expect(umore([50, 50, 50], sedute(0, 7))).toBe('sorridente')
  })
})

describe('umore: fattori e casi limite', () => {
  it('le partite in cui era assente o senza referto non contano nel minutaggio', () => {
    const matches = [
      partita(25),
      partita(0, 'assente'),
      { durata: 50, presenze: { 1: 'presente' } }, // senza referto
    ]
    expect(minutaggio(matches, 1)).toEqual({ giocati: 25, disponibili: 50, partite: 1, quota: 0.5 })
  })

  it('i giustificati non contano nelle presenze', () => {
    const trainings = [{ presenze: { 1: 'presente' } }, { presenze: { 1: 'giustificato' } }]
    expect(impegno({ trainings }, 1)).toEqual({ presenti: 1, assenti: 0, giustificati: 1, totale: 1, quota: 1 })
    expect(impegno({ trainings: [{ presenze: { 1: 'giustificato' } }] }, 1).quota).toBe(null)
    expect(impegno({ trainings: [] }, 1)).toBe(null)
  })

  it('senza partite con referto non c\'è umore', () => {
    expect(calcolaUmore({ trainings: sedute(10), matches: [] }, 1)).toBe(null)
  })

  it('spiega i fattori', () => {
    const u = calcolaUmore({ trainings: sedute(9), matches: [partita(5)] }, 1)
    expect(u.emoji).toBe('😠')
    expect(u.fattori).toEqual([
      { nome: 'Presenze', valore: '100%', dettaglio: '10 su 10 tra allenamenti e partite' },
      { nome: 'Minutaggio', valore: '10%', dettaglio: '5′ su 50′ nella partita in cui era presente' },
    ])
    expect(u.nota).toBe('È sempre presente ma gioca poco.')
  })
})

describe('badge presenze', () => {
  it('copre da 0 a 100 con le fasce del mister', () => {
    const b = (q) => badgePresenze(q)?.value
    expect([1, 0.9, 0.89, 0.8, 0.75, 0.6, 0.55, 0.45, 0.39, 0].map(b)).toEqual([
      'diamante', 'diamante', 'oro', 'oro', 'argento', 'bronzo', 'ferro', 'legno', 'cartone', 'cartone',
    ])
    expect(badgePresenze(null)).toBe(null)
  })
})

describe('umoreDa: presenze bassissime e pochi minuti non fanno arrabbiare', () => {
  it('stesso minutaggio minimo, presenze diverse', () => {
    expect(umoreDa(0.05, 1).livello.value).toBe('arrabbiato')
    expect(umoreDa(0.05, 0.6).livello.value).toBe('triste')
    expect(umoreDa(0.05, 0.1).livello.value).toBe('neutro')
  })
})

describe('legenda umore', () => {
  it('il ? apre la legenda con le soglie del calcolo', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    const { EmojiUmore, LegendaPopup } = await import('../components/UmoreLegenda')
    const { useState } = await import('react')
    function Prova() {
      const [aperta, setAperta] = useState(false)
      return (
        <>
          <EmojiUmore umore={{ emoji: '😐', label: 'Neutro' }} onClick={() => setAperta(true)} />
          {aperta && <LegendaPopup onClose={() => setAperta(false)} />}
        </>
      )
    }
    render(<Prova />)
    expect(screen.queryByText('da 85%')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Umore: Neutro/ }))
    expect(screen.getByText('da 85%')).toBeTruthy()
    expect(screen.getByText('35%–60%')).toBeTruthy()
    expect(screen.getByText('sotto 15%')).toBeTruthy()
    expect(screen.getByText(/Chi c'è poco e gioca poco resta/)).toBeTruthy()
    expect(screen.getByText(/Cartone sotto 40%/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    cleanup()
  })
})
