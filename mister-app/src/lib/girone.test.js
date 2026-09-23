import { describe, it, expect } from 'vitest'
import {
  NOI, classifica, statoGiornate, marcatori, cartellini, disallineamentoGirone,
  trovaGiocatore, pulisciNome,
} from './girone'

// Precampionato, giornate 1-2. La nostra squadra (NOI) è Aquile: le sue gare
// vivono in matches, tutte le altre in partiteGirone.
const COMP = 1
const GUF = 1, CAS = 2, FAL = 3, DEL = 4, BIS = 5
const opponents = [
  { id: GUF, nome: 'Gufi' },
  { id: CAS, nome: 'Castori' },
  { id: FAL, nome: 'Real Falchi' },
  { id: DEL, nome: 'Delfini United' },
  { id: BIS, nome: 'Bisonti' },
]

// giocatori creati al volo per nome, come fa il form
function rosaAvversari() {
  const giocatori = []
  const id = (squadraId, nome) => {
    let g = trovaGiocatore(giocatori, squadraId, nome)
    if (!g) {
      g = { id: giocatori.length + 1, opponentId: squadraId, nome, sportxId: null }
      giocatori.push(g)
    }
    return g.id
  }
  const ev = (tipo, squadraId, nome) => ({ tipo, squadraId, giocatoreId: id(squadraId, nome) })
  return { giocatori, ev }
}

function fixture() {
  const { giocatori, ev } = rosaAvversari()
  const gol = (s, ...nomi) => nomi.map((n) => ev('gol', s, n))
  let pid = 0
  const pg = (giornata, casaId, golCasa, golOspite, ospiteId, eventi = []) => ({
    id: ++pid, competitionId: COMP, giornata, data: null, ora: '', luogo: '', sportxId: null,
    casaId, ospiteId, golCasa, golOspite, eventi,
  })

  const partiteGirone = [
    pg(1, CAS, 7, 4, FAL),
    pg(1, DEL, 2, 4, BIS, [
      ...gol(DEL, 'Ferri', 'Galli'),
      ...gol(BIS, 'Conti', 'Costa T.', 'Testa', 'Marini'),
    ]),
    pg(2, GUF, 1, 4, DEL, [
      ...gol(GUF, 'Gatti'),
      ...gol(DEL, 'Amato', "D'Amico", 'Mascarò', 'Mascarò'),
    ]),
    pg(2, FAL, 4, 4, BIS, [
      ...gol(FAL, 'Costa R.', 'Lombardi', 'Serra', 'De Luca'),
      ...gol(BIS, 'Bruno', 'Costa T.', 'Marini', 'Testa'),
    ]),
  ]
  const matches = [
    // Aquile 2-1 Gufi: Rossi e Verdi sono nostri, fuori da qui
    {
      id: 1, data: '2026-09-07', competitionId: COMP, giornata: 1, campo: 'casa', opponentId: GUF,
      golFatti: 2, golSubiti: 1,
      eventiAvversari: [{ tipo: 'gol', giocatoreId: ev('gol', GUF, 'Neri').giocatoreId }],
    },
    // Castori 2-4 Aquile
    {
      id: 2, data: '2026-09-14', competitionId: COMP, giornata: 2, campo: 'trasferta', opponentId: CAS,
      golFatti: 4, golSubiti: 2,
    },
  ]
  return { partiteGirone, matches, opponents, giocatoriAvversari: giocatori, nomeNostro: 'Aquile' }
}

describe('classifica', () => {
  it('giornate 1-2 del precampionato', () => {
    const { righe, pariNonRisolta } = classifica(COMP, fixture())
    expect(righe.map((r) => [r.nome, r.pt, `${r.f}-${r.s}`])).toEqual([
      ['Aquile', 6, '6-3'],
      ['Bisonti', 4, '8-6'],
      ['Castori', 3, '9-8'],
      ['Delfini United', 3, '6-5'],
      ['Real Falchi', 1, '8-11'],
      ['Gufi', 0, '2-6'],
    ])
    expect(righe[0]).toMatchObject({ squadraId: NOI, nostra: true, g: 2, v: 2, n: 0, p: 0, dr: 3 })
    expect(righe[1]).toMatchObject({ g: 2, v: 1, n: 1, p: 0 })
    expect(pariNonRisolta).toBe(false)
  })

  it('Castori davanti a Delfini United per i gol fatti (stessa differenza reti)', () => {
    const { righe } = classifica(COMP, fixture())
    const liv = righe.find((r) => r.nome === 'Castori')
    const gp = righe.find((r) => r.nome === 'Delfini United')
    expect([liv.pt, liv.dr]).toEqual([gp.pt, gp.dr])
    expect(liv.pos).toBeLessThan(gp.pos)
  })

  it('ignora le partite senza risultato e quelle di altre competizioni', () => {
    const d = fixture()
    d.partiteGirone.push(
      { id: 90, competitionId: COMP, giornata: 3, casaId: GUF, ospiteId: FAL, golCasa: null, golOspite: null, eventi: [] },
      { id: 91, competitionId: 2, giornata: 1, casaId: GUF, ospiteId: FAL, golCasa: 5, golOspite: 0, eventi: [] },
    )
    const dm = classifica(COMP, d).righe.find((r) => r.nome === 'Gufi')
    expect([dm.pt, dm.g]).toEqual([0, 2])
  })

  it('mini-classifica a tre: prima gli scontri diretti, poi la differenza reti', () => {
    // A, B, C a 4 punti. Negli scontri diretti A 4, B 3, C 1;
    // C ha la differenza reti generale migliore ma resta terza.
    // D (7 pt) ed E (0) servono solo a completare i punti fuori dal gruppo.
    const A = 1, B = 2, C = 3, D = 4, E = 5
    const g = (casaId, golCasa, golOspite, ospiteId) =>
      ({ competitionId: COMP, giornata: 1, casaId, ospiteId, golCasa, golOspite, eventi: [] })
    const partiteGirone = [
      g(A, 1, 0, B), g(B, 1, 0, C), g(A, 0, 0, C),
      g(D, 2, 0, A), g(B, 1, 1, D), g(C, 10, 0, D), g(D, 1, 0, E),
    ]
    const ops = ['A', 'B', 'C', 'D', 'E'].map((nome, i) => ({ id: i + 1, nome }))
    const { righe } = classifica(COMP, { partiteGirone, opponents: ops })
    const tre = righe.filter((r) => ['A', 'B', 'C'].includes(r.nome))
    expect(tre.map((r) => r.pt)).toEqual([4, 4, 4])
    expect(tre.map((r) => [r.nome, r.ptDiretti])).toEqual([['A', 4], ['B', 3], ['C', 1]])
    expect(righe.find((r) => r.nome === 'C').dr).toBeGreaterThan(righe.find((r) => r.nome === 'A').dr)
  })

  it('segnala la parità che i criteri non risolvono', () => {
    const partiteGirone = [
      { competitionId: COMP, giornata: 1, casaId: 1, ospiteId: 2, golCasa: 1, golOspite: 1, eventi: [] },
    ]
    const { righe, pariNonRisolta } = classifica(COMP, {
      partiteGirone, opponents: [{ id: 1, nome: 'Uno' }, { id: 2, nome: 'Due' }],
    })
    expect(pariNonRisolta).toBe(true)
    expect(righe.every((r) => r.pariNonRisolta && r.pos === 1)).toBe(true)
  })

  it('sottrae le penalità, anche alla nostra squadra (squadraId 0)', () => {
    const competitions = [{
      id: COMP, nome: 'Precampionato',
      penalita: [{ squadraId: NOI, punti: 4, motivo: 'Distinta irregolare' }, { squadraId: GUF, punti: 1, motivo: 'Ritardo' }],
    }]
    const { righe } = classifica(COMP, { ...fixture(), competitions })
    const noi = righe.find((r) => r.nostra)
    expect([noi.pt, noi.penalita]).toEqual([2, 4])
    expect(righe.find((r) => r.nome === 'Gufi').pt).toBe(-1)
    expect(righe.map((r) => r.nome).slice(0, 4)).toEqual(['Bisonti', 'Castori', 'Delfini United', 'Aquile'])
  })
})

describe('statoGiornate', () => {
  it('conta le gare inserite su quelle attese (squadre / 2)', () => {
    const d = fixture()
    expect(statoGiornate(COMP, d)).toEqual([
      { giornata: 1, inserite: 3, giocate: 3, attese: 3, incompleta: false },
      { giornata: 2, inserite: 3, giocate: 3, attese: 3, incompleta: false },
    ])
    d.partiteGirone.push({ competitionId: COMP, giornata: 3, casaId: GUF, ospiteId: FAL, eventi: [] })
    expect(statoGiornate(COMP, d)[2]).toEqual({ giornata: 3, inserite: 1, giocate: 0, attese: 3, incompleta: true })
  })
})

describe('marcatori', () => {
  it('classifica i marcatori avversari, noi esclusi', () => {
    const lista = marcatori(COMP, fixture())
    expect(lista.filter((r) => r.gol === 2).map((r) => `${r.nome} (${r.squadra})`)).toEqual([
      'Costa T. (Bisonti)', 'Marini (Bisonti)', 'Mascarò (Delfini United)', 'Testa (Bisonti)',
    ])
    expect(lista.find((r) => r.nome === 'Neri')).toMatchObject({ squadra: 'Gufi', gol: 1 })
    expect(lista.reduce((t, r) => t + r.gol, 0)).toBe(20)
  })

  it('con tutteLeCompetizioni somma anche le altre competizioni', () => {
    const d = fixture()
    const mascaro = trovaGiocatore(d.giocatoriAvversari, DEL, 'mascarò')
    d.partiteGirone.push({
      competitionId: 2, giornata: 1, casaId: DEL, ospiteId: FAL, golCasa: 1, golOspite: 0,
      eventi: [{ tipo: 'gol', squadraId: DEL, giocatoreId: mascaro.id }],
    })
    expect(marcatori(COMP, d)[0]).not.toMatchObject({ nome: 'Mascarò', gol: 3 })
    expect(marcatori(COMP, d, { tutteLeCompetizioni: true })[0]).toMatchObject({ nome: 'Mascarò', gol: 3 })
  })
})

describe('cartellini', () => {
  // Rossi gioca per la squadra 1; ogni gara è 1 contro 2, una a settimana
  const giocatoriAvversari = [
    { id: 1, opponentId: 1, nome: 'Rossi Mario' },
    { id: 2, opponentId: 1, nome: 'Bianchi Luca' },
  ]
  const opps = [{ id: 1, nome: 'Uno' }, { id: 2, nome: 'Due' }]
  const gara = (i, eventi, conRisultato = true) => ({
    id: i, competitionId: 1 + (i % 2), giornata: i, data: `2026-10-${String(i).padStart(2, '0')}`,
    casaId: 1, ospiteId: 2,
    golCasa: conRisultato ? 0 : null, golOspite: conRisultato ? 0 : null,
    eventi: eventi.map(([tipo, giocatoreId]) => ({ tipo, squadraId: 1, giocatoreId })),
  })
  const rossi = (partiteGirone) =>
    cartellini({ partiteGirone, giocatoriAvversari, opponents: opps }).find((r) => r.giocatoreId === 1)

  it('diffida al 3° giallo, anche sommando competizioni diverse', () => {
    const r = rossi([gara(1, [['giallo', 1]]), gara(2, [['giallo', 1]]), gara(3, [['giallo', 1]])])
    expect(r).toMatchObject({ gialli: 3, diffidato: true, squalifica: null, daScontare: false })
  })

  it('squalifica al 4° giallo, da scontare finché la squadra non gioca ancora', () => {
    const quattro = [1, 2, 3, 4].map((i) => gara(i, [['giallo', 1]]))
    const r = rossi(quattro)
    expect(r).toMatchObject({ gialli: 4, diffidato: false, daScontare: true })
    expect(r.squalifica).toMatchObject({ motivo: '4° giallo', data: '2026-10-04' })

    // una gara successiva senza risultato non basta, una giocata sì
    expect(rossi([...quattro, gara(5, [], false)]).daScontare).toBe(true)
    expect(rossi([...quattro, gara(5, [])]).daScontare).toBe(false)
  })

  it("all'8° giallo scatta di nuovo, al 7° è di nuovo diffidato", () => {
    const sette = [1, 2, 3, 4, 5, 6, 7].map((i) => gara(i, [['giallo', 1]]))
    expect(rossi(sette)).toMatchObject({ gialli: 7, diffidato: true, daScontare: false })
    expect(rossi([...sette, gara(8, [['giallo', 1]])]).squalifica.motivo).toBe('8° giallo')
  })

  it('due gialli nella stessa gara: squalifica', () => {
    const r = rossi([gara(1, [['giallo', 1], ['giallo', 1]])])
    expect(r.squalifica.motivo).toBe('Doppia ammonizione')
    expect(r.daScontare).toBe(true)
  })

  it('rosso diretto: squalifica, e non tocca il compagno', () => {
    const lista = cartellini({
      partiteGirone: [gara(1, [['rosso', 1], ['giallo', 2]])], giocatoriAvversari, opponents: opps,
    })
    expect(lista.find((r) => r.giocatoreId === 1)).toMatchObject({ rossi: 1, daScontare: true })
    expect(lista.find((r) => r.giocatoreId === 2)).toMatchObject({ gialli: 1, squalifica: null })
  })

  it('conta anche i cartellini presi contro di noi (eventiAvversari)', () => {
    const lista = cartellini({
      matches: [{ id: 1, data: '2026-10-01', opponentId: 1, golFatti: 1, golSubiti: 0, eventiAvversari: [{ tipo: 'rosso', giocatoreId: 1 }] }],
      giocatoriAvversari, opponents: opps,
    })
    expect(lista[0]).toMatchObject({ squadra: 'Uno', rossi: 1, daScontare: true })
  })
})

describe('disallineamentoGirone', () => {
  const p = (golCasa, golOspite, eventi) => ({ casaId: 1, ospiteId: 2, golCasa, golOspite, eventi })
  const gol = (squadraId) => ({ tipo: 'gol', squadraId, giocatoreId: 1 })

  it('nessun avviso se i gol tornano o se non ci sono marcatori', () => {
    expect(disallineamentoGirone(p(2, 1, [gol(1), gol(1), gol(2), { tipo: 'giallo', squadraId: 2 }]))).toBe(null)
    expect(disallineamentoGirone(p(3, 0, []))).toBe(null)
  })

  it('segnala il lato che non torna', () => {
    expect(disallineamentoGirone(p(2, 1, [gol(1), gol(2)]))).toEqual([{ squadraId: 1, risultato: 2, eventi: 1 }])
    expect(disallineamentoGirone(p(null, null, [gol(1)]))).toEqual([{ squadraId: 1, risultato: null, eventi: 1 }])
  })

  it('su una nostra partita confronta i marcatori avversari coi gol subiti', () => {
    expect(disallineamentoGirone({ golSubiti: 1, eventiAvversari: [gol()] })).toBe(null)
    expect(disallineamentoGirone({ golSubiti: 2, eventiAvversari: [gol()] })).toEqual([{ squadraId: null, risultato: 2, eventi: 1 }])
  })
})

describe('nomi giocatori', () => {
  it('normalizza gli spazi e ritrova il giocatore senza guardare le maiuscole', () => {
    expect(pulisciNome('  Costa   T. ')).toBe('Costa T.')
    const g = [{ id: 1, opponentId: 5, nome: 'Costa T.' }, { id: 2, opponentId: 3, nome: 'Costa R.' }]
    expect(trovaGiocatore(g, 5, 'costa t.').id).toBe(1)
    expect(trovaGiocatore(g, 3, 'Costa T.')).toBe(null)
  })
})
