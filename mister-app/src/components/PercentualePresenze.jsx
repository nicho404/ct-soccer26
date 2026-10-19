import { fasciaPresenze } from '../lib/umore'
import { TONO_PRESENZE } from './simboli'

// Percentuale presenze come numero colorato: verde da IMPEGNO_PIENO, giallo
// da IMPEGNO_MINIMO, rosso sotto (lib/umore). La quota viene sempre da
// impegno(), la stessa funzione in Rosa, scheda giocatore, Presenze e Capitano.
export default function PercentualePresenze({ quota, etichetta = false }) {
  if (quota == null) return null
  const testo = `${Math.round(quota * 100)}%`
  return (
    <span className={`presenze-pct presenze-${TONO_PRESENZE[fasciaPresenze(quota)]}`} title={`Presenze: ${testo}`}>
      {etichetta && <span className="presenze-etichetta">Presenze </span>}
      {testo}
    </span>
  )
}
