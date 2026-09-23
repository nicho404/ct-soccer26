// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { db } from '../db/db'
import { seedDemoData } from '../db/demo'

import HomePage from './HomePage'
import RosaPage from './RosaPage'
import ModuloPage from './ModuloPage'
import PartitePage from './PartitePage'
import PartitaFormPage from './PartitaFormPage'
import PartitaRefertoPage from './PartitaRefertoPage'
import StoricoPage from './StoricoPage'
import PresenzePage from './PresenzePage'
import SedutaFormPage from './SedutaFormPage'
import PianiPage from './PianiPage'
import AvversariPage from './AvversariPage'
import AvversarioFormPage from './AvversarioFormPage'
import ManualePage from './ManualePage'
import ManualeFormPage from './ManualeFormPage'
import CapitanoPage from './CapitanoPage'
import ObservationPage from './ObservationPage'
import IntesePage from './IntesePage'
import AltroPage from './AltroPage'
import ImpostazioniPage from './ImpostazioniPage'
import GironePage from './GironePage'
import GironePartitaFormPage from './GironePartitaFormPage'
import AnalisiPage from './AnalisiPage'
import AnalisiDettaglioPage from './AnalisiDettaglioPage'
import AnalisiFormPage from './AnalisiFormPage'

// Una schermata nera è un errore di render non intercettato: qui lo si
// trasforma in un test che fallisce, montando ogni pagina per davvero.
const PAGINE = [
  ['Home', HomePage],
  ['Rosa', RosaPage],
  ['Modulo', ModuloPage],
  ['Partite', PartitePage],
  ['Nuova partita', PartitaFormPage],
  ['Referto', PartitaRefertoPage],
  ['Storico', StoricoPage],
  ['Presenze', PresenzePage],
  ['Nuova seduta', SedutaFormPage],
  ['Piani', PianiPage],
  ['Avversari', AvversariPage],
  ['Nuovo avversario', AvversarioFormPage],
  ['Manuale', ManualePage],
  ['Nuova voce manuale', ManualeFormPage],
  ['Capitano', CapitanoPage],
  ['Osservazione', ObservationPage],
  ['Intese', IntesePage],
  ['Altro', AltroPage],
  ['Impostazioni', ImpostazioniPage],
  ['Girone', GironePage],
  ['Partita del girone', GironePartitaFormPage],
  ['Analisi', AnalisiPage],
  ['Dettaglio analisi', AnalisiDettaglioPage],
  ['Modifica analisi', AnalisiFormPage],
]

// useLiveQuery risolve in modo asincrono: la pagina passa da null al
// contenuto vero, ed è nel secondo render che si rompe.
const attendiContenuto = async () => {
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 10))
    if (document.body.querySelector('.page, .onboarding')) return true
  }
  return false
}

function montaPagina(Pagina) {
  return render(
    <MemoryRouter initialEntries={['/x/1']}>
      <Routes>
        <Route path="/x/:id" element={<Pagina />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ogni pagina si apre senza schermata nera', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
  })

  afterEach(cleanup)

  for (const [nome, Pagina] of PAGINE) {
    it(`${nome} — database vuoto`, async () => {
      montaPagina(Pagina)
      expect(await attendiContenuto()).toBe(true)
      expect(screen.queryByText(/errore/i)).toBeNull()
    })
  }
})

describe('ogni pagina si apre con i dati demo', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await seedDemoData()
  })

  afterEach(cleanup)

  for (const [nome, Pagina] of PAGINE) {
    it(`${nome} — con dati`, async () => {
      montaPagina(Pagina)
      expect(await attendiContenuto()).toBe(true)
    })
  }
})

describe('girone con dati', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Aquile', formato: 7, setupDone: true })
    await db.competitions.add({ id: 1, nome: 'Contesto', tipo: 'campionato', penalita: [{ squadraId: 2, punti: 1, motivo: 'Ritardo' }] })
    await db.opponents.bulkAdd([{ id: 1, nome: 'Bisonti' }, { id: 2, nome: 'Delfini United' }])
    await db.giocatoriAvversari.bulkAdd([
      { id: 1, opponentId: 1, nome: 'Testa', sportxId: null },
      { id: 2, opponentId: 2, nome: 'Ferri', sportxId: null },
    ])
    await db.partiteGirone.add({
      id: 1, competitionId: 1, giornata: 1, data: null, ora: '', luogo: '', sportxId: null,
      casaId: 2, ospiteId: 1, golCasa: 2, golOspite: 4,
      eventi: [
        { tipo: 'gol', squadraId: 1, giocatoreId: 1 },
        { tipo: 'rosso', squadraId: 2, giocatoreId: 2 },
      ],
    })
    await db.matches.add({
      id: 1, data: '2026-09-07', competitionId: 1, giornata: 1, campo: 'casa', opponentId: 1,
      presenze: {}, golFatti: 1, golSubiti: 1, note: '', eventiAvversari: [{ tipo: 'giallo', giocatoreId: 1 }],
    })
  })

  afterEach(cleanup)

  const monta = (url, path, Pagina) => render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={path} element={<Pagina />} />
        <Route path="*" element={<div className="page">altrove</div>} />
      </Routes>
    </MemoryRouter>
  )

  for (const t of ['classifica', 'risultati', 'marcatori', 'cartellini']) {
    it(`tab ${t}`, async () => {
      monta(`/girone?t=${t}`, '/girone', GironePage)
      expect(await attendiContenuto()).toBe(true)
      expect(screen.queryByText(/errore/i)).toBeNull()
    })
  }

  it('classifica: la nostra riga è evidenziata', async () => {
    monta('/girone', '/girone', GironePage)
    const cella = await screen.findByText(/Aquile/)
    expect(cella.closest('tr').className).toBe('riga-nostra')
  })

  it('cartellini: il rosso finisce tra gli squalificati', async () => {
    monta('/girone?t=cartellini', '/girone', GironePage)
    expect(await screen.findByText('Squalificati da scontare (1)')).toBeTruthy()
  })

  it('il form crea squadra e giocatore nuovi e salva gli eventi', async () => {
    monta('/girone/nuova?c=1&g=2', '/girone/nuova', GironePartitaFormPage)
    await attendiContenuto()
    const [casa, ospite] = screen.getAllByPlaceholderText('Es. Bisonti')
    fireEvent.change(casa, { target: { value: 'Bisonti' } })
    fireEvent.change(ospite, { target: { value: 'Real Falchi' } })
    const [golCasa] = document.querySelectorAll('input[type="number"][min="0"]')
    fireEvent.change(golCasa, { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('Cognome Nome'), { target: { value: '  testa ' } })
    fireEvent.click(screen.getByText('Aggiungi'))
    fireEvent.click(screen.getByText('🟨 Giallo'))
    fireEvent.click(screen.getByRole('button', { name: 'Real Falchi' }))
    fireEvent.change(screen.getByPlaceholderText('Cognome Nome'), { target: { value: 'Serra Marco' } })
    fireEvent.click(screen.getByText('Aggiungi'))
    fireEvent.click(screen.getByText('Salva risultato'))

    await waitFor(async () => expect(await db.partiteGirone.count()).toBe(2))
    const nuova = await db.partiteGirone.where('giornata').equals(2).first()
    const falchi = await db.opponents.where('nome').equals('Real Falchi').first()
    const serra = await db.giocatoriAvversari.where('opponentId').equals(falchi.id).first()
    expect(nuova).toMatchObject({ competitionId: 1, casaId: 1, ospiteId: falchi.id, golCasa: 1, golOspite: null })
    // "testa" ritrova il giocatore esistente, Serra viene creato
    expect(nuova.eventi).toEqual([
      { tipo: 'gol', squadraId: 1, giocatoreId: 1 },
      { tipo: 'giallo', squadraId: falchi.id, giocatoreId: serra.id },
    ])
    expect(serra.nome).toBe('Serra Marco')
    expect(await db.giocatoriAvversari.where('opponentId').equals(1).count()).toBe(1)
  })

  it('form partita: salva giornata e marcatori avversari senza toccare il referto', async () => {
    await db.matches.update(1, { eventi: [{ tipo: 'gol', playerId: 7 }], minuti: { 7: 60 } })
    monta('/partite/1', '/partite/:id', PartitaFormPage)
    await attendiContenuto()
    const giornata = await screen.findByText('Giornata')
    fireEvent.change(giornata.parentElement.querySelector('input'), { target: { value: '3' } })
    fireEvent.change(screen.getByPlaceholderText('Cognome Nome'), { target: { value: 'Testa' } })
    fireEvent.click(screen.getByText('Aggiungi'))
    fireEvent.click(screen.getByText('Salva modifiche'))

    await waitFor(async () => expect((await db.matches.get(1)).giornata).toBe(3))
    const m = await db.matches.get(1)
    expect(m.eventiAvversari).toEqual([{ tipo: 'giallo', giocatoreId: 1 }, { tipo: 'gol', giocatoreId: 1 }])
    expect(m.eventi).toEqual([{ tipo: 'gol', playerId: 7 }])
    expect(m.minuti).toEqual({ 7: 60 })
  })

  it("form partita: prima della gara mostra bomber e squalificati dell'avversario", async () => {
    await db.matches.add({
      id: 2, data: '2026-10-05', competitionId: 1, campo: 'casa', opponentId: 2,
      presenze: {}, golFatti: null, golSubiti: null, note: '',
    })
    monta('/partite/2', '/partite/:id', PartitaFormPage)
    expect(await screen.findByText('Squalificati: Ferri (espulsione)')).toBeTruthy()
  })

  it('scheda avversario: rosa con gol e cartellini, e risultati nel girone', async () => {
    monta('/avversari/1', '/avversari/:id', AvversarioFormPage)
    expect(await screen.findByText(/Giocatori dal girone/)).toBeTruthy()
    expect(screen.getByText('Testa')).toBeTruthy()
    expect(screen.getByText('Risultati nel girone')).toBeTruthy()
  })
})

describe('analisi in Home', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 8, setupDone: true })
    await db.players.add({ nome: 'Mario Rossi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' })
    await db.analisi.bulkAdd([
      { id: 1, data: '2026-08-01', titolo: 'Vecchia analisi', obiettivi: [] },
      {
        id: 2, data: '2026-09-23', titolo: 'Analisi di prova', contesto: 'Contesto di prova',
        sintesi: 'Sintesi di prova.',
        puntiChiave: [
          { tipo: 'problema', testo: 'Primo punto' }, { tipo: 'forza', testo: 'Secondo punto' },
          { tipo: 'novita', testo: 'Terzo punto' }, { tipo: 'problema', testo: 'Quarto punto' },
          { tipo: 'forza', testo: 'Quinto punto, solo nel dettaglio' },
        ],
        obiettivi: [{ testo: 'Obiettivo uno', fatto: false }, { testo: 'Obiettivo due', fatto: false }],
        sezioni: [{ titolo: 'Sezione di prova', punti: ['Voce di sezione'] }],
      },
    ])
  })

  afterEach(cleanup)

  it('mostra la più recente, con quattro punti chiave e gli obiettivi', async () => {
    montaPagina(HomePage)
    expect(await screen.findByText('Analisi di prova')).toBeTruthy()
    expect(screen.queryByText('Vecchia analisi')).toBeNull()
    expect(screen.getByText('Primo punto')).toBeTruthy()
    expect(screen.queryByText('Quinto punto, solo nel dettaglio')).toBeNull()
    expect(screen.getByText('Obiettivo uno')).toBeTruthy()
  })

  it('un obiettivo spuntato dalla Home resta salvato', async () => {
    montaPagina(HomePage)
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Obiettivo due' }))
    await waitFor(async () => expect((await db.analisi.get(2)).obiettivi[1].fatto).toBe(true))
    expect((await db.analisi.get(2)).obiettivi[0].fatto).toBe(false)
  })

  it('il dettaglio mostra tutti i punti, divisi per tipo, e le sezioni', async () => {
    render(
      <MemoryRouter initialEntries={['/analisi/2']}>
        <Routes><Route path="/analisi/:id" element={<AnalisiDettaglioPage />} /></Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('Quinto punto, solo nel dettaglio')).toBeTruthy()
    expect(screen.getByText('⚠️ Da risolvere')).toBeTruthy()
    expect(screen.getByText('Sezione di prova')).toBeTruthy()
  })
})
