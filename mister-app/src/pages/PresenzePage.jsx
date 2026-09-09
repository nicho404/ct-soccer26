import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { isAttivo } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconClipboardCheck } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import { formatDataPartita } from '../lib/partite'
import {
  contaSeduta, pctSeduta, aggregaPresenze, meritocrazia, LIVELLI_MERITOCRAZIA,
} from '../lib/presenze'

// Ordine di lettura: la seduta più recente per prima, come lo storico partite.
const perDataDecrescente = (a, b) =>
  `${b.data ?? ''} ${b.ora ?? ''}`.localeCompare(`${a.data ?? ''} ${a.ora ?? ''}`)

export default function PresenzePage() {
  const navigate = useNavigate()
  const trainings = useLiveQuery(() => db.trainings.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const piani = useLiveQuery(() => db.sessionPlans.toArray(), [])

  if (!trainings || !players || !matches || !piani) return null

  const sedute = [...trainings].sort(perDataDecrescente)
  const righe = aggregaPresenze(trainings)
  const confronto = meritocrazia({ trainings, matches })
  const modelli = piani.filter((p) => p.isTemplate)

  const nomeDi = (pid) => nomeBreve(players.find((p) => p.id === pid))

  // Media delle percentuali di squadra: risponde a "quanti si presentano",
  // non a "quanti allenamenti ho fatto".
  const pctSedute = sedute.map(pctSeduta).filter((x) => x !== null)
  const mediaSquadra = pctSedute.length === 0
    ? null
    : Math.round(pctSedute.reduce((a, b) => a + b, 0) / pctSedute.length)

  const daSegnalare = confronto.filter((r) => r.livello === 'premiato' || r.livello === 'penalizzato')

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Presenze</h1>
        <span className="muted small">{sedute.length}</span>
      </div>

      {sedute.length === 0 ? (
        <EmptyState
          icon={<IconClipboardCheck />}
          title="Nessuna seduta registrata"
          text="Fai l'appello a ogni allenamento: in poche settimane sai chi c'è sempre e chi solo la domenica."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/presenze/nuova')}>
              + Prima seduta
            </button>
          }
        />
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="value">{sedute.length}</div>
              <div className="label">Sedute</div>
            </div>
            <div className="stat-tile">
              <div className="value">{mediaSquadra === null ? '—' : `${mediaSquadra}%`}</div>
              <div className="label">Media presenze</div>
            </div>
            <div className="stat-tile">
              <div className="value">{players.filter(isAttivo).length}</div>
              <div className="label">Rosa attiva</div>
            </div>
          </div>

          {daSegnalare.length > 0 && (
            <>
              <div className="section-title">Campo e allenamento</div>
              {daSegnalare.map((r) => {
                const info = LIVELLI_MERITOCRAZIA[r.livello]
                return (
                  <Link to={`/rosa/${r.playerId}`} className="card tappable" key={r.playerId}>
                    <div className="row">
                      <strong className="small" style={{ flex: 1 }}>{nomeDi(r.playerId)}</strong>
                      <span className={`badge ${info.badge}`}>{info.label}</span>
                    </div>
                    <div className="muted small" style={{ marginTop: 6 }}>
                      {r.pct}% agli allenamenti · {r.pctMinuti}% dei minuti del più impiegato
                    </div>
                  </Link>
                )
              })}
              <p className="muted small">
                Il minutaggio è rapportato a chi ha giocato di più: nel calcio amatoriale
                è l'unico metro che regge ai tornei saltati.
              </p>
            </>
          )}

          {righe.length > 0 && (
            <>
              <div className="section-title">Rendimento appello</div>
              <div className="obs-table-wrap">
                <table className="obs-table">
                  <thead>
                    <tr>
                      <th>Giocatore</th>
                      <th title="Sedute all'appello">SED</th>
                      <th title="Presente">P</th>
                      <th title="Assente">A</th>
                      <th title="Assente giustificato">G</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {righe.map((r) => (
                      <tr key={r.playerId}>
                        <td>{nomeDi(r.playerId)}</td>
                        <td>{r.sedute}</td>
                        <td>{r.presenti}</td>
                        <td>{r.assenti || ''}</td>
                        <td>{r.giustificati || ''}</td>
                        <td>{r.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="section-title">Sedute</div>
          {sedute.map((t) => {
            const c = contaSeduta(t)
            const pct = pctSeduta(t)
            return (
              <Link to={`/presenze/${t.id}`} className="card tappable" key={t.id}>
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{t.tema || 'Allenamento'}</strong>
                    <div className="muted small">
                      {[formatDataPartita(t.data), t.ora].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className={`badge ${pct === null ? 'badge-warn' : ''}`}>
                    {pct === null ? 'Appello vuoto' : `${c.presenti}/${c.totale}`}
                  </span>
                </div>
              </Link>
            )
          })}

          <Link to="/presenze/piani" className="card tappable">
            <div className="row">
              <div style={{ flex: 1 }}>
                <strong>Modelli di seduta</strong>
                <div className="muted small">Riusa un allenamento già pronto</div>
              </div>
              <span className="badge">{modelli.length}</span>
            </div>
          </Link>

          <button className="fab" aria-label="Nuova seduta" onClick={() => navigate('/presenze/nuova')}>
            +
          </button>
        </>
      )}
    </div>
  )
}
