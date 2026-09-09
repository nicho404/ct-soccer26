import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { isAttivo } from '../db/constants'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { IconStar } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import { classificaCapitani, COPERTURA_MINIMA } from '../lib/capitano'

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

  if (!players || !observations || !trainings || !matches || capitano === undefined) return null

  const attivi = players.filter(isAttivo)
  const righe = classificaCapitani({ players: attivi, observations, trainings, matches })
  const conDati = righe.filter((r) => r.punteggio !== null)
  const capitanoId = capitano?.value ?? null
  const giocatoreDi = (pid) => players.find((p) => p.id === pid)

  const nomina = async (pid) => {
    if (capitanoId === pid) {
      await db.meta.delete('capitano')
      return
    }
    await db.meta.put({ key: 'capitano', value: pid })
  }

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
          {capitanoId != null && giocatoreDi(capitanoId) && (
            <div className="team-banner">
              <Avatar src={giocatoreDi(capitanoId).foto} size={38} />
              <div style={{ minWidth: 0 }}>
                <strong>{giocatoreDi(capitanoId).nome}</strong>
                <div className="muted small">Capitano designato</div>
              </div>
            </div>
          )}

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
            return (
              <div className="card" key={r.playerId}>
                <div className="row">
                  <span className="badge">{i + 1}</span>
                  <Avatar src={p.foto} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong className="small">{nomeBreve(p)}</strong>
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
