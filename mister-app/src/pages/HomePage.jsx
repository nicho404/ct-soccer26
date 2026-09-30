import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { campoPartitaInfo } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconBolt, IconBall } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import {
  prossimaPartita, formatDataPartita, quandoPartita, bilancio, esitoPartita, partiteGiocate, ESITO_INFO,
} from '../lib/partite'
import { presentiIds } from '../lib/presenze'
import { classifica, competizioneDefault } from '../lib/girone'

// Home: solo dati, niente consigli. Prossima partita, come sta andando la
// stagione e dove siamo in classifica — l'analisi del mister vive in Altro.

export default function HomePage() {
  const navigate = useNavigate()
  const players = useLiveQuery(() => db.players.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team'), [])
  const partite = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const capitano = useLiveQuery(() => db.meta.get('capitano').then((c) => c ?? null), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])
  const partiteGirone = useLiveQuery(() => db.partiteGirone.toArray(), [])

  if (!players || !partite || !opponents || capitano === undefined || !competitions || !partiteGirone) return null

  const nomeAvversario = (m) => opponents.find((o) => o.id === m.opponentId)?.nome
  const prossima = prossimaPartita(partite)
  const avversario = prossima ? nomeAvversario(prossima) : null

  const b = bilancio(partite)
  const ultime = partiteGiocate(partite).filter(esitoPartita).slice(0, 5)

  const dati = { partiteGirone, matches: partite, opponents, competitions, nomeNostro: team?.nome ?? '' }
  const compId = competizioneDefault(competitions, dati)
  const noi = compId != null ? classifica(compId, dati).righe.find((r) => r.nostra) : null
  const squadreGirone = compId != null ? classifica(compId, dati).righe.length : 0
  const competizione = competitions.find((c) => c.id === compId)

  const hasTeam = team && (team.nome || team.torneo || team.logo)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Home</h1>
      </div>

      {hasTeam && (
        <div className="team-banner">
          <span className="team-banner-logo">
            {team.logo ? <img src={team.logo} alt="" /> : <IconBall size={26} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{team.nome || 'La tua squadra'}</strong>
            <div className="muted small">
              {[
                team.torneo,
                team.mister ? `Mister ${team.mister}` : '',
                capitano?.value != null && players.some((p) => p.id === capitano.value)
                  ? `Capitano ${nomeBreve(players.find((p) => p.id === capitano.value))}`
                  : '',
              ].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <EmptyState
          icon={<IconBolt />}
          title="Benvenuto, mister"
          text="Parti dalla rosa: inserisci i tuoi giocatori, poi arriveranno osservazioni, formazioni e partite."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>
              + Aggiungi il primo giocatore
            </button>
          }
        />
      ) : (
        <>
          <div className="section-title">Prossima partita</div>
          {prossima ? (
            <Link to={`/partite/${prossima.id}`} className="card tappable">
              <div className="row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{avversario || 'Avversario da definire'}</strong>
                  <div className="muted small">
                    {[
                      formatDataPartita(prossima.data),
                      prossima.ora,
                      campoPartitaInfo(prossima.campo).label,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span className="badge badge-accent">{quandoPartita(prossima.data)}</span>
              </div>
              <div className="muted small" style={{ marginTop: 6, opacity: 0.75 }}>
                {[
                  prossima.luogo,
                  `${presentiIds(prossima).length} presenti`,
                ].filter(Boolean).join(' · ')}
              </div>
            </Link>
          ) : (
            <div className="card">
              <div className="muted small">Nessuna partita in calendario.</div>
              <button
                className="btn btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => navigate('/partite/nuova')}
              >
                + Metti in calendario
              </button>
            </div>
          )}

          {noi && (
            <>
              <div className="section-title">Classifica</div>
              <Link to="/girone" className="card tappable">
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{noi.pos}° posto</strong>
                    <span className="muted small"> su {squadreGirone}</span>
                    <div className="muted small">
                      {[
                        competizione?.nome,
                        `${noi.g} giocate`,
                        `DR ${noi.dr > 0 ? '+' : ''}${noi.dr}`,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className="badge badge-accent">{noi.pt} pt</span>
                </div>
              </Link>
            </>
          )}

          {b.giocate > 0 && (
            <>
              <div className="section-title">Bilancio ({b.giocate} partite)</div>
              <div className="stat-grid">
                <div className="stat-tile">
                  <div className="value" style={{ color: 'var(--ok)' }}>{b.vinte}</div>
                  <div className="label">Vinte</div>
                </div>
                <div className="stat-tile">
                  <div className="value" style={{ color: 'var(--warn)' }}>{b.pari}</div>
                  <div className="label">Pareggiate</div>
                </div>
                <div className="stat-tile">
                  <div className="value" style={{ color: 'var(--danger)' }}>{b.perse}</div>
                  <div className="label">Perse</div>
                </div>
              </div>
              <div className="card">
                <div className="row">
                  <span className="muted small" style={{ flex: 1 }}>
                    Gol fatti {b.golFatti} · subiti {b.golSubiti}
                  </span>
                  <span className="chip-row" style={{ gap: 4 }} aria-label="Ultime partite">
                    {ultime.map((m) => {
                      const e = esitoPartita(m)
                      return (
                        <Link
                          key={m.id}
                          to={`/partite/${m.id}`}
                          className={`badge ${ESITO_INFO[e].badge}`}
                          title={`${nomeAvversario(m) ?? ''} ${m.golFatti}-${m.golSubiti}`}
                        >
                          {e}
                        </Link>
                      )
                    })}
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
