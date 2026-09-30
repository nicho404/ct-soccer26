import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Finestra a schermo: sfondo scuro, titolo e ✕. Si chiude anche toccando
// fuori o con Esc. Montata su <body> con un portal, così non eredita il
// layout (o i link) del punto in cui viene aperta.
export default function Modal({ titolo, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={titolo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <strong>{titolo}</strong>
          <button type="button" className="popup-chiudi" aria-label="Chiudi" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
