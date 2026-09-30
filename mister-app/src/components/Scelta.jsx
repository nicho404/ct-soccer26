import { Children, isValidElement, useState } from 'react'
import Modal from './Modal'

// Testo semplice dai figli di un <option>: stringhe e numeri, anche spezzati.
const testo = (children) =>
  Children.toArray(children).map((c) => (typeof c === 'string' || typeof c === 'number' ? c : '')).join('')

// Al posto di <select>: stesso uso (figli <option>, onChange con
// e.target.value stringa) ma la scelta si fa in una finestra a schermo con
// ✕, non in un menu a tendina. Così le pagine cambiano solo il tag.
export default function Scelta({ value, onChange, children, titolo, className = 'select', style }) {
  const [aperta, setAperta] = useState(false)
  const opzioni = Children.toArray(children)
    .filter(isValidElement)
    .map((o) => ({ value: String(o.props.value ?? ''), label: testo(o.props.children) }))
  const attuale = String(value ?? '')
  const corrente = opzioni.find((o) => o.value === attuale)

  return (
    <>
      <button
        type="button"
        className={`${className} scelta`}
        style={style}
        aria-haspopup="dialog"
        onClick={() => setAperta(true)}
      >
        <span className="scelta-testo">{corrente?.label ?? ''}</span>
        <span className="scelta-freccia" aria-hidden="true">▾</span>
      </button>
      {aperta && (
        <Modal titolo={titolo ?? 'Scegli'} onClose={() => setAperta(false)}>
          <div className="scelta-lista">
            {opzioni.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`scelta-opzione ${o.value === attuale ? 'selected' : ''}`}
                onClick={() => {
                  onChange?.({ target: { value: o.value } })
                  setAperta(false)
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
