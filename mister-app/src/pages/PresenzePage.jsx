import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import EmptyState from '../components/EmptyState'
import { IconClipboardCheck } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import { formatDataPartita } from '../lib/partite'
import { contaSeduta, pctSeduta } from '../lib/presenze'
import { impegno, badgePresenze, calcolaUmore } from '../lib/umore'
import { EmojiUmore, LegendaPopup, BadgePresenze } from '../components/UmoreLegenda'

// Ordine di lettura: la seduta o partita più recente per prima.
const perDataDecrescente = (a, b) =>
  `${b.data ?? ''} ${b.ora ?? ''}`.localeCompare(`${a.data ?? ''} ${a.ora ?? ''}`)

const pct = (x) => `${Math.round(x * 100)}%`

export default function PresenzePage() {
  const navigate = useNavigate()
  const [legenda, setLegenda] = useState(false)
  const trainings = useLiveQuery(() => db.trainings.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const piani = useLiveQuery(() => db.sessionPlans.toArray(), [])

  if (!trainings || !players || !matches || !opponents || !piani) return null

  const modelli = piani.filter((p) => p.isTemplate)
  const nomeAvversario = (id) => opponents.find((o) => o.id === id)?.nome

  // Vista unica di "chi c'era": sedute e partite condividono lo stesso
  // appello (presente/assente/giustificato), quindi finiscono nella stessa
  // lista cronologica invece che in due sezioni scollegate.
  const eventi = [
    ...trainings.map((t) => ({ tipo: 'allenamento', id: t.id, data: t.data, ora: t.ora, presenze: t.presenze, titolo: t.tema || 'Allenamento' })),
    ...matches.map((m) => ({ tipo: 'partita', id: m.id, data: m.data, ora: m.ora, presenze: m.presenze, titolo: nomeAvversario(m.opponentId) || 'Avversario da definire' })),
  ].sort(perDataDecrescente)

  // Stessi numeri della Rosa: presenze su allenamenti + partite, badge e
  // umore calcolati da lib/umore. Una sola fonte, nessuna percentuale diversa.
  const dati = { trainings, matches }
  const righe = players
    .map((p) => ({ p, imp: impegno(dati, p.id), umore: calcolaUmore(dati, p.id) }))
    .filter((r) => r.imp)
    .sort((a, b) =>
      (b.imp.quota ?? -1) - (a.imp.quota ?? -1) ||
      b.imp.presenti - a.imp.presenti ||
      nomeBreve(a.p).localeCompare(nomeBreve(b.p)))

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Presenze e sedute</h1>
        <span className="muted small">{eventi.length}</span>
      </div>

      {eventi.length === 0 ? (
        <EmptyState
          icon={<IconClipboardCheck />}
          title="Nessun appello registrato"
          text="Fai l'appello a ogni allenamento e partita: in poche settimane sai chi c'è sempre e chi solo la domenica."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/presenze/nuova')}>
              + Prima seduta
            </button>
          }
        />
      ) : (
        <>
          <div className="section-title">Sedute e partite</div>
          {eventi.map((ev) => {
            const c = contaSeduta(ev)
            const pctEv = pctSeduta(ev)
            const isPartita = ev.tipo === 'partita'
            return (
              <Link
                to={isPartita ? `/partite/${ev.id}` : `/presenze/${ev.id}`}
                // la scheda partita, salvando, torna qui e non alla lista partite
                state={isPartita ? { da: '/presenze' } : undefined}
                className="card tappable"
                key={`${ev.tipo}-${ev.id}`}
              >
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{isPartita ? '⚽ ' : ''}{ev.titolo}</strong>
                    <div className="muted small">
                      {[formatDataPartita(ev.data), ev.ora].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className={`badge ${pctEv === null ? 'badge-warn' : ''}`}>
                    {pctEv === null ? 'Appello vuoto' : `${c.presenti}/${c.totale}`}
                  </span>
                </div>
              </Link>
            )
          })}

          {righe.length > 0 && (
            <>
              <div className="section-title">Presenze giocatori</div>
              <div className="obs-table-wrap">
                <table className="obs-table">
                  <thead>
                    <tr>
                      <th aria-label="Umore" />
                      <th>Giocatore</th>
                      <th title="Presente">P</th>
                      <th title="Assente">A</th>
                      <th title="Assente giustificato">G</th>
                      <th>%</th>
                      <th aria-label="Badge" />
                    </tr>
                  </thead>
                  <tbody>
                    {righe.map(({ p, imp, umore }) => {
                      const badge = badgePresenze(imp.quota)
                      return (
                        <tr key={p.id}>
                          <td>{umore && <EmojiUmore umore={umore} size="1.1rem" onClick={() => setLegenda(true)} />}</td>
                          <td><Link to={`/rosa/${p.id}`}>{nomeBreve(p)}</Link></td>
                          <td>{imp.presenti}</td>
                          <td>{imp.assenti || ''}</td>
                          <td>{imp.giustificati || ''}</td>
                          <td>{imp.quota == null ? '—' : pct(imp.quota)}</td>
                          <td><BadgePresenze badge={badge} quota={imp.quota} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="muted small">
                % = presenze ÷ appelli, allenamenti e partite insieme (i giustificati non contano):
                la stessa della Rosa. Tocca un'emoji per la legenda di umore e badge.
              </p>
            </>
          )}

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

      {legenda && <LegendaPopup onClose={() => setLegenda(false)} />}
    </div>
  )
}
