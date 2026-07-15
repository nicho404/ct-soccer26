import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  ruoloLabel, famigliaRuolo, famigliaRuoloTattico, tesseramentoInfo, statoAttivitaInfo,
  portaInfo, isAttivo,
  PIEDI, STATI_ATTIVITA, CALCI_FISSI, CRITERI_OSSERVAZIONE, TIPI_INTESA,
} from '../db/constants'
import { presenzaPct, minutiTotali, minutiPerCompetizione, statPorta } from '../lib/stats'

function InfoRow({ label, children }) {
  return (
    <div className="row" style={{ padding: '6px 0', alignItems: 'flex-start' }}>
      <span className="muted small" style={{ minWidth: 130 }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}

export default function PlayerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const playerId = Number(id)

  const player = useLiveQuery(() => db.players.get(playerId), [playerId])
  const observations = useLiveQuery(
    () => db.observations.where('playerId').equals(playerId).reverse().sortBy('data'),
    [playerId]
  )
  const trainings = useLiveQuery(() => db.trainings.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])
  const intese = useLiveQuery(
    () => db.intese.filter((i) => i.playerIds?.includes(playerId)).toArray(),
    [playerId]
  )
  const allPlayers = useLiveQuery(() => db.players.toArray(), [])

  if (
    player === undefined || !observations || !trainings || !matches ||
    !competitions || !intese || !allPlayers
  ) return null

  if (!player) {
    return (
      <div className="page">
        <p className="muted">Giocatore non trovato.</p>
        <button className="btn" onClick={() => navigate('/rosa')}>Torna alla rosa</button>
      </div>
    )
  }

  const tess = tesseramentoInfo(player.tesseramento)
  const stato = statoAttivitaInfo(player.statoAttivita)
  const pct = presenzaPct(trainings, playerId)
  const minuti = minutiTotali(matches, playerId)
  const perComp = minutiPerCompetizione(matches, playerId)
  const porta = statPorta(matches, playerId)
  const nomeDi = (pid) => {
    const p = allPlayers.find((x) => x.id === pid)
    return p ? p.soprannome || p.nome : '?'
  }
  const compNome = (cid) =>
    competitions.find((c) => c.id === cid)?.nome ?? 'Senza competizione'

  const setStato = async (value) => {
    await db.players.update(playerId, { statoAttivita: value })
  }

  const remove = async () => {
    const ok = window.confirm(
      `Eliminare ${player.nome} e tutte le sue osservazioni? L'operazione non si può annullare.`
    )
    if (!ok) return
    const obsIds = await db.observations.where('playerId').equals(playerId).primaryKeys()
    await db.observations.bulkDelete(obsIds)
    await db.players.delete(playerId)
    navigate('/rosa', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/rosa')}>‹</button>
        <span className={`role-dot ${famigliaRuolo(player.ruoloNaturale)}`} />
        <h1>
          {player.numero !== '' && player.numero != null ? `${player.numero} · ` : ''}
          {player.nome}
          {player.soprannome ? <span className="muted"> “{player.soprannome}”</span> : null}
        </h1>
        <button className="btn btn-sm" onClick={() => navigate(`/rosa/${playerId}/modifica`)}>
          Modifica
        </button>
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <span className={`badge ${stato.badge ? `badge-${stato.badge}` : ''}`}>{stato.label}</span>
        {player.acciaccato && <span className="badge badge-danger">🩹 Acciaccato</span>}
        <span className={`badge badge-${tess.badge}`}>CSI: {tess.label}</span>
        {player.porta !== 'no' && (
          <span className="badge badge-warn">🧤 Porta: {portaInfo(player.porta).label}</span>
        )}
      </div>

      <div className="card">
        <InfoRow label="Posizione naturale">
          <span className={`badge badge-role-${famigliaRuolo(player.ruoloNaturale) || 'none'}`}>
            {player.ruoloNaturale || '—'}
          </span>
          {player.ruoloNaturale && (
            <span className="muted small"> {ruoloLabel(player.ruoloNaturale)}</span>
          )}
        </InfoRow>
        <InfoRow label="Può coprire">
          {player.ruoliAdattati?.length
            ? player.ruoliAdattati.map((r) => (
                <span
                  key={r}
                  className={`badge badge-role-${famigliaRuolo(r) || 'none'}`}
                  title={ruoloLabel(r)}
                  style={{ marginRight: 4 }}
                >
                  {r}
                </span>
              ))
            : '—'}
        </InfoRow>
        <InfoRow label="Ruoli tattici">
          {player.ruoliTattici?.length
            ? player.ruoliTattici.map((r) => (
                <span
                  key={r}
                  className={`badge badge-role-${famigliaRuoloTattico(r) || 'none'}`}
                  style={{ marginRight: 4 }}
                >
                  {r}
                </span>
              ))
            : '—'}
        </InfoRow>
        <InfoRow label="Piede">
          {PIEDI.find((p) => p.value === player.piede)?.label ?? '—'}
        </InfoRow>
        <InfoRow label="Altezza">
          {player.altezza ? `${player.altezza} cm` : '—'}
        </InfoRow>
        <InfoRow label="Calci fissi">
          {player.calciFissi?.length
            ? player.calciFissi
                .map((k) => CALCI_FISSI.find((c) => c.key === k)?.label ?? k)
                .join(', ')
            : '—'}
        </InfoRow>
        {player.condizione && <InfoRow label="Condizione">{player.condizione}</InfoRow>}
        {player.note && <InfoRow label="Note">{player.note}</InfoRow>}
      </div>

      <div className="section-title">Stagione</div>
      <div className="card">
        <InfoRow label="Presenze allenamenti">{pct === null ? 'Nessun dato' : `${pct}%`}</InfoRow>
        <InfoRow label="Minuti giocati">{minuti > 0 ? `${minuti}′` : 'Nessun dato'}</InfoRow>
        {perComp.length > 1 &&
          perComp.map(({ competitionId, minuti: min }) => (
            <InfoRow key={competitionId ?? 'none'} label={`· ${compNome(competitionId)}`}>
              {min}′
            </InfoRow>
          ))}
        <InfoRow label="In porta">
          {porta.partite > 0 ? `${porta.partite} partite · ${porta.minuti}′` : 'Mai'}
        </InfoRow>
      </div>

      <div className="section-title row">
        <span style={{ flex: 1 }}>Intese ({intese.length})</span>
        <button
          className="btn btn-sm"
          onClick={() => navigate(`/intese/nuova?player=${playerId}`)}
        >
          + Nuova
        </button>
      </div>
      {intese.length === 0 ? (
        <div className="card muted small">
          Nessuna intesa registrata: quando vedi che si capisce con qualcuno, creala da qui.
        </div>
      ) : (
        intese.map((i) => {
          const tipo = TIPI_INTESA.find((t) => t.value === i.tipo)
          return (
            <div
              className="card tappable"
              key={i.id}
              onClick={() => navigate(`/intese/${i.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="row">
                <span className="role-dot" style={{ background: tipo?.colore }} />
                <strong className="small">
                  {i.playerIds.map(nomeDi).join(' + ')}
                </strong>
                <span className="spacer" />
                <span className="badge badge-accent">{tipo?.label ?? i.tipo}</span>
              </div>
              {i.descrizione && (
                <p className="small muted" style={{ margin: '8px 0 0' }}>{i.descrizione}</p>
              )}
            </div>
          )
        })
      )}

      <div className="section-title">Osservazioni ({observations.length})</div>
      {observations.length === 0 ? (
        <div className="card muted small">
          Nessuna osservazione registrata. Le aggiungerai dalla schermata Osservazione durante
          partitelle e allenamenti.
        </div>
      ) : (
        observations.map((o) => (
          <div className="card" key={o.id}>
            <div className="row">
              <strong className="small">{o.data}</strong>
              <span className="badge">{o.contesto}</span>
            </div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {CRITERI_OSSERVAZIONE.filter((c) => o.voti?.[c.key]).map((c) => (
                <span className={`badge vote-cell-${o.voti[c.key]}`} key={c.key}>
                  {c.label}: {o.voti[c.key]}
                </span>
              ))}
            </div>
            {CRITERI_OSSERVAZIONE.filter((c) => o.noteCriteri?.[c.key]).map((c) => (
              <p className="small muted" style={{ margin: '6px 0 0' }} key={c.key}>
                <strong>{c.label}:</strong> {o.noteCriteri[c.key]}
              </p>
            ))}
            {o.notaGenerale && <p className="small" style={{ margin: '8px 0 0' }}>{o.notaGenerale}</p>}
          </div>
        ))
      )}

      <div className="section-title">Stato attività</div>
      <div className="chip-row" style={{ marginBottom: 10 }}>
        {STATI_ATTIVITA.map((s) => (
          <button
            key={s.value}
            className={`chip chip-sm ${player.statoAttivita === s.value ? 'selected' : ''}`}
            onClick={() => setStato(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {!isAttivo(player) && (
        <p className="muted small" style={{ marginTop: 0 }}>
          Inattivo: resta nell'archivio ma sparisce dalla rosa attiva.
        </p>
      )}

      <div className="section-title">Azioni</div>
      <button className="btn btn-danger btn-block" onClick={remove}>
        Elimina giocatore
      </button>
    </div>
  )
}
