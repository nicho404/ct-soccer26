import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import Layout from './components/Layout'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import RosaPage from './pages/RosaPage'
import PlayerFormPage from './pages/PlayerFormPage'
import PlayerDetailPage from './pages/PlayerDetailPage'
import AltroPage from './pages/AltroPage'
import ImpostazioniPage from './pages/ImpostazioniPage'
import ObservationPage from './pages/ObservationPage'
import ModuloPage from './pages/ModuloPage'
import IntesePage from './pages/IntesePage'
import IntesaFormPage from './pages/IntesaFormPage'
import PartitePage from './pages/PartitePage'
import PartitaFormPage from './pages/PartitaFormPage'
import PartitaRefertoPage from './pages/PartitaRefertoPage'
import StoricoPage from './pages/StoricoPage'
import PresenzePage from './pages/PresenzePage'
import SedutaFormPage from './pages/SedutaFormPage'
import PianiPage from './pages/PianiPage'
import AvversariPage from './pages/AvversariPage'
import AvversarioFormPage from './pages/AvversarioFormPage'
import ManualePage from './pages/ManualePage'
import ManualeFormPage from './pages/ManualeFormPage'
import CapitanoPage from './pages/CapitanoPage'

export default function App() {
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
          <Route path="/rosa" element={<RosaPage />} />
          <Route path="/rosa/nuovo" element={<PlayerFormPage />} />
          <Route path="/rosa/:id" element={<PlayerDetailPage />} />
          <Route path="/rosa/:id/modifica" element={<PlayerFormPage />} />
          <Route path="/osservazione" element={<ObservationPage />} />
          <Route path="/intese" element={<IntesePage />} />
          <Route path="/intese/nuova" element={<IntesaFormPage />} />
          <Route path="/intese/:id" element={<IntesaFormPage />} />
          <Route path="/partite" element={<PartitePage />} />
          <Route path="/partite/nuova" element={<PartitaFormPage />} />
          <Route path="/partite/:id" element={<PartitaFormPage />} />
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
          <Route path="/manuale" element={<ManualePage />} />
          <Route path="/manuale/nuova" element={<ManualeFormPage />} />
          <Route path="/manuale/:id" element={<ManualeFormPage />} />
          <Route path="/capitano" element={<CapitanoPage />} />
          <Route path="/altro" element={<AltroPage />} />
          <Route path="/impostazioni" element={<ImpostazioniPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
