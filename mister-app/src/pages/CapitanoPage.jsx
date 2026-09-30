import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { isAttivo } from '../db/constants'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { IconStar } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import { classificaCapitani, COPERTURA_MINIMA } from '../lib/capitano'
import Fascia from '../components/Fascia'
import Modal from '../components/Modal'
import { fasciaDi } from '../lib/fascia'
import { calcolaUmore, badgePresenze } from '../lib/umore'
import { BadgePresenze } from '../components/UmoreLegenda'

// Umori che su chi porta la fascia meritano un avviso: un capitano scontento
// del minutaggio è un problema di spogliatoio, gli altri stati non dicono niente.
const UMORI_DI_ALLARME = ['triste', 'arrabbiato']

// Le voci senza dato restano in lista, in grigio: dicono cosa manca per
// avere un confronto onesto, che è un'informazione utile quanto il punteggio.
function VoceRiga({ voce, extra }) {
  const assente = voce.valore === null
  return (
    <div className="crit-media-row">
      <span className="crit-media-label" style={assente ? { opacity: 0.5 } : undefined}>
        {voce.label} <span className="muted">· {voce.peso}%</span>
        {extra && <> {extra}</>}
      </span>
      <span className="stat-bar">
        {!assente && (
          <span
            className={`stat-bar-fill vote-fill-${Math.max(1, Math.round(voce.valore / 20))}`}
            style={{ width: `${voce.valore}%` }}
          />
        )}
      </span>
      <span className="muted" style={{ minWidth: 34, textAlign: 'right', fontSize: '0.85rem' }}>
        {assente ? '—' : voce.valore}
      </span>
    </div>
  )
}

export default function CapitanoPage() {
  const navigate = useNavigate()
  // giocatore di cui è aperta la finestra con i criteri
  const [aperto, setAperto] = useState(null)
  const players = useLiveQuery(() => db.players.toArray(), [])
  const observations = useLiveQuery(() => db.observations.toArray(), [])
  const trainings = useLiveQuery(() => db.trainings.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const capitano = useLiveQuery(() => db.meta.get('capitano').then((c) => c ?? null), [])
  const vice = useLiveQuery(() => db.meta.get('vice').then((c) => c ?? null), [])

  if (!players || !observations || !trainings || !matches || capitano === undefined || vice === undefined) return null

  const attivi = players.filter(isAttivo)
  const righe = classificaCapitani({ players: attivi, observations, trainings, matches })
  const conDati = righe.filter((r) => r.punteggio !== null)
  const capitanoId = capitano?.value ?? null
  const viceId = vice?.value ?? null
  const giocatoreDi = (pid) => players.find((p) => p.id === pid)

  // Una fascia per giocatore: chi diventa capitano smette di essere vice e
  // viceversa. Ritoccare la fascia che ha già la toglie.
  const assegna = async (chiave, pid, attuale, altra, altraId) => {
    if (attuale === pid) {
      await db.meta.delete(chiave)
      return
    }
    await db.transaction('rw', db.meta, async () => {
      if (altraId === pid) await db.meta.delete(altra)
      await db.meta.put({ key: chiave, value: pid })
    })
  }
  const nomina = (pid) => assegna('capitano', pid, capitanoId, 'vice', viceId)
  const nominaVice = (pid) => assegna('vice', pid, viceId, 'capitano', capitanoId)

  const rigaDi = (pid) => conDati.find((r) => r.playerId === pid)
  const posizioneDi = (pid) => conDati.findIndex((r) => r.playerId === pid) + 1

  // I due pulsanti fascia, uguali in elenco e nella finestra: C pieno quando
  // è capitano, VC quando è vice. Il tocco non apre la finestra della riga.
  const pulsantiFascia = (pid, grandi = false) => {
    const tipo = fasciaDi(pid, { capitanoId, viceId })
    const stop = (fn) => (e) => { e.stopPropagation(); fn(pid) }
    return (
      <>
        <button
          type="button"
          className={`fascia-btn ${tipo === 'capitano' ? 'on capitano' : ''} ${grandi ? 'grande' : ''}`}
          aria-pressed={tipo === 'capitano'}
          aria-label={tipo === 'capitano' ? 'Togli la fascia' : 'Nomina capitano'}
          onClick={stop(nomina)}
        >
          {grandi ? (tipo === 'capitano' ? 'Togli la fascia' : 'Nomina capitano') : 'C'}
        </button>
        <button
          type="button"
          className={`fascia-btn ${tipo === 'vice' ? 'on vice' : ''} ${grandi ? 'grande' : ''}`}
          aria-pressed={tipo === 'vice'}
          aria-label={tipo === 'vice' ? 'Togli vice' : 'Nomina vice'}
          onClick={stop(nominaVice)}
        >
          {grandi ? (tipo === 'vice' ? 'Togli vice' : 'Nomina vice') : 'VC'}
        </button>
      </>
    )
  }

  const overall = (r) => r ? (
    <span
      className={`badge ${r.copertura < COPERTURA_MINIMA ? 'badge-warn' : 'badge-ok'}`}
      title={r.copertura < COPERTURA_MINIMA ? 'Overall su dati parziali' : 'Overall capitano'}
    >
      {r.punteggio}
    </span>
  ) : null

  const designati = [
    { id: capitanoId, tipo: 'capitano' },
    { id: viceId, tipo: 'vice' },
  ]

  const rigaAperta = aperto != null ? rigaDi(aperto) : null
  const giocatoreAperto = aperto != null ? giocatoreDi(aperto) : null

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/altro')}>‹</button>
        <h1>Capitano</h1>
      </div>

      {conDati.length === 0 ? (
        <EmptyState
          icon={<IconStar />}
          title="Non c'è ancora niente da confrontare"
          text="Il confronto nasce dai dati che raccogli altrove: osservazioni, appello agli allenamenti, minuti giocati. Comincia da un'osservazione."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/osservazione')}>
              Vai a Osservazione
            </button>
          }
        />
      ) : (
        <>
          {/* Le due fasce a colpo d'occhio: chi le ha e con che overall */}
          <div className="fasce-grid">
            {designati.map((d) => {
              const p = d.id != null ? giocatoreDi(d.id) : null
              return (
                <div
                  key={d.tipo}
                  className={`fascia-tessera ${p ? 'tappable' : ''}`}
                  onClick={p ? () => setAperto(d.id) : undefined}
                >
                  <Fascia tipo={d.tipo} />
                  {p ? (
                    <>
                      <div className="row" style={{ marginTop: 8, gap: 8 }}>
                        <Avatar src={p.foto} size={32} />
                        <strong className="small" style={{ flex: 1, minWidth: 0 }}>{nomeBreve(p)}</strong>
                        {overall(rigaDi(d.id))}
                      </div>
                      {(() => {
                        const umore = calcolaUmore({ trainings, matches }, d.id)
                        if (!umore || !UMORI_DI_ALLARME.includes(umore.livello)) return null
                        return (
                          <div className="fascia-allarme">
                            {umore.emoji} Scontento del minutaggio
                          </div>
                        )
                      })()}
                    </>
                  ) : (
                    <div className="muted small" style={{ marginTop: 8 }}>Da nominare</div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="muted small" style={{ margin: '0 0 10px' }}>
            Overall dai dati già raccolti (giallo = dati parziali). Tocca un giocatore per i criteri.
          </p>

          {conDati.map((r, i) => {
            const p = giocatoreDi(r.playerId)
            if (!p) return null
            return (
              <div
                className="card tappable capitano-riga"
                key={r.playerId}
                role="button"
                tabIndex={0}
                aria-label={`Criteri di ${nomeBreve(p)}`}
                onClick={() => setAperto(r.playerId)}
                onKeyDown={(e) => { if (e.key === 'Enter') setAperto(r.playerId) }}
              >
                <span className="muted small" style={{ minWidth: 18 }}>{i + 1}</span>
                <Avatar src={p.foto} size={32} />
                <strong className="small" style={{ flex: 1, minWidth: 0 }}>{nomeBreve(p)}</strong>
                {overall(r)}
                {pulsantiFascia(r.playerId)}
              </div>
            )
          })}

          {righe.length > conDati.length && (
            <p className="muted small">
              {righe.length - conDati.length} giocatori restano fuori dal confronto: su di loro
              non c'è ancora nessun dato.
            </p>
          )}
        </>
      )}

      {giocatoreAperto && (
        <Modal titolo={nomeBreve(giocatoreAperto)} onClose={() => setAperto(null)}>
          <div className="row" style={{ marginBottom: 10, gap: 8 }}>
            <Avatar src={giocatoreAperto.foto} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Fascia tipo={fasciaDi(aperto, { capitanoId, viceId })} />
              <div className="muted small" style={{ marginTop: 4 }}>
                {rigaAperta
                  ? `${posizioneDi(aperto)}° · ${rigaAperta.copertura}% dei criteri coperto${rigaAperta.copertura < COPERTURA_MINIMA ? ' (dati parziali)' : ''}`
                  : 'Nessun dato per il confronto'}
              </div>
            </div>
            {rigaAperta && <span className="badge badge-accent" style={{ fontSize: '1.1rem' }}>{rigaAperta.punteggio}</span>}
          </div>

          {rigaAperta?.voci.map((v) => (
            <VoceRiga
              voce={v}
              key={v.key}
              extra={v.key === 'allenamenti' && v.valore != null
                ? <BadgePresenze badge={badgePresenze(v.valore / 100)} />
                : null}
            />
          ))}

          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            {pulsantiFascia(aperto, true)}
          </div>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 10 }}
            onClick={() => navigate(`/rosa/${aperto}`)}
          >
            Apri scheda giocatore
          </button>
        </Modal>
      )}
    </div>
  )
}
