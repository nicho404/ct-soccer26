import { lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import Layout from './components/Layout'
import useTema from './hooks/useTema'
import DueColonne from './components/DueColonne'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import RosaPage from './pages/RosaPage'
import ModuloPage from './pages/ModuloPage'
import PartitePage from './pages/PartitePage'

// Home, Rosa, Partite e Modulo sono le pagine d'ingresso e arrivano subito;
// le altre si scaricano la prima volta che servono (il service worker le
// tiene comunque tutte in cache per l'uso offline).
const PlayerFormPage = lazy(() => import('./pages/PlayerFormPage'))
const PlayerDetailPage = lazy(() => import('./pages/PlayerDetailPage'))
const ImpostazioniPage = lazy(() => import('./pages/ImpostazioniPage'))
const ObservationPage = lazy(() => import('./pages/ObservationPage'))
const IntesePage = lazy(() => import('./pages/IntesePage'))
const IntesaFormPage = lazy(() => import('./pages/IntesaFormPage'))
const PartitaFormPage = lazy(() => import('./pages/PartitaFormPage'))
const PartitaRefertoPage = lazy(() => import('./pages/PartitaRefertoPage'))
const StoricoPage = lazy(() => import('./pages/StoricoPage'))
const PresenzePage = lazy(() => import('./pages/PresenzePage'))
const SedutaFormPage = lazy(() => import('./pages/SedutaFormPage'))
const PianiPage = lazy(() => import('./pages/PianiPage'))
const AvversariPage = lazy(() => import('./pages/AvversariPage'))
const AvversarioFormPage = lazy(() => import('./pages/AvversarioFormPage'))
const QuadernoPage = lazy(() => import('./pages/QuadernoPage'))
const ManualeFormPage = lazy(() => import('./pages/ManualeFormPage'))
const CapitanoPage = lazy(() => import('./pages/CapitanoPage'))
const GironePage = lazy(() => import('./pages/GironePage'))
const GironePartitaFormPage = lazy(() => import('./pages/GironePartitaFormPage'))
const AnalisiDettaglioPage = lazy(() => import('./pages/AnalisiDettaglioPage'))
const AnalisiFormPage = lazy(() => import('./pages/AnalisiFormPage'))

export default function App() {
  useTema()
  // ?? null: distingue "record assente" (null) da "query in corso" (undefined),
  // altrimenti senza record salvato l'app resterebbe su schermo nero
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])

  if (team === undefined) return null
  if (!team?.setupDone) return <OnboardingPage team={team} />

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/rosa" element={<DueColonne elenco={<RosaPage />} vuoto="Tocca un giocatore per aprire la sua scheda." />} />
          <Route path="/rosa/nuovo" element={<PlayerFormPage />} />
          <Route path="/rosa/:id" element={<DueColonne elenco={<RosaPage />} dettaglio={<PlayerDetailPage />} />} />
          <Route path="/rosa/:id/modifica" element={<PlayerFormPage />} />
          <Route path="/osservazione" element={<ObservationPage />} />
          <Route path="/intese" element={<IntesePage />} />
          <Route path="/intese/nuova" element={<IntesaFormPage />} />
          <Route path="/intese/:id" element={<IntesaFormPage />} />
          <Route path="/partite" element={<DueColonne elenco={<PartitePage />} vuoto="Tocca una partita per aprire la sua scheda." />} />
          <Route path="/partite/nuova" element={<PartitaFormPage />} />
          <Route path="/partite/:id" element={<DueColonne elenco={<PartitePage />} dettaglio={<PartitaFormPage />} />} />
          <Route path="/partite/:id/referto" element={<PartitaRefertoPage />} />
          <Route path="/modulo" element={<ModuloPage />} />
          <Route path="/presenze" element={<PresenzePage />} />
          <Route path="/presenze/nuova" element={<SedutaFormPage />} />
          <Route path="/presenze/piani" element={<PianiPage />} />
          <Route path="/presenze/:id" element={<SedutaFormPage />} />
          <Route path="/storico" element={<StoricoPage />} />
          <Route path="/avversari" element={<AvversariPage />} />
          <Route path="/avversari/nuovo" element={<AvversarioFormPage />} />
          <Route path="/avversari/:id" element={<AvversarioFormPage />} />
          <Route path="/manuale" element={<QuadernoPage scheda="manuale" />} />
          <Route path="/manuale/nuova" element={<ManualeFormPage />} />
          <Route path="/manuale/:id" element={<ManualeFormPage />} />
          <Route path="/capitano" element={<CapitanoPage />} />
          <Route path="/girone" element={<GironePage />} />
          <Route path="/girone/nuova" element={<GironePartitaFormPage />} />
          <Route path="/girone/:id" element={<GironePartitaFormPage />} />
          <Route path="/analisi" element={<QuadernoPage scheda="analisi" />} />
          <Route path="/analisi/nuova" element={<AnalisiFormPage />} />
          <Route path="/analisi/:id" element={<AnalisiDettaglioPage />} />
          <Route path="/analisi/:id/modifica" element={<AnalisiFormPage />} />
          <Route path="/impostazioni" element={<ImpostazioniPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
