import Scelta from '../Scelta'
import { IconPencil } from '../icons'
import { costruzioneInfo, lineaDifesaInfo } from '../../lib/formazioni'
import { testoProblema } from './stato'

const LIVELLO = { ok: 'coerente', warn: 'da rivedere', rotto: 'non regge' }

export const PallinoCoerenza = ({ livello }) => (
  <span className={`coerenza-dot coerenza-dot-${livello}`} role="img" aria-label={`Tattica ${LIVELLO[livello]}`} />
)

// Assetto in una riga: il modulo si cambia al volo, la tattica (impostazione,
// costruzione, linea) si apre in finestra. Sotto, l'avviso solo se qualcosa
// non torna.
export default function AssettoRiga({
  formato, moduli, moduloKey, onModulo, impInfo, impostazione, costruzione, linea, coerenza, onApriTattica,
}) {
  return (
    <>
      <div className="card modulo-assetto">
        <div style={{ width: 92, flexShrink: 0 }}>
          <Scelta
            titolo={`Modulo (calcio a ${formato})`}
            className="select select-compatta"
            value={moduloKey}
            onChange={(e) => onModulo(e.target.value)}
          >
            {moduli.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </Scelta>
        </div>
        <button type="button" className="modulo-tattica" aria-label="Tattica" onClick={onApriTattica}>
          <PallinoCoerenza livello={coerenza.livello} />
          <span className="modulo-tattica-testo">
            <strong>{impInfo?.label}</strong>
            <span className="muted">
              {costruzioneInfo(costruzione).label} · Linea {lineaDifesaInfo(linea).label.toLowerCase()}
            </span>
          </span>
          <span className="muted modulo-tattica-modifica"><IconPencil size={16} /></span>
        </button>
      </div>
      {coerenza.problemi.length > 0 && (
        <div className={`coerenza-banner coerenza-banner-${coerenza.livello}`} role="alert">
          {coerenza.problemi.map((p, i) => (
            <span key={i} className="coerenza-problema">
              <PallinoCoerenza livello={p.livello} />
              {testoProblema(p, impostazione, linea)}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
