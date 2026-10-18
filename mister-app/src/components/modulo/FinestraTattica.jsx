import Modal from '../Modal'
import { IMPOSTAZIONI, COSTRUZIONI, LINEE_DIFESA, costruzioneInfo, lineaDifesaInfo } from '../../lib/formazioni'
import { PallinoCoerenza } from './AssettoRiga'
import { testoProblema } from './stato'

// Una voce della finestra: le opzioni come pulsanti, sotto la descrizione
// della scelta e l'eventuale problema di coerenza, nel suo colore.
function Voce({ titolo, opzioni, valore, onScegli, descrizione, problema }) {
  return (
    <div className="field">
      <label>{titolo}</label>
      <div className="chip-row">
        {opzioni.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`chip chip-sm ${valore === o.value ? 'selected' : ''}`}
            onClick={() => onScegli(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {descrizione && <p className="muted small" style={{ margin: '6px 0 0' }}>{descrizione}</p>}
      {problema && (
        <p className={`small coerenza-voce coerenza-voce-${problema.livello}`}>
          <PallinoCoerenza livello={problema.livello} /> {problema.testo}
        </p>
      )}
    </div>
  )
}

export default function FinestraTattica({
  formato, moduli, moduloKey, modulo, onModulo,
  impostazione, onImpostazione, costruzione, onCostruzione, linea, onLinea,
  coerenza, onClose,
}) {
  const problema = (tipo) => {
    const p = coerenza.problemi.find((x) => x.tipo === tipo)
    return p ? { livello: p.livello, testo: testoProblema(p, impostazione, linea) } : null
  }
  return (
    <Modal titolo="Tattica" onClose={onClose}>
      <p className="small" style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <PallinoCoerenza livello={coerenza.livello} />
        {coerenza.livello === 'ok'
          ? 'Modulo, impostazione, costruzione e linea sono coerenti.'
          : 'Qualcosa non torna: vedi gli avvisi sotto le voci.'}
      </p>
      <Voce
        titolo={`Modulo (calcio a ${formato})`}
        opzioni={moduli.map((k) => ({ value: k, label: k }))}
        valore={moduloKey}
        onScegli={onModulo}
        descrizione={modulo.descrizione}
        problema={problema('modulo')}
      />
      <Voce
        titolo="Impostazione"
        opzioni={IMPOSTAZIONI}
        valore={impostazione}
        onScegli={onImpostazione}
        descrizione={IMPOSTAZIONI.find((i) => i.value === impostazione)?.descrizione}
      />
      <Voce
        titolo="Costruzione"
        opzioni={COSTRUZIONI}
        valore={costruzione}
        onScegli={onCostruzione}
        descrizione={costruzioneInfo(costruzione).descrizione}
        problema={problema('costruzione')}
      />
      <Voce
        titolo="Linea difensiva"
        opzioni={LINEE_DIFESA}
        valore={linea}
        onScegli={onLinea}
        descrizione={lineaDifesaInfo(linea).descrizione}
        problema={problema('linea') ?? problema('modulo-linea')}
      />
      <button className="btn btn-primary btn-block" onClick={onClose}>
        Fatto
      </button>
    </Modal>
  )
}
