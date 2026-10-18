import { useEffect, useRef } from 'react'

// Chiede conferma prima di lasciare una pagina con modifiche non salvate.
// Il router è un HashRouter dichiarativo (niente useBlocker): si intercettano
// i clic sui link interni prima che arrivino a React (righe dell'elenco
// affiancato, sottobarra, menu, icone dell'header) e la chiusura della scheda
// del browser. Per i pulsanti della pagina che navigano c'è `puoiUscire()`.
export default function useModificheNonSalvate(sporco, messaggio = 'Uscire senza salvare le modifiche?') {
  const stato = useRef({ sporco, messaggio })
  stato.current = { sporco, messaggio }

  useEffect(() => {
    const suClic = (e) => {
      if (!stato.current.sporco || e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || a.target === '_blank') return
      const href = a.getAttribute('href')
      // solo link interni, e non quello della pagina in cui si è già
      if (!href.startsWith('#') && !href.startsWith('/')) return
      if (href === window.location.hash) return
      if (window.confirm(stato.current.messaggio)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const primaDiChiudere = (e) => {
      if (!stato.current.sporco) return
      e.preventDefault()
      e.returnValue = ''
    }
    // fase di cattura su document: arriva prima del listener di React sul root
    document.addEventListener('click', suClic, true)
    window.addEventListener('beforeunload', primaDiChiudere)
    return () => {
      document.removeEventListener('click', suClic, true)
      window.removeEventListener('beforeunload', primaDiChiudere)
    }
  }, [])

  return () => !stato.current.sporco || window.confirm(stato.current.messaggio)
}
