import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { campoPartitaInfo } from '../db/constants'
import EmptyState from '../components/EmptyState'
import { IconCalendar } from '../components/icons'
import {
  partiteInProgramma, partiteGiocate, esitoPartita, ESITO_INFO,
  formatDataPartita, quandoBreve, bilancio, inizioCampionato, fasePartita, oggiISO,
} from '../lib/partite'
import { presentiIds } from '../lib/presenze'
import { refertoCompilato } from '../lib/storico'

const FASI = [
  { value: 'precampionato', label: 'Precampionato' },
  { value: 'campionato', label: 'Campionato' },
]

// Una riga per partita: a sinistra com'è finita (o tra quanto si gioca), al
// centro tre livelli (avversario, quando, il resto), a destra solo ciò che
// resta da fare.
function RigaPartita({ partita, nomeAvversario, nomeCompetizione, futura }) {
  const esito = esitoPartita(partita)
  const campo = campoPartitaInfo(partita.campo)
  const presenti = futura ? presentiIds(partita).length : 0
  const daFare = !futura && (!esito ? 'Risultato' : !refertoCompilato(partita) ? 'Referto' : null)

  return (
    <Link to={`/partite/${partita.id}`} className="card tappable partita-riga">
      <span className="partita-riga-esito">
        {esito ? (
          <span className={`badge ${ESITO_INFO[esito].badge}`}>{partita.golFatti}-{partita.golSubiti}</span>
        ) : futura ? (
          <span className="badge badge-accent">{quandoBreve(partita.data)}</span>
        ) : (
          <span className="badge badge-warn">?</span>
        )}
      </span>
      <span className="partita-riga-testo">
        <strong>{nomeAvversario || 'Avversario da definire'}</strong>
        <span className="partita-riga-quando">
          {[formatDataPartita(partita.data), partita.ora].filter(Boolean).join(' · ')}
        </span>
        <span className="muted small partita-riga-dettagli">
          {[
            campo.label,
            partita.giornata ? `G${partita.giornata}` : '',
            nomeCompetizione,
            presenti > 0 ? `${presenti} presenti` : '',
          ].filter(Boolean).join(' · ')}
        </span>
      </span>
      {daFare && <span className="badge badge-warn">{daFare} da fare</span>}
    </Link>
  )
}

export default function PartitePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tutte = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])

  if (!tutte || !opponents || !competitions) return null

  // Precampionato e campionato sono due stagioni diverse: bilancio ed elenco
  // riguardano una fase alla volta. La scelta compare solo se servono entrambe.
  const inizio = inizioCampionato(tutte, competitions)
  const conFasi = FASI.every((f) => tutte.some((m) => fasePartita(m, inizio) === f.value))
  const richiesta = params.get('f')
  const fase = FASI.some((f) => f.value === richiesta)
    ? richiesta
    : inizio && oggiISO() < inizio ? 'precampionato' : 'campionato'
  const partite = conFasi ? tutte.filter((m) => fasePartita(m, inizio) === fase) : tutte

  const nomeAvversario = (id) => opponents.find((o) => o.id === id)?.nome ?? ''
  // La competizione con più partite dà il nome all'elenco, in cima; sulla
  // riga compare solo quando è un'altra: ripeterla identica è rumore.
  const quante = (id) => partite.filter((m) => m.competitionId === id).length
  const principale = competitions
    .filter((c) => quante(c.id) > 0)
    .sort((a, b) => quante(b.id) - quante(a.id) || b.id - a.id)[0]
  const nomeCompetizione = (id) =>
    id === principale?.id ? '' : competitions.find((c) => c.id === id)?.nome ?? ''

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
        <span className="muted small">{principale?.nome ?? `${partite.length}`}</span>
      </div>

      {conFasi && (
        <div className="schede" role="tablist">
          {FASI.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={fase === f.value}
              className={`scheda ${fase === f.value ? 'attiva' : ''}`}
              onClick={() => setParams({ f: f.value }, { replace: true })}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {tutte.length === 0 ? (
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
