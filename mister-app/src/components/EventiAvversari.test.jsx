// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import EventiAvversari from './EventiAvversari'

describe('eliminare chiede sempre conferma', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  const monta = (onChange) => render(
    <EventiAvversari
      eventi={[{ key: 'a', tipo: 'gol', lato: 'avversario', nome: 'Testa' }]}
      onChange={onChange}
      lati={[{ key: 'avversario', nome: 'Bisonti', opponentId: 1 }]}
      giocatori={[]}
    />
  )

  it('annullando non si toglie niente', () => {
    const conferma = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onChange = vi.fn()
    monta(onChange)
    fireEvent.click(screen.getByRole('button', { name: 'Togli Testa' }))
    expect(conferma).toHaveBeenCalledWith('Togliere Testa?')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('confermando si toglie', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onChange = vi.fn()
    monta(onChange)
    fireEvent.click(screen.getByRole('button', { name: 'Togli Testa' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
