import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  ruoloLabel, ruoloOrdine, famigliaRuolo, tesseramentoInfo, statoAttivitaInfo, isAttivo,
} from '../db/constants'
import { presenzaPct } from '../lib/stats'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { IconUsers } from '../components/icons'

function PlayerCard({ player, trainings }) {
  const tess = tesseramentoInfo(player.tesseramento)
  const stato = statoAttivitaInfo(player.statoAttivita)
  const pct = presenzaPct(trainings, player.id)
  return (
    <Link to={`/rosa/${player.id}`} className="card tappable">
      <div className="row">
        <Avatar src={player.foto} size={38} />
        {player.numero !== '' && player.numero != null && (
          <span className="shirt-number">{player.numero}</span>
        )}
        <strong>
          {player.titolare && <span className="star-on">★ </span>}
          {player.nome}
          {player.soprannome ? <span className="muted"> “{player.soprannome}”</span> : null}
        </strong>
        <span className="spacer" />
        <span
          className={`badge badge-role-${famigliaRuolo(player.ruoloNaturale) || 'none'}`}
          title={ruoloLabel(player.ruoloNaturale)}
        >
          {player.ruoloNaturale || '—'}
          {player.ruoliAdattati?.length ? (
            <span style={{ opacity: 0.65, fontWeight: 500 }}>
              {' '}· {player.ruoliAdattati.join(' ')}
            </span>
          ) : null}
        </span>
      </div>
      <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
        {player.statoAttivita !== 'sicuro' && (
          <span className={`badge ${stato.badge ? `badge-${stato.badge}` : ''}`}>{stato.label}</span>
        )}
        {player.acciaccato && <span className="badge badge-danger">🩹 Acciaccato</span>}
        {tess.value !== 'ok' && (
          <span className={`badge badge-${tess.badge}`}>{tess.label}</span>
        )}
        {player.porta === 'si' && <span className="badge badge-warn">🧤 Porta</span>}
        {player.porta === 'emergenza' && <span className="badge">🧤 Porta (emerg.)</span>}
        <span className="badge">Presenze: {pct === null ? '—' : `${pct}%`}</span>
      </div>
    </Link>
  )
}

const ordina = (a, b) =>
  ruoloOrdine(a.ruoloNaturale) - ruoloOrdine(b.ruoloNaturale) ||
  (a.numero || 999) - (b.numero || 999) ||
  a.nome.localeCompare(b.nome)

export default function RosaPage() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('attivi')
  const players = useLiveQuery(() => db.players.toArray(), [])
  const trainings = useLiveQuery(() => db.trainings.toArray(), [])

  if (!players || !trainings) return null

  const attivi = players.filter(isAttivo).sort(ordina)
  const inattivi = players.filter((p) => !isAttivo(p)).sort(ordina)
  const titolari = attivi.filter((p) => p.titolare)
  const visibili =
    filtro === 'attivi' ? attivi : filtro === 'titolari' ? titolari : [...attivi, ...inattivi]

  return (
    <div className="page">
      <div className="page-header">
        <h1>Rosa</h1>
        <span className="muted small">
          {attivi.length} attivi{inattivi.length > 0 ? ` · ${players.length} totali` : ''}
        </span>
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={<IconUsers />}
          title="La rosa è vuota"
          text="Inizia aggiungendo i tuoi giocatori: nome, ruolo e stato di tesseramento."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>
              + Aggiungi il primo giocatore
            </button>
          }
        />
      ) : (
        <>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            <button
              className={`chip chip-sm ${filtro === 'attivi' ? 'selected' : ''}`}
              onClick={() => setFiltro('attivi')}
            >
              Attivi ({attivi.length})
            </button>
            <button
              className={`chip chip-sm ${filtro === 'titolari' ? 'selected' : ''}`}
              onClick={() => setFiltro('titolari')}
            >
              ★ Titolari ({titolari.length})
            </button>
            <button
              className={`chip chip-sm ${filtro === 'tutti' ? 'selected' : ''}`}
              onClick={() => setFiltro('tutti')}
            >
              Tutti ({players.length})
            </button>
          </div>

          {visibili.map((p) => (
            <div key={p.id} style={isAttivo(p) ? undefined : { opacity: 0.55 }}>
              <PlayerCard player={p} trainings={trainings} />
            </div>
          ))}
        </>
      )}

      {players.length > 0 && (
        <button className="fab" aria-label="Aggiungi giocatore" onClick={() => navigate('/rosa/nuovo')}>
          +
        </button>
      )}
    </div>
  )
}
