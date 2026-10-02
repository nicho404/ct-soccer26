import { useState } from 'react'
import { db } from '../db/db'
import { VOCI_VISTA } from '../lib/vistaCampo'
import Modal from './Modal'

// Pulsante "👁️ Vista" sopra il campo e la sua finestra di interruttori.
// Una sola scelta per Modulo e referto: è salvata in meta 'vistaCampo'.
// `vista` è già completa (lib/vistaCampo.vistaCompleta): la legge il
// chiamante, che la passa anche a PitchView.
export default function VistaCampo({ vista }) {
  const [aperta, setAperta] = useState(false)
  const nascosti = Object.values(vista).filter((v) => !v).length
  const alterna = (key) => db.meta.put({ key: 'vistaCampo', value: { ...vista, [key]: !vista[key] } })

  return (
    <>
      <button
        type="button"
        className="btn btn-sm pitch-vista"
        aria-label="Indicatori sul campo"
        onClick={() => setAperta(true)}
      >
        👁️ Vista{nascosti > 0 ? ` · ${nascosti} off` : ''}
      </button>
      {aperta && (
        <Modal titolo="Indicatori sul campo" onClose={() => setAperta(false)}>
          {VOCI_VISTA.map((v) => (
            <div className="switch-row" key={v.key}>
              <div>
                <div className="label">{v.label}</div>
                <div className="muted small">{v.desc}</div>
              </div>
              <button
                type="button"
                className={`toggle ${vista[v.key] ? 'on' : ''}`}
                role="switch"
                aria-checked={vista[v.key]}
                aria-label={v.label}
                onClick={() => alterna(v.key)}
              />
            </div>
          ))}
          <p className="muted small" style={{ margin: '8px 0 12px' }}>
            Vale per il campo del Modulo e del referto. L'immagine da condividere non cambia.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => setAperta(false)}>Fatto</button>
        </Modal>
      )}
    </>
  )
}
