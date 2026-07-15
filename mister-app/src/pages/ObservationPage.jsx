import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  CRITERI_OSSERVAZIONE, CONTESTI_OSSERVAZIONE, famigliaRuolo, isAttivo,
} from '../db/constants'
import EmptyState from '../components/EmptyState'

const oggi = () => new Date().toISOString().slice(0, 10)

function nomeCorto(p) {
  return p.soprannome || p.nome.split(' ')[0]
}

// Ultima osservazione per giocatore nella sessione (data + contesto)
function ultimePerGiocatore(observations) {
  const map = new Map()
  for (const o of observations) {
    map.set(o.playerId, o) // le successive sovrascrivono: id crescente = più recente
  }
  return map
}

export default function ObservationPage() {
  const navigate = useNavigate()
  const [vista, setVista] = useState('registra')
  const [contesto, setContesto] = useState('partitella')
  const [data, setData] = useState(oggi())
  const [selId, setSelId] = useState(null)
  const [voti, setVoti] = useState({})
  const [noteCriteri, setNoteCriteri] = useState({})
  const [notaAperta, setNotaAperta] = useState(null)
  const [notaGenerale, setNotaGenerale] = useState('')
  const [sortKey, setSortKey] = useState('media')

  const players = useLiveQuery(() => db.players.toArray(), [])
  const sessione = useLiveQuery(
    () =>
      db.observations
        .where('data')
        .equals(data)
        .filter((o) => o.contesto === contesto)
        .toArray(),
    [data, contesto]
  )

  if (!players || !sessione) return null

  const attivi = players.filter(isAttivo)
  const osservatiCount = new Map()
  for (const o of sessione) {
    osservatiCount.set(o.playerId, (osservatiCount.get(o.playerId) ?? 0) + 1)
  }

  const setVoto = (key, v) =>
    setVoti((prev) => ({ ...prev, [key]: prev[key] === v ? undefined : v }))

  const reset = () => {
    setSelId(null)
    setVoti({})
    setNoteCriteri({})
    setNotaAperta(null)
    setNotaGenerale('')
  }

  const salva = async () => {
    const votiPieni = Object.fromEntries(
      Object.entries(voti).filter(([, v]) => v !== undefined)
    )
    if (Object.keys(votiPieni).length === 0 && !notaGenerale.trim()) {
      alert('Dai almeno un voto o scrivi una nota')
      return
    }
    const notePiene = Object.fromEntries(
      Object.entries(noteCriteri).filter(([, t]) => t?.trim())
    )
    await db.observations.add({
      playerId: selId,
      data,
      contesto,
      voti: votiPieni,
      noteCriteri: notePiene,
      notaGenerale: notaGenerale.trim(),
    })
    reset()
  }

  const selezionato = selId ? players.find((p) => p.id === selId) : null

  // --- dati comparativa ---
  const ultime = ultimePerGiocatore(sessione)
  const righe = [...ultime.entries()]
    .map(([playerId, o]) => {
      const p = players.find((x) => x.id === playerId)
      if (!p) return null
      const valori = CRITERI_OSSERVAZIONE.map((c) => o.voti?.[c.key]).filter(Boolean)
      const media = valori.length
        ? valori.reduce((a, b) => a + b, 0) / valori.length
        : null
      return { p, o, media }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const va = sortKey === 'media' ? a.media : a.o.voti?.[sortKey]
      const vb = sortKey === 'media' ? b.media : b.o.voti?.[sortKey]
      return (vb ?? -1) - (va ?? -1)
    })

  return (
    <div className="page">
      <div className="page-header">
        <h1>Osservazione</h1>
        <button className="btn btn-sm" onClick={() => navigate('/intese/nuova')}>
          🔗 Intesa
        </button>
      </div>

      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="chip-row" style={{ flex: 1 }}>
          {CONTESTI_OSSERVAZIONE.map((c) => (
            <button
              key={c.value}
              className={`chip chip-sm ${contesto === c.value ? 'selected' : ''}`}
              onClick={() => setContesto(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          className="input"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{ width: 150, minHeight: 40 }}
        />
      </div>

      <div className="chip-row" style={{ marginBottom: 14 }}>
        <button
          className={`chip chip-sm ${vista === 'registra' ? 'selected' : ''}`}
          onClick={() => setVista('registra')}
        >
          ✏️ Registra
        </button>
        <button
          className={`chip chip-sm ${vista === 'confronta' ? 'selected' : ''}`}
          onClick={() => setVista('confronta')}
        >
          📊 Confronta ({ultime.size})
        </button>
      </div>

      {attivi.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nessun giocatore attivo"
          text="Aggiungi prima i giocatori alla rosa: poi potrai osservarli e votarli da bordo campo."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>
              Vai alla rosa
            </button>
          }
        />
      ) : vista === 'registra' ? (
        <>
          <div className="section-title">Chi stai osservando?</div>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {attivi.map((p) => (
              <button
                key={p.id}
                className={`chip chip-sm ${selId === p.id ? 'selected' : ''}`}
                onClick={() => setSelId(selId === p.id ? null : p.id)}
              >
                <span
                  className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                  style={{ marginRight: 6 }}
                />
                {nomeCorto(p)}
                {osservatiCount.get(p.id) ? ` ✓${osservatiCount.get(p.id)}` : ''}
              </button>
            ))}
          </div>

          {selezionato && (
            <>
              <div className="card">
                <strong style={{ display: 'block', marginBottom: 4 }}>
                  {selezionato.nome}
                  {selezionato.soprannome ? (
                    <span className="muted"> “{selezionato.soprannome}”</span>
                  ) : null}
                </strong>
                {CRITERI_OSSERVAZIONE.map((c) => (
                  <div key={c.key}>
                    <div className="crit-row">
                      <div className="crit-label">
                        {c.label}
                        {c.hint && <span className="hint">{c.hint}</span>}
                      </div>
                      <div className="vote-row">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            className={`vote-btn ${voti[c.key] === v ? 'on' : ''}`}
                            onClick={() => setVoto(c.key, v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <button
                        className={`note-btn ${noteCriteri[c.key]?.trim() || notaAperta === c.key ? 'on' : ''}`}
                        aria-label={`Nota su ${c.label}`}
                        onClick={() => setNotaAperta(notaAperta === c.key ? null : c.key)}
                      >
                        ✎
                      </button>
                    </div>
                    {notaAperta === c.key && (
                      <input
                        className="input"
                        style={{ marginBottom: 8 }}
                        value={noteCriteri[c.key] ?? ''}
                        onChange={(e) =>
                          setNoteCriteri((prev) => ({ ...prev, [c.key]: e.target.value }))
                        }
                        placeholder={`Nota su ${c.label.toLowerCase()}…`}
                        autoFocus
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="field">
                <label>Nota sintetica</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 64 }}
                  value={notaGenerale}
                  onChange={(e) => setNotaGenerale(e.target.value)}
                  placeholder="Impressione generale in una riga…"
                />
              </div>

              <div className="row">
                <button className="btn" onClick={reset}>Annulla</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={salva}>
                  Salva osservazione
                </button>
              </div>
            </>
          )}

          {!selezionato && sessione.length > 0 && (
            <p className="muted small">
              {sessione.length} osservazioni registrate in questa sessione. Passa a
              “Confronta” per la tabella comparativa.
            </p>
          )}
        </>
      ) : ultime.size === 0 ? (
        <EmptyState
          icon="📊"
          title="Nessuna osservazione in questa sessione"
          text="Registra i voti dei giocatori con questa data e contesto: qui li confronterai fianco a fianco."
        />
      ) : (
        <>
          <p className="muted small" style={{ marginTop: 0 }}>
            Tocca una colonna per ordinare. Per ogni giocatore vale l'ultima osservazione
            della sessione.
          </p>
          <div className="obs-table-wrap">
            <table className="obs-table">
              <thead>
                <tr>
                  <th>Giocatore</th>
                  <th
                    className={sortKey === 'media' ? 'sorted' : ''}
                    onClick={() => setSortKey('media')}
                  >
                    Media
                  </th>
                  {CRITERI_OSSERVAZIONE.map((c) => (
                    <th
                      key={c.key}
                      title={c.label}
                      className={sortKey === c.key ? 'sorted' : ''}
                      onClick={() => setSortKey(c.key)}
                    >
                      {c.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {righe.map(({ p, o, media }) => (
                  <tr key={p.id}>
                    <td>
                      <span
                        className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                        style={{ display: 'inline-block', marginRight: 6 }}
                      />
                      {nomeCorto(p)}
                    </td>
                    <td className={media ? `vote-cell-${Math.round(media)}` : ''}>
                      {media ? media.toFixed(1) : '—'}
                    </td>
                    {CRITERI_OSSERVAZIONE.map((c) => {
                      const v = o.voti?.[c.key]
                      return (
                        <td key={c.key} className={v ? `vote-cell-${v}` : ''}>
                          {v ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            Visti due che si cercano?{' '}
            <button
              className="btn btn-sm"
              style={{ marginLeft: 6 }}
              onClick={() => navigate('/intese/nuova')}
            >
              🔗 Crea intesa
            </button>
          </p>
        </>
      )}
    </div>
  )
}
