import { describe, it, expect } from 'vitest'
import {
  normalizzaAnalisi, ultimaAnalisi, avanzamentoObiettivi, alternaObiettivo,
  puntiDaTesto, testoDaPunti, tipoPuntoInfo,
} from './analisi'

describe('analisi', () => {
  it('in Home va la più recente per data, a parità l\'ultima inserita', () => {
    const lista = [
      { id: 1, data: '2026-09-23' }, { id: 2, data: '2026-10-20' }, { id: 3, data: '2026-10-20' },
    ]
    expect(ultimaAnalisi(lista).id).toBe(3)
    expect(ultimaAnalisi([])).toBe(null)
  })

  it('normalizza una riga incompleta e scarta le voci vuote', () => {
    const a = normalizzaAnalisi({
      id: 1, titolo: 'Titolo',
      puntiChiave: [{ tipo: 'forza', testo: 'Punto' }, { tipo: 'forza', testo: '  ' }],
      obiettivi: [{ testo: 'Obiettivo A' }, { testo: '' }],
      sezioni: [{ titolo: 'Sezione', punti: ['A', ''] }, { titolo: '', punti: [] }],
    })
    expect(a).toMatchObject({ sintesi: '', contesto: '', data: '' })
    expect(a.puntiChiave).toHaveLength(1)
    expect(a.obiettivi).toEqual([{ testo: 'Obiettivo A', fatto: false }])
    expect(a.sezioni).toEqual([{ titolo: 'Sezione', punti: ['A'] }])
  })

  it('spunta un obiettivo senza toccare gli altri e conta l\'avanzamento', () => {
    const obiettivi = [{ testo: 'A', fatto: false }, { testo: 'B', fatto: true }]
    const dopo = alternaObiettivo(obiettivi, 0)
    expect(dopo).toEqual([{ testo: 'A', fatto: true }, { testo: 'B', fatto: true }])
    expect(obiettivi[0].fatto).toBe(false)
    expect(avanzamentoObiettivi({ obiettivi: dopo })).toEqual({ fatti: 2, totale: 2 })
  })

  it('i punti di una sezione si scrivono uno per riga, anche con i trattini', () => {
    expect(puntiDaTesto('- primo\n\n• secondo  \nterzo')).toEqual(['primo', 'secondo', 'terzo'])
    expect(testoDaPunti(['a', 'b'])).toBe('a\nb')
  })

  it('un tipo sconosciuto diventa una novità, non un errore', () => {
    expect(tipoPuntoInfo('boh').value).toBe('novita')
  })
})
