import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RosaPage from './pages/RosaPage'
import PlayerFormPage from './pages/PlayerFormPage'
import PlayerDetailPage from './pages/PlayerDetailPage'
import PlaceholderPage from './pages/PlaceholderPage'
import AltroPage from './pages/AltroPage'
import ImpostazioniPage from './pages/ImpostazioniPage'
import ObservationPage from './pages/ObservationPage'
import ModuloPage from './pages/ModuloPage'
import IntesePage from './pages/IntesePage'
import IntesaFormPage from './pages/IntesaFormPage'
import { IconCalendar, IconClipboardCheck, IconChart, IconTarget, IconBook, IconStar } from './components/icons'

export default function App() {
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
          <Route path="/partite" element={<PlaceholderPage title="Partite e calendario" icon={<IconCalendar />} milestone="M3" />} />
          <Route path="/modulo" element={<ModuloPage />} />
          <Route path="/presenze" element={<PlaceholderPage title="Presenze e sedute" icon={<IconClipboardCheck />} milestone="M5" />} />
          <Route path="/storico" element={<PlaceholderPage title="Storico" icon={<IconChart />} milestone="M6" />} />
          <Route path="/avversari" element={<PlaceholderPage title="Avversari" icon={<IconTarget />} milestone="M7" />} />
          <Route path="/manuale" element={<PlaceholderPage title="Manuale" icon={<IconBook />} milestone="M7" />} />
          <Route path="/capitano" element={<PlaceholderPage title="Capitano" icon={<IconStar />} milestone="M7" />} />
          <Route path="/altro" element={<AltroPage />} />
          <Route path="/impostazioni" element={<ImpostazioniPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
