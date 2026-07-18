import { IconLinkBroken } from './icons'

// Selettore stile FC26: frecce ‹ › per scorrere le opzioni.
// showDesc mostra la descrizione dell'opzione corrente (es. solo per l'ultima
// riga toccata, così il pannello resta compatto); warning mostra la catena
// spezzata quando la scelta è in contrasto con un'altra impostazione.
export default function ArrowSelect({ label, value, options, onChange, warning, showDesc = true }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  const cur = options[idx]
  const move = (d) => onChange(options[(idx + d + options.length) % options.length].value)

  return (
    <div className="arrow-select">
      <div className="arrow-select-top">
        <span className="arrow-select-label">{label}</span>
        <div className="arrow-select-ctrl">
          <button className="arrow-btn" aria-label={`${label}: opzione precedente`} onClick={() => move(-1)}>
            ‹
          </button>
          <span className="arrow-select-value">
            {warning && <span className="chain-broken" title={warning}><IconLinkBroken size={14} /></span>}
            {cur?.icona ? `${cur.icona} ` : ''}{cur?.label ?? '—'}
          </span>
          <button className="arrow-btn" aria-label={`${label}: opzione successiva`} onClick={() => move(1)}>
            ›
          </button>
        </div>
      </div>
      {showDesc && cur?.descrizione && <p className="arrow-select-desc">{cur.descrizione}</p>}
      {warning && (
        <p className="arrow-select-warn">
          <IconLinkBroken size={13} /> {warning}
        </p>
      )}
    </div>
  )
}
