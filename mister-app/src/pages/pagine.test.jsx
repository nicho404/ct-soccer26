// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
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
