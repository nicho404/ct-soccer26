import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { IconChart } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import { partiteGiocate, esitoPartita, ESITO_INFO, formatDataPartita, bilancio } from '../lib/partite'
import { aggregaGiocatori, classificaMarcatori, refertoCompilato } from '../lib/storico'

export default function StoricoPage() {
  const navigate = useNavigate()
  const partite = useLiveQuery(() => db.matches.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])

  if (!partite || !players || !opponents) return null

  const giocate = partiteGiocate(partite)
  const conReferto = giocate.filter(refertoCompilato)
  const righe = aggregaGiocatori(giocate)
  const marcatori = classificaMarcatori(giocate)
  const b = bilancio(giocate)

  const nomeDi = (pid) => nomeBreve(players.find((p) => p.id === pid))
  const nomeAvversario = (oid) => opponents.find((o) => o.id === oid)?.nome ?? 'Avversario'

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Storico</h1>
        <span className="muted small">{conReferto.length}/{giocate.length}</span>
      </div>

      {giocate.length === 0 ? (
        <EmptyState
          icon={<IconChart />}
          title="Ancora nessuna partita giocata"
          text="Dopo la prima partita, qui trovi chi ha giocato, quanto, e chi ha fatto la differenza."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/partite')}>
              Vai alle partite
            </button>
          }
        />
      ) : (
        <>
          <div className="stat-grid compatto">
            <div className="stat-tile">
              <div className="value">{b.vinte}-{b.pari}-{b.perse}</div>
              <div className="label">V-N-P</div>
            </div>
            <div className="stat-tile">
              <div className="value">{b.golFatti}:{b.golSubiti}</div>
              <div className="label">Gol</div>
            </div>
            <div className="stat-tile">
              <div className="value">{conReferto.length}/{giocate.length}</div>
              <div className="label">Referti</div>
            </div>
          </div>

          {conReferto.length === 0 && (
            <div className="alert-card">
              <span>📋</span>
              <span>
                Nessun referto compilato: minuti, marcatori e assist restano vuoti finché
                non racconti almeno una partita.
              </span>
            </div>
          )}

          {marcatori.length > 0 && (
            <>
              <div className="section-title">Marcatori</div>
              <div className="card referto-cronologia">
                {marcatori.map((r, i) => (
                  <Link to={`/rosa/${r.playerId}`} className="evento-riga" key={r.playerId} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <span className="evento-minuto">{i + 1}</span>
                    <strong className="evento-testo">{nomeDi(r.playerId)}</strong>
                    {r.gol > 0 && <span className="badge badge-ok">⚽ {r.gol}</span>}
                    {r.assist > 0 && <span className="badge badge-accent">🅰️ {r.assist}</span>}
                  </Link>
                ))}
              </div>
            </>
          )}

          {righe.length > 0 && (
            <>
              <div className="section-title">Minutaggio</div>
              <div className="obs-table-wrap">
                <table className="obs-table">
                  <thead>
                    <tr>
                      <th>Giocatore</th>
                      <th title="Partite giocate">PG</th>
                      <th title="Da titolare">TIT</th>
                      <th title="Minuti giocati">MIN</th>
                      <th title="Gol">G</th>
                      <th title="Assist">A</th>
                      <th title="Ammonizioni ed espulsioni">🟨🟥</th>
                    </tr>
                  </thead>
                  <tbody>
                    {righe.map((r) => (
                      <tr key={r.playerId}>
                        <td>{nomeDi(r.playerId)}</td>
                        <td>{r.presenze}</td>
                        <td>{r.titolarita}</td>
                        <td>{r.minuti}′</td>
                        <td>{r.gol || ''}</td>
                        <td>{r.assist || ''}</td>
                        <td>{[r.gialli || '', r.rossi ? `+${r.rossi}🟥` : ''].join(' ').trim()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="section-title">Referti</div>
          {giocate.map((m) => {
            const esito = esitoPartita(m)
            const compilato = refertoCompilato(m)
            return (
              <Link to={`/partite/${m.id}/referto`} className="card tappable partita-riga" key={m.id}>
                <span className="partita-riga-esito">
                  {esito
                    ? <span className={`badge ${ESITO_INFO[esito].badge}`}>{m.golFatti}-{m.golSubiti}</span>
                    : <span className="badge badge-warn">?</span>}
                </span>
                <span className="partita-riga-testo">
                  <strong>{nomeAvversario(m.opponentId)}</strong>
                  <span className="muted small">{formatDataPartita(m.data)}</span>
                </span>
                {!compilato && <span className="badge badge-warn">Da compilare</span>}
              </Link>
            )
          })}
        </>
      )}
    </div>
  )
}
