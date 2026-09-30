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
import { refertoCompilato } from '../lib/storico'
import { FASCE } from '../lib/fascia'

// Home: solo dati, niente consigli. In ordine di urgenza: la prossima
// partita, l'ultima giocata, poi la stagione in quattro numeri e la forma.
// L'analisi del mister vive in Altro.
export default function HomePage() {
  const navigate = useNavigate()
  const players = useLiveQuery(() => db.players.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team'), [])
  const partite = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const capitano = useLiveQuery(() => db.meta.get('capitano').then((c) => c ?? null), [])
  const vice = useLiveQuery(() => db.meta.get('vice').then((c) => c ?? null), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])
  const partiteGirone = useLiveQuery(() => db.partiteGirone.toArray(), [])

  if (!players || !partite || !opponents || capitano === undefined || vice === undefined || !competitions || !partiteGirone) return null

  const nomeAvversario = (m) => opponents.find((o) => o.id === m.opponentId)?.nome
  const prossima = prossimaPartita(partite)
  const giocate = partiteGiocate(partite).filter(esitoPartita)
  const ultima = giocate[0] ?? null
  const b = bilancio(partite)
  // forma: dalla più vecchia alla più recente, così si legge da sinistra a destra
  const forma = giocate.slice(0, 5).reverse()

  const dati = { partiteGirone, matches: partite, opponents, competitions, nomeNostro: team?.nome ?? '' }
  const compId = competizioneDefault(competitions, dati)
  const righe = compId != null ? classifica(compId, dati).righe : []
  const noi = righe.find((r) => r.nostra) ?? null
  const rigaAvversario = (m) => righe.find((r) => r.squadraId === m?.opponentId) ?? null

  const hasTeam = team && (team.nome || team.torneo || team.logo)
  const fasce = [
    { tipo: 'capitano', id: capitano?.value },
    { tipo: 'vice', id: vice?.value },
  ]
    .map((f) => ({ ...f, p: players.find((p) => p.id === f.id) }))
    .filter((f) => f.p)

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
              {[team.torneo, team.mister ? `Mister ${team.mister}` : ''].filter(Boolean).join(' · ')}
            </div>
            {fasce.length > 0 && (
              <div className="row" style={{ gap: 10, marginTop: 4 }}>
                {fasce.map((f) => (
                  <span key={f.tipo} className="small">
                    <span className={`rosa-fascia ${FASCE[f.tipo].className}`} style={{ marginLeft: 0 }}>
                      {FASCE[f.tipo].sigla}
                    </span>{' '}
                    {nomeBreve(f.p)}
                  </span>
                ))}
              </div>
            )}
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
                  <strong>{nomeAvversario(prossima) || 'Avversario da definire'}</strong>
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
              <div className="muted small" style={{ marginTop: 6 }}>
                {[
                  rigaAvversario(prossima)
                    ? `Loro: ${rigaAvversario(prossima).pos}° · ${rigaAvversario(prossima).pt} pt`
                    : '',
                  `${presentiIds(prossima).length} presenti`,
                  prossima.luogo,
                ].filter(Boolean).join(' · ')}
              </div>
            </Link>
          ) : (
            <div className="card row">
              <span className="muted small" style={{ flex: 1 }}>Nessuna partita in calendario.</span>
              <button className="btn btn-sm" onClick={() => navigate('/partite/nuova')}>
                + Aggiungi
              </button>
            </div>
          )}

          {ultima && (
            <>
              <div className="section-title">Ultima partita</div>
              <Link to={`/partite/${ultima.id}`} className="card tappable">
                <div className="row">
                  <span className={`badge risultato-grande ${ESITO_INFO[esitoPartita(ultima)].badge}`}>
                    {ultima.golFatti}-{ultima.golSubiti}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{nomeAvversario(ultima) || 'Avversario da definire'}</strong>
                    <div className="muted small">
                      {[
                        formatDataPartita(ultima.data),
                        ESITO_INFO[esitoPartita(ultima)].label,
                      ].join(' · ')}
                    </div>
                  </div>
                  {!refertoCompilato(ultima) && <span className="badge badge-warn">Referto da fare</span>}
                </div>
              </Link>
            </>
          )}

          {b.giocate > 0 && (
            <>
              <div className="section-title">Stagione</div>
              <div className="stagione-grid">
                <Link to="/girone" className="stat-tile">
                  <div className="value">{noi ? `${noi.pos}°` : '—'}</div>
                  <div className="label">{noi ? `su ${righe.length}` : 'Classifica'}</div>
                </Link>
                <Link to="/girone" className="stat-tile">
                  <div className="value">{noi ? noi.pt : '—'}</div>
                  <div className="label">Punti</div>
                </Link>
                <div className="stat-tile">
                  <div className="value" style={{ fontSize: '1.05rem' }}>
                    <span style={{ color: 'var(--ok)' }}>{b.vinte}</span>
                    <span className="muted">-</span>
                    <span style={{ color: 'var(--warn)' }}>{b.pari}</span>
                    <span className="muted">-</span>
                    <span style={{ color: 'var(--danger)' }}>{b.perse}</span>
                  </div>
                  <div className="label">V-N-P</div>
                </div>
                <div className="stat-tile">
                  <div className="value" style={{ fontSize: '1.05rem' }}>{b.golFatti}:{b.golSubiti}</div>
                  <div className="label">Gol</div>
                </div>
              </div>
              <div className="card row">
                <span className="muted small" style={{ flex: 1 }}>
                  Forma · ultime {forma.length}
                </span>
                <span className="forma" aria-label="Ultime partite, dalla più vecchia">
                  {forma.map((m) => {
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
            </>
          )}
        </>
      )}
    </div>
  )
}
