import { LIVELLI_UMORE, SOGLIE_MINUTAGGIO, IMPEGNO_PIENO, IMPEGNO_MINIMO, umoreInfo } from '../lib/umore'

const pct = (x) => `${Math.round(x * 100)}%`

// Legenda dell'umore, costruita dalle stesse soglie del calcolo: se si
// ritoccano in lib/umore.js, la spiegazione segue da sola.
export function UmoreLegenda() {
  const fasce = SOGLIE_MINUTAGGIO.map((s, i) => ({
    ...umoreInfo(s.livello),
    da: s.min,
    a: i === 0 ? null : SOGLIE_MINUTAGGIO[i - 1].min,
  }))
  const neutro = umoreInfo('neutro')
  return (
    <div className="card small" style={{ marginTop: 8 }}>
      <p style={{ margin: '0 0 8px' }}>
        <strong>Minutaggio</strong> = minuti giocati ÷ minuti disponibili, solo nelle partite
        con referto in cui era presente.
      </p>
      {fasce.map((f) => (
        <div className="row" key={f.value} style={{ gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '1.1rem', width: 24 }}>{f.emoji}</span>
          <span style={{ flex: 1 }}>{f.label}</span>
          <span className="muted">
            {f.a == null ? `da ${pct(f.da)}` : f.da === 0 ? `sotto ${pct(f.a)}` : `${pct(f.da)}–${pct(f.a)}`}
          </span>
        </div>
      ))}
      <p style={{ margin: '10px 0 6px' }}>
        <strong>Presenze</strong> = presenze ÷ appelli, allenamenti e partite insieme
        (i giustificati non contano). Pesano solo su chi gioca poco:
      </p>
      <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>
        <li>da {pct(IMPEGNO_PIENO)}: lo scontento resta intero</li>
        <li>{pct(IMPEGNO_MINIMO)}–{pct(IMPEGNO_PIENO)}: migliora di un gradino</li>
        <li>sotto {pct(IMPEGNO_MINIMO)}: resta {neutro.emoji} {neutro.label.toLowerCase()}, non si aspetta di giocare</li>
      </ul>
      <p className="muted" style={{ margin: '8px 0 0' }}>
        Scala: {LIVELLI_UMORE.map((l) => l.emoji).join(' ')}
      </p>
    </div>
  )
}

// Il "?" che apre e chiude la legenda: lo stato sta nel chiamante, che
// decide dove far comparire la legenda (sotto la riga, non dentro).
export function BottoneAiuto({ aperta, onClick }) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      aria-label="Come si calcola l'umore"
      aria-expanded={aperta}
      onClick={onClick}
      style={{ minWidth: 32 }}
    >
      ?
    </button>
  )
}
