import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { campoPartitaInfo } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconCalendar } from '../components/icons'
import {
  partiteInProgramma, partiteGiocate, esitoPartita, ESITO_INFO,
  formatDataPartita, quandoPartita, bilancio,
} from '../lib/partite'

function CardPartita({ partita, nomeAvversario, nomeCompetizione, inProgramma }) {
  const esito = esitoPartita(partita)
  const campo = campoPartitaInfo(partita.campo)

  return (
    <Link to={`/partite/${partita.id}`} className="card tappable">
      <div className="row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{nomeAvversario || 'Avversario da definire'}</strong>
          <div className="muted small">
            {[
              formatDataPartita(partita.data),
              partita.ora,
              campo.label,
            ].filter(Boolean).join(' · ')}
          </div>
        </div>
        {esito ? (
          <span className={`badge ${ESITO_INFO[esito].badge}`}>
            {partita.golFatti}-{partita.golSubiti}
          </span>
        ) : inProgramma ? (
          <span className="badge badge-accent">{quandoPartita(partita.data)}</span>
        ) : (
          <span className="badge badge-warn">Da compilare</span>
        )}
      </div>
      <div className="muted small" style={{ marginTop: 6, opacity: 0.75 }}>
        {[
          nomeCompetizione,
          inProgramma ? `${(partita.convocati ?? []).length} convocati` : null,
        ].filter(Boolean).join(' · ')}
      </div>
    </Link>
  )
}

export default function PartitePage() {
  const navigate = useNavigate()
  const partite = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])

  if (!partite || !opponents || !competitions) return null

  const nomeAvversario = (id) => opponents.find((o) => o.id === id)?.nome ?? ''
  const nomeCompetizione = (id) => competitions.find((c) => c.id === id)?.nome ?? ''

  const inProgramma = partiteInProgramma(partite)
  const giocate = partiteGiocate(partite)
  const b = bilancio(partite)

  const card = (partita, futura) => (
    <CardPartita
      key={partita.id}
      partita={partita}
      nomeAvversario={nomeAvversario(partita.opponentId)}
      nomeCompetizione={nomeCompetizione(partita.competitionId)}
      inProgramma={futura}
    />
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>Partite</h1>
        <span className="muted small">{partite.length}</span>
      </div>

      {partite.length === 0 ? (
        <EmptyState
          icon={<IconCalendar />}
          title="Calendario vuoto"
          text="Metti in calendario la prossima partita: da qui gestisci convocati, risultato e marcatori."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/partite/nuova')}>
              + Prima partita
            </button>
          }
        />
      ) : (
        <>
          {b.giocate > 0 && (
            <div className="stat-grid">
              <div className="stat-tile">
                <div className="value">{b.vinte}-{b.pari}-{b.perse}</div>
                <div className="label">V-N-P su {b.giocate}</div>
              </div>
              <div className="stat-tile">
                <div className="value">{b.golFatti}</div>
                <div className="label">Gol fatti</div>
              </div>
              <div className="stat-tile">
                <div className="value">{b.golSubiti}</div>
                <div className="label">Gol subiti</div>
              </div>
            </div>
          )}

          {inProgramma.length > 0 && (
            <>
              <div className="section-title">In programma</div>
              {inProgramma.map((m) => card(m, true))}
            </>
          )}

          {giocate.length > 0 && (
            <>
              <div className="section-title">Storico</div>
              {giocate.map((m) => card(m, false))}
            </>
          )}

          <button className="fab" aria-label="Nuova partita" onClick={() => navigate('/partite/nuova')}>
            +
          </button>
        </>
      )}
    </div>
  )
}
