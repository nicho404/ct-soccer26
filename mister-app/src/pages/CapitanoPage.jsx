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
import { fasciaDi } from '../lib/fascia'

// Le voci senza dato restano in lista, in grigio: dicono cosa manca per
// avere un confronto onesto, che è un'informazione utile quanto il punteggio.
function VoceRiga({ voce }) {
  const assente = voce.valore === null
  return (
    <div className="crit-media-row">
      <span className="crit-media-label" style={assente ? { opacity: 0.5 } : undefined}>
        {voce.label} <span className="muted">· {voce.peso}%</span>
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

  const designati = [
    { id: capitanoId, tipo: 'capitano', testo: 'Capitano designato' },
    { id: viceId, tipo: 'vice', testo: 'Vice capitano' },
  ].filter((d) => d.id != null && giocatoreDi(d.id))

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
          {designati.map((d) => (
            <div className="team-banner" key={d.tipo}>
              <Avatar src={giocatoreDi(d.id).foto} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong>{giocatoreDi(d.id).nome}</strong>
                <div className="muted small">{d.testo}</div>
              </div>
              <Fascia tipo={d.tipo} />
            </div>
          ))}

          <p className="muted small">
            Nessun dato nuovo: il confronto pesa quello che hai già raccolto — leadership e
            lettura dalle osservazioni, appello dalle sedute, presenza in campo dai referti,
            carattere dalla scheda giocatore. Il punteggio ordina, la fascia la dai tu.
          </p>

          {conDati.map((r, i) => {
            const p = giocatoreDi(r.playerId)
            if (!p) return null
            const scarso = r.copertura < COPERTURA_MINIMA
            const isCapitano = capitanoId === r.playerId
            const isVice = viceId === r.playerId
            return (
              <div className="card" key={r.playerId}>
                <div className="row">
                  <span className="badge">{i + 1}</span>
                  <Avatar src={p.foto} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong className="small">{nomeBreve(p)}</strong>
                    {' '}<Fascia tipo={fasciaDi(r.playerId, { capitanoId, viceId })} />
                    <div className="muted small">
                      {scarso
                        ? `Dati parziali (${r.copertura}% dei criteri)`
                        : `${r.copertura}% dei criteri coperto`}
                    </div>
                  </div>
                  <span className={`badge ${scarso ? 'badge-warn' : 'badge-ok'}`}>
                    {r.punteggio}
                  </span>
                </div>

                <div style={{ marginTop: 10 }}>
                  {r.voci.map((v) => (
                    <VoceRiga voce={v} key={v.key} />
                  ))}
                </div>

                <div className="row" style={{ gap: 10, marginTop: 10 }}>
                  <button
                    className={`btn btn-sm ${isCapitano ? '' : 'btn-primary'}`}
                    onClick={() => nomina(r.playerId)}
                  >
                    {isCapitano ? 'Togli la fascia' : 'Nomina capitano'}
                  </button>
                  <button
                    className={`btn btn-sm ${isVice ? '' : 'btn-primary'}`}
                    onClick={() => nominaVice(r.playerId)}
                  >
                    {isVice ? 'Togli vice' : 'Nomina vice'}
                  </button>
                  <button className="btn btn-sm" onClick={() => navigate(`/rosa/${r.playerId}`)}>
                    Scheda
                  </button>
                </div>
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
    </div>
  )
}
