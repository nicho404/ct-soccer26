import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// dopo index.css: deve vincere sullo sfondo generico di .badge
import './theme/medaglie.css'
import App from './App.jsx'
import { applicaTema, temaLocale } from './theme/tema'

// Prima del primo render: i colori arrivano dalla scelta salvata in locale,
// così l'app non lampeggia con la palette di default.
applicaTema(temaLocale())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: solo in produzione, per non interferire col dev server
if (import.meta.env.PROD) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  }
  // Senza storage persistente il browser può svuotare IndexedDB quando vuole
  if (navigator.storage?.persist) {
    navigator.storage.persisted()
      .then((ok) => ok || navigator.storage.persist())
      .catch(() => {})
  }
}
