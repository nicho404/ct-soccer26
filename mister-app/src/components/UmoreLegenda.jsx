import Modal from './Modal'
import {
  SOGLIE_MINUTAGGIO, IMPEGNO_PIENO, IMPEGNO_MINIMO, BADGE_PRESENZE, umoreInfo, umoreDa,
} from '../lib/umore'

const pct = (x) => `${Math.round(x * 100)}%`

// Fasce [da, a) da una lista di soglie ordinate dall'alto: `a` è la soglia
// precedente, null per la prima (fino al 100%).
const fasce = (soglie) => soglie.map((s, i) => ({ ...s, a: i === 0 ? null : soglie[i - 1].min }))
const etichetta = (f) => (f.a == null ? `da ${pct(f.min)}` : f.min === 0 ? `sotto ${pct(f.a)}` : `${pct(f.min)}–${pct(f.a)}`)

// Solo l'icona nel riquadro del colore: il nome del livello (e la
// percentuale, se passata) restano nel tooltip e per i lettori di schermo.
// La legenda li spiega per esteso.
export function BadgePresenze({ badge, quota }) {
  if (!badge) return null
  const descrizione = `Presenze: ${badge.label}${quota != null ? ` · ${pct(quota)}` : ''}`
  return (
    <span className={`badge badge-medaglia badge-icona medaglia-${badge.value}`} title={descrizione} aria-label={descrizione}>
      {badge.icona}
    </span>
  )
}

// Legenda di umore e badge, costruita dalle stesse soglie e dalla stessa
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
                    {umoreDa(c.min, r.quota).livello.emoji}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ margin: '8px 0 12px' }}>
        Chi c'è sempre e gioca poco si arrabbia. Chi c'è poco e gioca poco resta {umoreInfo('neutro').emoji}:
        non si aspetta di giocare. Le presenze non tolgono mai il buonumore a chi gioca.
      </p>

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Badge presenze (solo presenze, non minuti)</div>
      <div className="chip-row" style={{ gap: 6 }}>
        {fasce(BADGE_PRESENZE).map((b) => (
          <span key={b.value} className={`badge badge-medaglia medaglia-${b.value}`}>
            {b.icona} {b.label} {etichetta(b)}
          </span>
        ))}
      </div>
    </div>
  )
}

// L'emoji dell'umore è il bottone che apre la legenda. Dentro una card che
// è già un link (Rosa) il tocco non deve anche aprire la scheda giocatore.
export function EmojiUmore({ umore, onClick, size = '1.35rem' }) {
  return (
    <button
      type="button"
      className="emoji-umore"
      style={{ fontSize: size }}
      aria-label={`Umore: ${umore.label}. Come si calcola`}
      title={`Umore: ${umore.label}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
    >
      {umore.emoji}
    </button>
  )
}

// Popup con la legenda: si chiude col ✕, toccando fuori o con Esc.
export function LegendaPopup({ onClose }) {
  return (
    <Modal titolo="Umore e badge presenze" onClose={onClose}>
      <UmoreLegenda />
    </Modal>
  )
}
