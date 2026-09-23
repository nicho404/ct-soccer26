import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { IconGrid } from '../components/icons'
import {
  NOI, gare, conRisultato, classifica, statoGiornate, marcatori, cartellini, nomeSquadra,
} from '../lib/girone'
import { formatDataPartita, perDataCrescente } from '../lib/partite'

const TABS = [
  { value: 'classifica', label: 'Classifica' },
  { value: 'risultati', label: 'Risultati' },
  { value: 'marcatori', label: 'Marcatori' },
  { value: 'cartellini', label: 'Cartellini' },
]

// Senza scelta esplicita: la competizione con più gare inserite, a parità la più recente.
function competizioneDefault(competitions, dati) {
  const tutte = gare(dati)
  const quante = (c) => tutte.filter((g) => g.competitionId === c.id).length
  return [...competitions].sort((a, b) => quante(b) - quante(a) || b.id - a.id)[0].id
}

function TabClassifica({ compId, dati, competizione }) {
  const { righe, pariNonRisolta } = classifica(compId, dati)
  const incomplete = statoGiornate(compId, dati).filter((g) => g.incompleta)
  const penalita = competizione?.penalita ?? []

  if (righe.length === 0) {
    return <p className="muted small">Nessuna partita in questa competizione: inserisci i risultati dal tab Risultati.</p>
  }

  return (
    <>
      {incomplete.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {incomplete.map((g) => (
            <span key={g.giornata} className="badge badge-warn" title="Partite inserite su quelle attese">
              G{g.giornata} incompleta · {g.inserite}/{g.attese}
            </span>
          ))}
        </div>
      )}

      <div className="obs-table-wrap">
        <table className="obs-table">
          <thead>
            <tr>
              <th>Squadra</th>
              <th title="Punti">PT</th>
              <th title="Giocate">G</th>
              <th title="Vinte">V</th>
              <th title="Pareggiate">N</th>
              <th title="Perse">P</th>
              <th title="Gol fatti">F</th>
              <th title="Gol subiti">S</th>
              <th title="Differenza reti">DR</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.squadraId} className={r.nostra ? 'riga-nostra' : undefined}>
                <td>
                  {r.pos}. {r.nome}
                  {r.pariNonRisolta && <span title="Parità non risolta"> =</span>}
                </td>
                <td><strong>{r.pt}</strong>{r.penalita > 0 && '*'}</td>
                <td>{r.g}</td>
                <td>{r.v}</td>
                <td>{r.n}</td>
                <td>{r.p}</td>
                <td>{r.f}</td>
                <td>{r.s}</td>
                <td>{r.dr > 0 ? `+${r.dr}` : r.dr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {penalita.length > 0 && (
        <p className="muted small">
          * Penalità:{' '}
          {penalita.map((p) => `${nomeSquadra(p.squadraId, dati)} −${Math.abs(p.punti)}${p.motivo ? ` (${p.motivo})` : ''}`).join(' · ')}
        </p>
      )}

      {pariNonRisolta && (
        <div className="alert-card" style={{ marginTop: 10 }}>
          Parità non risolta (=): scontri diretti, differenza reti e gol non bastano.
          Decidono ranking e sorteggio, che l'app non conosce.
        </div>
      )}

      <p className="muted small">
        A pari punti: scontri diretti, poi differenza reti, gol fatti e gol subiti.
      </p>
    </>
  )
}

function TabRisultati({ compId, dati }) {
  const navigate = useNavigate()
  const lista = gare(dati).filter((g) => g.competitionId === compId)
  const giornate = [...new Set(lista.map((g) => g.giornata))]
    .sort((a, b) => (a ?? Infinity) - (b ?? Infinity))
  const prossima = Math.max(0, ...lista.map((g) => g.giornata ?? 0)) + 1
  const nome = (id) => nomeSquadra(id, dati)

  return (
    <>
      <button
        className="btn btn-primary btn-block"
        onClick={() => navigate(`/girone/nuova?c=${compId}&g=${prossima}`)}
      >
        + Risultato tra altre squadre
      </button>
      <p className="muted small" style={{ margin: '6px 0 0' }}>
        Le nostre partite si inseriscono da Partite, con la stessa competizione e la giornata.
      </p>

      {giornate.map((giornata) => (
        <div key={giornata ?? 'senza'}>
          <div className="section-title">{giornata == null ? 'Senza giornata' : `Giornata ${giornata}`}</div>
          {lista
            .filter((g) => g.giornata === giornata)
            .sort(perDataCrescente)
            .map((g) => {
              const nostra = g.fonte === 'match'
              return (
                <Link
                  key={`${g.fonte}-${g.id}`}
                  to={nostra ? `/partite/${g.id}` : `/girone/${g.id}`}
                  className="card tappable"
                >
                  <div className="row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="small">
                        <span className={g.casaId === NOI ? 'nostra' : undefined}>{nome(g.casaId)}</span>
                        {' – '}
                        <span className={g.ospiteId === NOI ? 'nostra' : undefined}>{nome(g.ospiteId)}</span>
                      </div>
                      {(g.data || g.ora) && (
                        <div className="muted small">
                          {[g.data && formatDataPartita(g.data), g.ora].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    {conRisultato(g) ? (
                      <span className={`badge ${nostra ? 'badge-accent' : ''}`}>{g.golCasa}-{g.golOspite}</span>
                    ) : (
                      <span className="badge">da giocare</span>
                    )}
                  </div>
                </Link>
              )
            })}
        </div>
      ))}
    </>
  )
}

function TabMarcatori({ compId, dati, tutte, setTutte }) {
  const lista = marcatori(compId, dati, { tutteLeCompetizioni: tutte })
  return (
    <>
      <div className="chip-row" style={{ marginBottom: 10 }}>
        <button className={`chip chip-sm ${!tutte ? 'selected' : ''}`} onClick={() => setTutte(false)}>
          Questa competizione
        </button>
        <button className={`chip chip-sm ${tutte ? 'selected' : ''}`} onClick={() => setTutte(true)}>
          Tutte le competizioni
        </button>
      </div>
      {lista.length === 0 ? (
        <p className="muted small">Nessun marcatore avversario inserito.</p>
      ) : (
        <div className="obs-table-wrap">
          <table className="obs-table">
            <thead>
              <tr><th>Giocatore</th><th>Squadra</th><th title="Gol">G</th></tr>
            </thead>
            <tbody>
              {lista.map((r) => (
                <tr key={r.giocatoreId}>
                  <td>{r.nome}</td>
                  <td className="muted">{r.squadra}</td>
                  <td><strong>{r.gol}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function TabCartellini({ compId, dati }) {
  // I cartellini si sommano su tutte le competizioni; qui si mostrano le
  // squadre di questo girone.
  const squadre = new Set(
    gare(dati).filter((g) => g.competitionId === compId).flatMap((g) => [g.casaId, g.ospiteId])
  )
  const lista = cartellini(dati).filter((r) => squadre.has(r.squadraId))
  const squalificati = lista.filter((r) => r.daScontare)
  const diffidati = lista.filter((r) => r.diffidato)

  if (lista.length === 0) {
    return <p className="muted small">Nessun cartellino avversario inserito.</p>
  }

  return (
    <>
      <div className="section-title">Squalificati da scontare ({squalificati.length})</div>
      {squalificati.length === 0 && <p className="muted small">Nessuno.</p>}
      {squalificati.map((r) => (
        <div className="alert-card danger" key={r.giocatoreId}>
          <div style={{ flex: 1 }}>
            <strong>{r.nome}</strong> <span className="muted">· {r.squadra}</span>
            <div className="muted small">
              {r.squalifica.motivo}
              {r.squalifica.data && ` il ${formatDataPartita(r.squalifica.data)}`}
            </div>
          </div>
        </div>
      ))}

      <div className="section-title">Diffidati ({diffidati.length})</div>
      {diffidati.length === 0 && <p className="muted small">Nessuno.</p>}
      {diffidati.map((r) => (
        <div className="alert-card" key={r.giocatoreId}>
          <div style={{ flex: 1 }}>
            <strong>{r.nome}</strong> <span className="muted">· {r.squadra}</span>
            <div className="muted small">{r.gialli} gialli: al prossimo salta una partita</div>
          </div>
        </div>
      ))}

      <div className="section-title">Tutti i cartellini</div>
      <div className="obs-table-wrap">
        <table className="obs-table">
          <thead>
            <tr><th>Giocatore</th><th>Squadra</th><th title="Gialli">🟨</th><th title="Rossi">🟥</th></tr>
          </thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.giocatoreId}>
                <td>{r.nome}</td>
                <td className="muted">{r.squadra}</td>
                <td>{r.gialli || ''}</td>
                <td>{r.rossi || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Squalifica con rosso, due gialli nella stessa gara, 4° giallo e ogni multiplo di 4.
        Diffidato chi è a un giallo dalla squalifica.
      </p>
    </>
  )
}

export default function GironePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const partiteGirone = useLiveQuery(() => db.partiteGirone.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const giocatoriAvversari = useLiveQuery(() => db.giocatoriAvversari.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])

  if (!competitions || !opponents || !partiteGirone || !matches || !giocatoriAvversari || team === undefined) {
    return null
  }

  const header = (
    <div className="page-header">
      <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
      <h1>Girone</h1>
    </div>
  )

  if (competitions.length === 0) {
    return (
      <div className="page">
        {header}
        <EmptyState
          icon={<IconGrid />}
          title="Nessuna competizione"
          text="Crea la competizione da una partita (Partite → Nuova partita → Competizione), poi torna qui per i risultati del girone."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/partite/nuova')}>
              + Nuova partita
            </button>
          }
        />
      </div>
    )
  }

  const dati = {
    partiteGirone, matches, opponents, giocatoriAvversari, competitions,
    nomeNostro: team?.nome ?? '',
  }
  const richiesta = Number(params.get('c'))
  const compId = competitions.some((c) => c.id === richiesta)
    ? richiesta
    : competizioneDefault(competitions, dati)
  const competizione = competitions.find((c) => c.id === compId)
  const tab = TABS.some((t) => t.value === params.get('t')) ? params.get('t') : 'classifica'
  const tutte = params.get('tutte') === '1'

  const imposta = (patch) =>
    setParams((p) => {
      const n = new URLSearchParams(p)
      for (const [k, v] of Object.entries(patch)) {
        if (v == null) n.delete(k)
        else n.set(k, v)
      }
      return n
    }, { replace: true })

  return (
    <div className="page">
      {header}

      <div className="field">
        <select
          className="select"
          aria-label="Competizione"
          value={compId}
          onChange={(e) => imposta({ c: e.target.value })}
        >
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`chip chip-sm ${tab === t.value ? 'selected' : ''}`}
            onClick={() => imposta({ t: t.value })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'classifica' && <TabClassifica compId={compId} dati={dati} competizione={competizione} />}
      {tab === 'risultati' && <TabRisultati compId={compId} dati={dati} />}
      {tab === 'marcatori' && (
        <TabMarcatori
          compId={compId}
          dati={dati}
          tutte={tutte}
          setTutte={(v) => imposta({ tutte: v ? '1' : null })}
        />
      )}
      {tab === 'cartellini' && <TabCartellini compId={compId} dati={dati} />}
    </div>
  )
}
