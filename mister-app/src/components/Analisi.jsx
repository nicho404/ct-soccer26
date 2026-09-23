import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { tipoPuntoInfo, alternaObiettivo, avanzamentoObiettivi, intestazioneAnalisi } from '../lib/analisi'

export function PuntiChiave({ punti }) {
  return (
    <ul className="analisi-punti">
      {punti.map((p, i) => {
        const info = tipoPuntoInfo(p.tipo)
        return (
          <li key={i} className={`analisi-punto analisi-${info.value}`}>
            <span aria-label={info.label} title={info.label}>{info.icona}</span>
            <span>{p.testo}</span>
          </li>
        )
      })}
    </ul>
  )
}

// Gli obiettivi si spuntano da qui, in Home come nel dettaglio: la
// modifica va dritta nel db, così resta anche dopo aver chiuso l'app.
export function Obiettivi({ analisi, limite }) {
  const alterna = (indice) =>
    db.analisi.update(analisi.id, { obiettivi: alternaObiettivo(analisi.obiettivi, indice) })
  const voci = analisi.obiettivi.map((o, indice) => ({ ...o, indice }))
  // in Home prima quelli ancora da fare
  const mostrati = limite
    ? [...voci.filter((o) => !o.fatto), ...voci.filter((o) => o.fatto)].slice(0, limite)
    : voci

  return (
    <div className="analisi-obiettivi">
      {mostrati.map((o) => (
        <button
          key={o.indice}
          className={`analisi-obiettivo ${o.fatto ? 'fatto' : ''}`}
          role="checkbox"
          aria-checked={o.fatto}
          onClick={() => alterna(o.indice)}
        >
          <span className="analisi-check" aria-hidden="true">{o.fatto ? '✓' : ''}</span>
          <span>{o.testo}</span>
        </button>
      ))}
    </div>
  )
}

// La card della Home: la tesi, i punti chiave più importanti e gli
// obiettivi aperti. Il resto sta nel dettaglio.
export function AnalisiInEvidenza({ analisi }) {
  const { fatti, totale } = avanzamentoObiettivi(analisi)
  return (
    <div className="card analisi-card">
      <div className="muted small">{intestazioneAnalisi(analisi)}</div>
      <strong className="analisi-titolo">{analisi.titolo || 'Analisi'}</strong>
      {analisi.sintesi && <p className="analisi-sintesi">{analisi.sintesi}</p>}

      {analisi.puntiChiave.length > 0 && <PuntiChiave punti={analisi.puntiChiave.slice(0, 4)} />}

      {totale > 0 && (
        <>
          <div className="analisi-sottotitolo">
            Obiettivi <span className="muted">{fatti}/{totale}</span>
          </div>
          <Obiettivi analisi={analisi} limite={4} />
        </>
      )}

      <Link to={`/analisi/${analisi.id}`} className="btn btn-sm" style={{ marginTop: 10 }}>
        Analisi completa ›
      </Link>
    </div>
  )
}
