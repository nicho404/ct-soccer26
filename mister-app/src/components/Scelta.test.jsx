// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useState } from 'react'
import Scelta from './Scelta'

function Prova() {
  const [v, setV] = useState('')
  return (
    <>
      <Scelta titolo="Giocatore" value={v} onChange={(e) => setV(e.target.value)}>
        <option value="">— Scegli —</option>
        {[1, 2].map((id) => <option key={id} value={id}>Giocatore {id}</option>)}
      </Scelta>
      <span data-testid="valore">{v}</span>
    </>
  )
}

describe('Scelta', () => {
  afterEach(cleanup)

  it('apre una finestra a schermo, sceglie e si chiude', () => {
    render(<Prova />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Scegli/ }))
    expect(screen.getByRole('dialog', { name: 'Giocatore' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Giocatore 2' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('valore').textContent).toBe('2')
    expect(screen.getByRole('button', { name: /Giocatore 2/ })).toBeTruthy()
  })

  it('la ✕ chiude senza cambiare la scelta', () => {
    render(<Prova />)
    fireEvent.click(screen.getByRole('button', { name: /Scegli/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('valore').textContent).toBe('')
  })
})
