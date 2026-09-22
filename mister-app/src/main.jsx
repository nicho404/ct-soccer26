import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
