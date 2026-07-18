import { IconLinkBroken } from './icons'

// Selettore stile FC26: frecce ‹ › per scorrere le opzioni.
// compact: etichetta sopra il valore e niente descrizione inline (la mostra
// il pannello che lo contiene); warning: catena spezzata per scelte in
// contrasto con un'altra impostazione.
export default function ArrowSelect({ label, value, options, onChange, warning, compact = false }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  const cur = options[idx]
  const move = (d) => onChange(options[(idx + d + options.length) % options.length].value)

  const controls = (
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
  )

  if (compact) {
    return (
      <div className="arrow-select arrow-select-compact">
        <span className="arrow-select-label">{label}</span>
        {controls}
      </div>
    )
  }

  return (
    <div className="arrow-select">
      <div className="arrow-select-top">
        <span className="arrow-select-label">{label}</span>
        {controls}
      </div>
      {cur?.descrizione && <p className="arrow-select-desc">{cur.descrizione}</p>}
      {warning && (
        <p className="arrow-select-warn">
          <IconLinkBroken size={13} /> {warning}
        </p>
      )}
    </div>
  )
}
