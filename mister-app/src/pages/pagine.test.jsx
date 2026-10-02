// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
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
import QuadernoPage from './QuadernoPage'

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
    // dati e marcatori avversari stanno in finestra, dietro al riepilogo
    fireEvent.click(await screen.findByRole('button', { name: 'Modifica dati partita' }))
    const giornata = await screen.findByText('Giornata')
    fireEvent.change(giornata.parentElement.querySelector('input'), { target: { value: '3' } })
    fireEvent.click(screen.getByText('Fatto'))
    fireEvent.click(screen.getByText('Marcatori e cartellini avversari'))
    fireEvent.change(screen.getByPlaceholderText('Cognome Nome'), { target: { value: 'Testa' } })
    fireEvent.click(screen.getByText('Aggiungi'))
    fireEvent.click(screen.getByText('Fatto'))
    expect(screen.queryByRole('dialog')).toBeNull()
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

  it('Home: posizione in classifica e bilancio della stagione', async () => {
    await db.players.add({ nome: 'Mario Rossi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' })
    montaPagina(HomePage)
    expect(await screen.findByText('Stagione')).toBeTruthy()
    expect(screen.getByText(/^\d+°$/)).toBeTruthy()
    expect(screen.getByText('V-N-P')).toBeTruthy()
    expect(screen.getByText('Ultima partita')).toBeTruthy()
  })
})

describe('analisi', () => {
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

  it('la Home mostra solo dati: niente analisi', async () => {
    montaPagina(HomePage)
    expect(await screen.findByText('Prossima partita')).toBeTruthy()
    expect(screen.queryByText('Analisi di prova')).toBeNull()
    expect(screen.queryByText('Primo punto')).toBeNull()
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

describe('referto: cambi volanti, posizioni e incarichi', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.players.bulkAdd(
      ['Uno', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Otto'].map((n, i) => ({
        id: i + 1, nome: n, ruoloNaturale: 'CC', statoAttivita: 'sicuro',
      }))
    )
    await db.matches.add({
      id: 1, data: '2026-09-27', golFatti: 0, golSubiti: 0,
      presenze: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((id) => [id, 'presente'])),
      formazione: { formato: 7, modulo: '2-3-1', slots: [1, 2, 3, 4, 5, 6, 7] },
      eventi: [{ id: 1, tipo: 'cambio', minuto: 15, outId: 7, inId: 8 }],
    })
  })

  afterEach(cleanup)

  it('chi è uscito torna tra chi può entrare, e il rientro si salva con posizione e incarico', async () => {
    render(
      <MemoryRouter initialEntries={['/partite/1/referto']}>
        <Routes><Route path="/partite/:id/referto" element={<PartitaRefertoPage />} /></Routes>
      </MemoryRouter>
    )
    fireEvent.click(await screen.findByText('+ Aggiungi evento'))
    fireEvent.click(screen.getByRole('button', { name: '🔁 Cambio' }))
    const minuto = screen.getByText('Minuto').parentElement.querySelector('input')
    fireEvent.change(minuto, { target: { value: '30' } })

    // i menu di scelta si aprono in una finestra con l'elenco delle opzioni
    const apri = (label, titolo) => {
      fireEvent.click(screen.getByText(label).parentElement.querySelector('button.scelta'))
      return screen.getByRole('dialog', { name: titolo })
    }
    const voci = (dialog) => [...dialog.querySelectorAll('.scelta-opzione')].map((o) => o.textContent)
    const scegli = (dialog, inizio) =>
      fireEvent.click([...dialog.querySelectorAll('.scelta-opzione')].find((o) => o.textContent.startsWith(inizio)))

    // al 30′ in campo c'è Otto, non Sette; Sette è tornato disponibile
    let dialog = apri('Esce', 'Chi esce')
    expect(voci(dialog).some((t) => t.startsWith('Otto'))).toBe(true)
    expect(voci(dialog).some((t) => t.startsWith('Sette'))).toBe(false)
    scegli(dialog, 'Otto')
    expect(screen.queryByRole('dialog', { name: 'Chi esce' })).toBeNull()

    dialog = apri('Entra', 'Chi entra')
    expect(voci(dialog)).toContain('Sette')
    scegli(dialog, 'Sette')
    scegli(apri('Posizione di chi entra', 'Posizione di chi entra'), 'POR')
    const incaricoBozza = screen.getByText('Incarico di Sette').parentElement
    fireEvent.click([...incaricoBozza.querySelectorAll('button')].find((b) => b.textContent.includes('Difensivo')))
    fireEvent.click(screen.getByText('Aggiungi'))

    // incarico svolto: Sette aveva il difensivo, ha fatto entrambe le fasi
    // la riga mostra assegnato → svolto; il tocco apre la finestra per segnarli
    fireEvent.click(screen.getByRole('button', { name: 'Incarichi di Sette' }))
    const finestra = screen.getByRole('dialog', { name: 'Incarichi di Sette' })
    const svolto = [...finestra.querySelectorAll('label')].find((l) => l.textContent === 'Incarico svolto').parentElement
    fireEvent.click([...svolto.querySelectorAll('button')].find((b) => b.textContent.includes('Entrambe')))
    fireEvent.click(screen.getByText('Fatto'))
    expect(screen.getByRole('button', { name: 'Incarichi di Sette' }).textContent).toContain('Diverso')
    fireEvent.click(screen.getByText('Salva referto'))

    await waitFor(async () => expect((await db.matches.get(1)).eventi).toHaveLength(2))
    const m = await db.matches.get(1)
    expect(m.eventi[1]).toMatchObject({ tipo: 'cambio', minuto: 30, outId: 8, inId: 7, slotIndex: 0 })
    expect(m.formazione.incarichi).toEqual({ 7: 'difensivo' })
    expect(m.formazione.incarichiSvolti).toEqual({ 7: 'entrambe' })
    // Sette: 15′ + 30′; Otto: dal 15′ al 30′
    expect(m.minuti[7]).toBe(45)
    expect(m.minuti[8]).toBe(15)
  })

  it('non lascia far entrare chi è già in campo e segnala i cambi che non tornano', async () => {
    // formazione ritoccata a mano: Otto titolare, ma un cambio lo fa entrare al 15′
    await db.matches.update(1, {
      formazione: { formato: 7, modulo: '2-3-1', slots: [1, 2, 3, 4, 5, 6, 8] },
      eventi: [{ id: 1, tipo: 'cambio', minuto: 15, outId: 7, inId: 8 }],
    })
    render(
      <MemoryRouter initialEntries={['/partite/1/referto']}>
        <Routes><Route path="/partite/:id/referto" element={<PartitaRefertoPage />} /></Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText(/Un evento non torna/)).toBeTruthy()
    expect(screen.getByText(/Sette non è in campo al 15′; Otto è già in campo al 15′/)).toBeTruthy()
  })
})

describe('presenze e sedute', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.players.bulkAdd([
      { id: 1, nome: 'Mario Rossi', soprannome: 'Rossi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' },
      { id: 2, nome: 'Luca Bianchi', soprannome: 'Bianchi', ruoloNaturale: 'DC', statoAttivita: 'sicuro' },
    ])
    await db.trainings.bulkAdd([
      { id: 1, data: '2026-09-20', presenze: { 1: 'presente', 2: 'assente' } },
      { id: 2, data: '2026-09-24', presenze: { 1: 'presente', 2: 'giustificato' } },
    ])
    await db.matches.add({
      id: 1, data: '2026-09-27', golFatti: 1, golSubiti: 0, note: '',
      presenze: { 1: 'presente', 2: 'presente' },
    })
  })

  afterEach(cleanup)

  const PaginaCorrente = () => {
    const { pathname } = useLocation()
    return <div data-testid="pagina">{pathname}</div>
  }

  it('tabella presenze sotto l\'elenco, con le stesse percentuali e badge della Rosa', async () => {
    render(<MemoryRouter><PresenzePage /></MemoryRouter>)
    const titolo = await screen.findByText('Presenze giocatori')
    const elenco = screen.getByText('Sedute e partite')
    expect(elenco.compareDocumentPosition(titolo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Rossi 3/3 = 100% diamante; Bianchi 1 presente su 2 (giustificato escluso) = 50% ferro
    const riga = (nome) => screen.getByRole('link', { name: nome }).closest('tr').textContent
    expect(riga('Rossi')).toContain('100%')
    expect(riga('Rossi')).toContain('💎')
    expect(riga('Bianchi')).toContain('50%')
    expect(riga('Bianchi')).toContain('🔩')
    expect(screen.queryByText('Campo e allenamento')).toBeNull()
  })

  it('una partita aperta da qui, salvata, riporta a presenze e sedute', async () => {
    render(
      <MemoryRouter initialEntries={['/presenze']}>
        <Routes>
          <Route path="/presenze" element={<><PresenzePage /><PaginaCorrente /></>} />
          <Route path="/partite/:id" element={<PartitaFormPage />} />
          <Route path="/partite" element={<PaginaCorrente />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(await screen.findByText(/Avversario da definire/))
    fireEvent.click(await screen.findByText('Salva modifiche'))
    await waitFor(() => expect(screen.getByTestId('pagina').textContent).toBe('/presenze'))
  })
})

describe('capitano e vice', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await seedDemoData()
    await db.meta.delete('capitano')
    await db.meta.delete('vice')
  })

  afterEach(cleanup)

  it('nomina il vice, un giocatore ha una sola fascia, e il tag compare in Rosa', async () => {
    montaPagina(CapitanoPage)
    const vice = await screen.findAllByRole('button', { name: 'Nomina vice' })
    fireEvent.click(vice[0])
    await waitFor(async () => expect((await db.meta.get('vice'))?.value).toBeTruthy())
    const viceId = (await db.meta.get('vice')).value
    // il tocco sul pulsante non apre la finestra della riga
    expect(screen.queryByRole('dialog')).toBeNull()

    // lo stesso giocatore diventa capitano: perde la fascia di vice
    const riga = (await screen.findByRole('button', { name: 'Togli vice' })).closest('.capitano-riga')
    fireEvent.click(riga.querySelector('[aria-label="Nomina capitano"]'))
    await waitFor(async () => expect((await db.meta.get('capitano'))?.value).toBe(viceId))
    expect(await db.meta.get('vice')).toBeUndefined()

    // il tocco sulla riga apre i criteri, con la scheda e la ✕
    fireEvent.click(riga)
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('dei criteri coperto')
    expect(screen.getByRole('button', { name: 'Apri scheda giocatore' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    cleanup()

    await db.meta.put({ key: 'vice', value: (await db.players.toArray()).find((p) => p.id !== viceId).id })
    render(<MemoryRouter><RosaPage /></MemoryRouter>)
    expect(await screen.findByTitle('Vice')).toBeTruthy()
    expect(screen.getByTitle('Capitano')).toBeTruthy()
  })
})

describe('capitano scontento', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.players.bulkAdd([
      { id: 1, nome: 'Mario Rossi', soprannome: 'Rossi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' },
      { id: 2, nome: 'Luca Bianchi', soprannome: 'Bianchi', ruoloNaturale: 'DC', statoAttivita: 'sicuro' },
    ])
    await db.observations.add({ playerId: 1, data: '2026-09-20', voti: { leadership: 5 } })
    await db.trainings.bulkAdd([1, 2, 3].map((id) => ({ id, data: `2026-09-1${id}`, presenze: { 1: 'presente', 2: 'presente' } })))
    // Rossi presente ma in panchina tutta la partita
    await db.matches.add({
      id: 1, data: '2026-09-27', durata: 50, presenze: { 1: 'presente', 2: 'presente' },
      formazione: { slots: [2] }, minuti: { 2: 50 },
    })
    await db.meta.put({ key: 'capitano', value: 1 })
    await db.meta.put({ key: 'vice', value: 2 })
  })

  afterEach(cleanup)

  it("avvisa solo sul capitano scontento, non sul vice che gioca", async () => {
    montaPagina(CapitanoPage)
    const avvisi = await screen.findAllByText(/Scontento del minutaggio/)
    expect(avvisi).toHaveLength(1)
    expect(avvisi[0].closest('.fascia-tessera').textContent).toContain('Rossi')
  })
})

describe('durata partita da Impostazioni', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true, durataPartita: 50 })
    await db.matches.bulkAdd([
      { id: 1, data: '2026-10-06', presenze: {} },
      { id: 2, data: '2026-09-20', presenze: {}, durata: 60, formazione: { slots: [1] } },
    ])
  })

  afterEach(cleanup)

  const apri = (id) => render(
    <MemoryRouter initialEntries={[`/partite/${id}/referto`]}>
      <Routes><Route path="/partite/:id/referto" element={<PartitaRefertoPage />} /></Routes>
    </MemoryRouter>
  )

  it('un referto nuovo parte dalla durata della squadra', async () => {
    apri(1)
    expect(await screen.findByRole('button', { name: 'Durata della partita' })).toHaveProperty('textContent', '⏱ 50′')
  })

  it('un referto già salvato tiene la sua durata', async () => {
    apri(2)
    expect(await screen.findByRole('button', { name: 'Durata della partita' })).toHaveProperty('textContent', '⏱ 60′')
  })
})

describe('impostazioni: si modifica solo con la matita e si salva con Salva', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
  })

  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('niente modifiche finché non premi Salva, poi si salvano tutte insieme', async () => {
    montaPagina(ImpostazioniPage)
    // il nome squadra arriva solo a dati caricati: prima la matita è disattivata
    expect(await screen.findByText('Test FC')).toBeTruthy()
    expect(screen.getByText('60′')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Modifica dati squadra' }))
    fireEvent.click(screen.getByRole('button', { name: '50′' }))
    fireEvent.change(screen.getByPlaceholderText('Come ti chiami'), { target: { value: 'Nicholas' } })
    expect((await db.meta.get('team')).durataPartita).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: 'Salva' }))
    await waitFor(async () => expect((await db.meta.get('team')).durataPartita).toBe(50))
    expect((await db.meta.get('team')).mister).toBe('Nicholas')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(await screen.findByText('50′')).toBeTruthy()
  })

  it('chiudendo senza salvare chiede conferma e non tocca niente', async () => {
    const conferma = vi.spyOn(window, 'confirm').mockReturnValue(true)
    montaPagina(ImpostazioniPage)
    expect(await screen.findByText('Test FC')).toBeTruthy()
    expect(screen.getByText('50′')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Modifica dati squadra' }))
    fireEvent.click(screen.getByRole('button', { name: '70′' }))
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }))
    expect(conferma).toHaveBeenCalledWith('Chiudere senza salvare le modifiche?')
    expect((await db.meta.get('team')).durataPartita).toBe(50)
  })
})

describe('dati demo accanto ai dati reali', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 8, setupDone: true })
    await db.players.bulkAdd([
      { id: 901, nome: 'Vero Capitano', ruoloNaturale: 'CC', statoAttivita: 'sicuro' },
      { id: 902, nome: 'Vero Vice', ruoloNaturale: 'DC', statoAttivita: 'sicuro' },
    ])
    await db.meta.put({ key: 'capitano', value: 901 })
    await db.meta.put({ key: 'vice', value: 902 })
  })

  it('attivare e togliere la demo non tocca giocatori e fasce veri', async () => {
    const { clearDemoData } = await import('../db/demo')
    await seedDemoData()
    expect((await db.meta.get('capitano')).value).toBe(901)
    expect((await db.meta.get('vice')).value).toBe(902)
    expect(await db.players.count()).toBeGreaterThan(2)

    await clearDemoData()
    expect((await db.players.toArray()).map((p) => p.id).sort()).toEqual([901, 902])
    expect((await db.meta.get('capitano')).value).toBe(901)
    expect((await db.meta.get('vice')).value).toBe(902)
  })
})

describe('quaderno: analisi e manuale in una sezione', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.analisi.add({ id: 1, data: '2026-09-23', titolo: 'Analisi di prova', obiettivi: [] })
    await db.manualEntries.add({ id: 1, titolo: 'Voce di prova', categoria: 'tattica', testo: 'Testo' })
  })

  afterEach(cleanup)

  it('le due schede passano da analisi a manuale', async () => {
    render(
      <MemoryRouter initialEntries={['/analisi']}>
        <Routes>
          <Route path="/analisi" element={<QuadernoPage scheda="analisi" />} />
          <Route path="/manuale" element={<QuadernoPage scheda="manuale" />} />
        </Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('Analisi di prova')).toBeTruthy()
    expect(screen.queryByText('Voce di prova')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Manuale' }))
    expect(await screen.findByText('Voce di prova')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Manuale' }).getAttribute('aria-selected')).toBe('true')
  })
})

describe('osservazione da bordo campo', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.players.bulkAdd([
      { id: 1, nome: 'Mario Rossi', soprannome: 'Rossi', ruoloNaturale: 'DC', statoAttivita: 'sicuro' },
      { id: 2, nome: 'Luca Bianchi', soprannome: 'Bianchi', ruoloNaturale: 'ATT', statoAttivita: 'sicuro' },
      { id: 3, nome: 'Paolo Verdi', soprannome: 'Verdi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' },
    ])
    // in partita ha giocato solo Rossi (DC)
    await db.matches.add({
      id: 1, data: '2026-09-27', golFatti: 1, golSubiti: 0, durata: 50,
      presenze: { 1: 'presente' },
      formazione: { formato: 7, modulo: '2-3-1', slots: [null, 1, null, null, null, null, null] },
      minuti: { 1: 50 },
    })
  })

  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('nota e frecce rispetto al suo solito, salvate sulla scala di sempre', async () => {
    montaPagina(ObservationPage)
    fireEvent.click(await screen.findByRole('button', { name: /Bianchi/ }))
    const finestra = screen.getByRole('dialog')
    fireEvent.change(screen.getByLabelText('Nota'), { target: { value: 'Tiene palla e fa salire la squadra' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lettura del gioco: Sopra il suo solito' }))
    fireEvent.click(screen.getByRole('button', { name: 'Intensità: Sotto il suo solito' }))
    expect(finestra.textContent).not.toContain('Compiti del ruolo')
    fireEvent.click(screen.getByRole('button', { name: 'Salva' }))

    await waitFor(async () => expect(await db.observations.count()).toBe(1))
    const [o] = await db.observations.toArray()
    expect(o).toMatchObject({ playerId: 2, contesto: 'partitella', notaGenerale: 'Tiene palla e fa salire la squadra' })
    expect(o.voti).toEqual({ lettura: 4, intensita: 2 })
    expect(screen.queryByRole('dialog')).toBeNull()
    // la tessera ora è segnata come osservata
    expect(screen.getByRole('button', { name: /Bianchi/ }).textContent).toContain('✓')
  })

  it('in partita mostra solo chi ha giocato e le domande del suo ruolo', async () => {
    render(
      <MemoryRouter initialEntries={['/osservazione?matchId=1&playerId=1']}>
        <Routes><Route path="/osservazione" element={<ObservationPage />} /></Routes>
      </MemoryRouter>
    )
    const finestra = await screen.findByRole('dialog')
    expect(finestra.textContent).toContain('Compiti del ruolo')
    expect(finestra.textContent).toContain('Tiene la linea entro la metà campo?')
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }))
    expect(screen.getByRole('button', { name: /Rossi/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Bianchi/ })).toBeNull()
  })
})

describe('modulo: tattica in finestra e assetti compatti', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.players.add({ id: 1, nome: 'Mario Rossi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' })
    await db.meta.put({
      key: 'moduliSalvati',
      value: [{
        id: 5, nome: 'Titolari', formato: 7, modulo: '2-3-1', slots: [null, null, null, null, 1, null, null],
        impostazione: 'possesso', costruzione: 'equilibrata', linea: 'normale',
        cambiPrevisti: [{ id: 'c1', escePlayerId: 1, entraPlayerId: 1, trigger: 'minuto', dettaglio: 'ripresa' }],
      }],
    })
  })

  afterEach(cleanup)

  it('la tattica si sceglie in finestra e gli assetti si aprono dalla riga', async () => {
    montaPagina(ModuloPage)
    fireEvent.click(await screen.findByRole('button', { name: 'Tattica' }))
    expect(screen.getByRole('dialog', { name: 'Tattica' })).toBeTruthy()
    fireEvent.click(screen.getByText('Fatto'))

    const riga = screen.getByRole('button', { name: 'Assetto Titolari' })
    expect(riga.textContent).toContain('🔁 1')
    fireEvent.click(riga)
    const finestra = screen.getByRole('dialog', { name: 'Titolari' })
    expect(finestra.textContent).toContain('ripresa')
    fireEvent.click(screen.getByText('Carica in campo'))
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(async () => expect((await db.meta.get('modulo'))?.value?.byFormato?.[7]?.slots?.[4]).toBe(1))
  })
})

describe('modulo: indicatori sul campo', () => {
  beforeAll(async () => {
    if (!db.isOpen()) await db.open()
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.meta.put({ key: 'team', nome: 'Test FC', formato: 7, setupDone: true })
    await db.players.add({ id: 1, nome: 'Mario Rossi', soprannome: 'Rossi', ruoloNaturale: 'CC', statoAttivita: 'sicuro' })
  })

  afterEach(cleanup)

  it('spegnere un indicatore lo salva e lo toglie dal campo', async () => {
    montaPagina(ModuloPage)
    const ruoloSulCampo = () => document.querySelector('.pitch-svg').textContent
    fireEvent.click(await screen.findByRole('button', { name: 'Indicatori sul campo' }))
    const prima = ruoloSulCampo()
    fireEvent.click(screen.getByRole('switch', { name: 'Ruolo tattico' }))
    await waitFor(async () => expect((await db.meta.get('vistaCampo'))?.value?.ruoli).toBe(false))
    await waitFor(() => expect(ruoloSulCampo().length).toBeLessThan(prima.length))
    expect(screen.getByRole('button', { name: 'Indicatori sul campo' }).textContent).toContain('1 off')
  })
})
