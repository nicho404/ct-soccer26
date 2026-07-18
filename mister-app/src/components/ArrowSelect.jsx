// Selettore stile FC26: frecce ‹ › per scorrere le opzioni,
// descrizione dell'opzione corrente sempre visibile sotto.
export default function ArrowSelect({ label, value, options, onChange }) {
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
            {cur?.icona ? `${cur.icona} ` : ''}{cur?.label ?? '—'}
          </span>
          <button className="arrow-btn" aria-label={`${label}: opzione successiva`} onClick={() => move(1)}>
            ›
          </button>
        </div>
      </div>
      {cur?.descrizione && <p className="arrow-select-desc">{cur.descrizione}</p>}
    </div>
  )
}
