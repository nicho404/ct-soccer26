import Modal from './Modal'
import FacciaUmore from './FacciaUmore'
import {
  SOGLIE_MINUTAGGIO, IMPEGNO_PIENO, IMPEGNO_MINIMO, umoreInfo, umoreDa,
} from '../lib/umore'
import PercentualePresenze from './PercentualePresenze'

const pct = (x) => `${Math.round(x * 100)}%`

// Fasce [da, a) da una lista di soglie ordinate dall'alto: `a` è la soglia
// precedente, null per la prima (fino al 100%).
const fasce = (soglie) => soglie.map((s, i) => ({ ...s, a: i === 0 ? null : soglie[i - 1].min }))
const etichetta = (f) => (f.a == null ? `da ${pct(f.min)}` : f.min === 0 ? `sotto ${pct(f.a)}` : `${pct(f.min)}–${pct(f.a)}`)

// Legenda di umore e presenze, costruita dalle stesse soglie e dalla stessa
// funzione del calcolo (umoreDa): se si ritoccano in lib/umore.js, la
// spiegazione e la tabella seguono da sole.
export function UmoreLegenda() {
  const colonne = fasce(SOGLIE_MINUTAGGIO).reverse() // da chi gioca meno a chi gioca di più
  const righe = [
    { label: `da ${pct(IMPEGNO_PIENO)}`, quota: IMPEGNO_PIENO },
    { label: `${pct(IMPEGNO_MINIMO)}–${pct(IMPEGNO_PIENO)}`, quota: IMPEGNO_MINIMO },
    { label: `sotto ${pct(IMPEGNO_MINIMO)}`, quota: 0 },
  ]
  const cella = { textAlign: 'center', padding: '4px 2px' }

  return (
    <div className="small">
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Umore = quanto gioca rispetto a quanto c'è</div>
      <ul className="muted" style={{ margin: '0 0 10px', paddingLeft: 18 }}>
        <li><strong>Minutaggio</strong> = minuti giocati ÷ minuti disponibili (solo partite con referto in cui era presente)</li>
        <li><strong>Presenze</strong> = volte presente ÷ appelli (allenamenti + partite, i giustificati non contano)</li>
      </ul>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...cella, textAlign: 'left' }} className="muted">Presenze ↓ · Minuti →</th>
              {colonne.map((c) => (
                <th key={c.livello} style={cella} className="muted">{etichetta(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.label}>
                <td style={{ ...cella, textAlign: 'left' }} className="muted">{r.label}</td>
                {colonne.map((c) => (
                  <td key={c.livello} style={{ ...cella, fontSize: '1.15rem' }}>
                    <FacciaUmore livello={umoreDa(c.min, r.quota).livello.value} size={22} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ margin: '8px 0 12px' }}>
        Chi c'è sempre e gioca poco si arrabbia. Chi c'è poco e gioca poco resta <FacciaUmore livello="neutro" size={16} /> {umoreInfo('neutro').label.toLowerCase()}:
        non si aspetta di giocare. Le presenze non tolgono mai il buonumore a chi gioca.
      </p>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Percentuale presenze (solo presenze, non minuti)</div>
      <div className="chip-row" style={{ gap: 12 }}>
        <span><PercentualePresenze quota={IMPEGNO_PIENO} /> e oltre</span>
        <span><PercentualePresenze quota={IMPEGNO_MINIMO} />–{pct(IMPEGNO_PIENO - 0.01)}</span>
        <span>sotto <PercentualePresenze quota={IMPEGNO_MINIMO - 0.01} /></span>
      </div>
    </div>
  )
}

// L'emoji dell'umore è il bottone che apre la legenda. Dentro una card che
// è già un link (Rosa) il tocco non deve anche aprire la scheda giocatore.
export function EmojiUmore({ umore, onClick, size = 26 }) {
  return (
    <button
      type="button"
      className="emoji-umore"
      aria-label={`Umore: ${umore.label}. Come si calcola`}
      title={`Umore: ${umore.label}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
    >
      <FacciaUmore livello={umore.value} size={size} />
    </button>
  )
}

// Popup con la legenda: si chiude col ✕, toccando fuori o con Esc.
export function LegendaPopup({ onClose }) {
  return (
    <Modal titolo="Umore e presenze" onClose={onClose}>
      <UmoreLegenda />
    </Modal>
  )
}
