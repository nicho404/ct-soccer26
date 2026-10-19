import { Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import useDesktop from '../hooks/useDesktop'

// Elenco e dettaglio affiancati su desktop, senza cambiare le rotte: /rosa
// mostra l'elenco con il riquadro vuoto, /rosa/12 l'elenco con la scheda.
// Sotto i 1024px si vede solo la pagina della rotta, come sempre.
export default function DueColonne({ elenco, dettaglio, vuoto }) {
  const desktop = useDesktop()
  const { pathname } = useLocation()
  if (!desktop) return dettaglio ?? elenco
  return (
    <div className="due-colonne">
      <div className="colonna-elenco">{elenco}</div>
      {/* key sul percorso: passando da un elemento all'altro la scheda
          riparte da zero, come aprendola dall'elenco su telefono */}
      <div className="colonna-dettaglio" key={pathname}>
        {/* la scheda si scarica a richiesta: l'elenco intanto resta lì */}
        <Suspense fallback={<div className="page" aria-busy="true" />}>
          {dettaglio ?? <div className="page dettaglio-vuoto muted">{vuoto}</div>}
        </Suspense>
      </div>
    </div>
  )
}
