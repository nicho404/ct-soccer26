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
import { presentiIds } from '../lib/presenze'
import { refertoCompilato } from '../lib/storico'

// Una riga per partita: a sinistra com'è finita (o quando si gioca), al
// centro avversario e data, a destra solo ciò che resta da fare.
function RigaPartita({ partita, nomeAvversario, nomeCompetizione, futura }) {
  const esito = esitoPartita(partita)
  const campo = campoPartitaInfo(partita.campo)
  const daFare = !futura && (!esito ? 'Risultato' : !refertoCompilato(partita) ? 'Referto' : null)

  return (
    <Link to={`/partite/${partita.id}`} className="card tappable partita-riga">
      <span className="partita-riga-esito">
        {esito ? (
          <span className={`badge ${ESITO_INFO[esito].badge}`}>{partita.golFatti}-{partita.golSubiti}</span>
        ) : futura ? (
          <span className="badge badge-accent">{quandoPartita(partita.data)}</span>
        ) : (
          <span className="badge badge-warn">?</span>
        )}
      </span>
      <span className="partita-riga-testo">
        <strong>{nomeAvversario || 'Avversario da definire'}</strong>
        <span className="muted small">
          {[
            formatDataPartita(partita.data),
            partita.ora,
            campo.label,
            partita.giornata ? `G${partita.giornata}` : '',
            nomeCompetizione,
            futura ? `${presentiIds(partita).length} presenti` : '',
          ].filter(Boolean).join(' · ')}
        </span>
      </span>
      {daFare && <span className="badge badge-warn">{daFare} da fare</span>}
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
  // Il nome della competizione compare sulla riga solo se ce n'è più d'una:
  // ripeterlo identico su ogni partita è rumore.
  const usate = new Set(partite.map((m) => m.competitionId ?? null))
  const nomeCompetizione = (id) =>
    usate.size > 1 ? competitions.find((c) => c.id === id)?.nome ?? '' : ''
  const unica = usate.size === 1 ? competitions.find((c) => usate.has(c.id))?.nome : null

  const inProgramma = partiteInProgramma(partite)
  const giocate = partiteGiocate(partite)
  const b = bilancio(partite)
  const refertiMancanti = giocate.filter((m) => esitoPartita(m) && !refertoCompilato(m)).length

  const riga = (partita, futura) => (
    <RigaPartita
      key={partita.id}
      partita={partita}
      nomeAvversario={nomeAvversario(partita.opponentId)}
      nomeCompetizione={nomeCompetizione(partita.competitionId)}
      futura={futura}
    />
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>Partite</h1>
        <span className="muted small">{unica ?? `${partite.length}`}</span>
      </div>

      {partite.length === 0 ? (
        <EmptyState
          icon={<IconCalendar />}
          title="Calendario vuoto"
          text="Metti in calendario la prossima partita: da qui gestisci presenze, risultato e marcatori."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/partite/nuova')}>
              + Prima partita
            </button>
          }
        />
      ) : (
        <>
          {b.giocate > 0 && (
            <div className="stat-grid compatto">
              <div className="stat-tile">
                <div className="value">
                  <span style={{ color: 'var(--ok)' }}>{b.vinte}</span>
                  <span className="muted">-</span>
                  <span style={{ color: 'var(--warn)' }}>{b.pari}</span>
                  <span className="muted">-</span>
                  <span style={{ color: 'var(--danger)' }}>{b.perse}</span>
                </div>
                <div className="label">V-N-P</div>
              </div>
              <div className="stat-tile">
                <div className="value">{b.golFatti}:{b.golSubiti}</div>
                <div className="label">Gol</div>
              </div>
              <div className={`stat-tile ${refertiMancanti > 0 ? 'stat-tile-allarme' : ''}`}>
                <div className="value">{refertiMancanti}</div>
                <div className="label">Referti da fare</div>
              </div>
            </div>
          )}

          {inProgramma.length > 0 && (
            <>
              <div className="section-title">In programma ({inProgramma.length})</div>
              {inProgramma.map((m) => riga(m, true))}
            </>
          )}

          {giocate.length > 0 && (
            <>
              <div className="section-title">Giocate ({giocate.length})</div>
              {giocate.map((m) => riga(m, false))}
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
