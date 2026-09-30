import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  ruoloLabel, ruoloOrdine, famigliaRuolo, tesseramentoInfo, statoAttivitaInfo, isAttivo, FAMIGLIE,
} from '../db/constants'
import { calcolaUmore, impegno, badgePresenze } from '../lib/umore'
import { EmojiUmore, LegendaPopup, BadgePresenze } from '../components/UmoreLegenda'
import { FASCE, fasciaDi } from '../lib/fascia'
import { nomeBreve } from '../lib/nomi'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { IconUsers } from '../components/icons'

// Umori che meritano di essere contati in cima: sono il segnale da gestire.
const SCONTENTI = ['triste', 'arrabbiato']

// Segnali da mostrare sotto il nome solo quando c'è qualcosa da sapere:
// un giocatore "in regola" ha una riga sola.
function avvisiDi(player) {
  const avvisi = []
  const stato = statoAttivitaInfo(player.statoAttivita)
  if (player.statoAttivita !== 'sicuro') avvisi.push({ testo: stato.label, badge: stato.badge })
  if (player.acciaccato) avvisi.push({ testo: '🩹 Acciaccato', badge: 'danger' })
  const tess = tesseramentoInfo(player.tesseramento)
  if (tess.value !== 'ok') avvisi.push({ testo: tess.label, badge: tess.badge })
  return avvisi
}

// Una riga per giocatore: umore, foto con numero, nome (soprannome in
// evidenza), fascia e ruolo, badge presenze. Tutto il resto è nella scheda.
function RigaGiocatore({ player, umore, imp, fascia, onUmore }) {
  const avvisi = avvisiDi(player)
  const nomeCompleto = player.nome
  const titolo = player.soprannome || nomeBreve(player)
  const f = FASCE[fascia]
  return (
    <Link to={`/rosa/${player.id}`} className="card tappable rosa-riga">
      <span className="rosa-umore">
        {umore ? <EmojiUmore umore={umore} onClick={onUmore} size={26} /> : <span className="rosa-umore-vuoto" />}
      </span>
      <span className="rosa-avatar">
        <Avatar src={player.foto} size={38} />
        {player.numero !== '' && player.numero != null && (
          <span className="rosa-numero">{player.numero}</span>
        )}
      </span>
      <span className="rosa-nome">
        <span className="rosa-nome-riga">
          <strong>{titolo}</strong>
          {player.titolare && <span className="star-on" title="Titolare"> ★</span>}
          {f && <span className={`rosa-fascia ${f.className}`} title={f.label}>{f.sigla}</span>}
          {player.porta === 'si' && famigliaRuolo(player.ruoloNaturale) !== 'por' && (
            <span title="Copre la porta"> 🧤</span>
          )}
        </span>
        {player.soprannome && <span className="rosa-nome-completo">{nomeCompleto}</span>}
        {avvisi.length > 0 && (
          <span className="rosa-avvisi">
            {avvisi.map((a) => (
              <span key={a.testo} className={`badge badge-${a.badge || ''}`}>{a.testo}</span>
            ))}
          </span>
        )}
      </span>
      <span
        className={`badge badge-role-${famigliaRuolo(player.ruoloNaturale) || 'none'}`}
        title={ruoloLabel(player.ruoloNaturale)}
      >
        {player.ruoloNaturale || '—'}
      </span>
      <span className="rosa-presenze">
        {imp?.quota != null && <BadgePresenze badge={badgePresenze(imp.quota)} quota={imp.quota} />}
      </span>
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
  const [legendaUmore, setLegendaUmore] = useState(false)
  const players = useLiveQuery(() => db.players.toArray(), [])
  const trainings = useLiveQuery(() => db.trainings.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const capitano = useLiveQuery(() => db.meta.get('capitano').then((c) => c ?? null), [])
  const vice = useLiveQuery(() => db.meta.get('vice').then((c) => c ?? null), [])

  if (!players || !trainings || !matches || capitano === undefined || vice === undefined) return null
  const fasce = { capitanoId: capitano?.value ?? null, viceId: vice?.value ?? null }
  const dati = { trainings, matches }

  const attivi = players.filter(isAttivo).sort(ordina)
  const inattivi = players.filter((p) => !isAttivo(p)).sort(ordina)
  const titolari = attivi.filter((p) => p.titolare)
  const visibili =
    filtro === 'attivi' ? attivi : filtro === 'titolari' ? titolari : [...attivi, ...inattivi]

  const info = new Map(players.map((p) => [p.id, { umore: calcolaUmore(dati, p.id), imp: impegno(dati, p.id) }]))

  // Riepilogo: "chi ho a disposizione?" — i tre numeri che rispondono.
  const disponibili = attivi.filter((p) => p.statoAttivita !== 'infortunato' && !p.acciaccato)
  const inPorta = attivi.filter((p) => p.porta === 'si')
  const scontenti = attivi.filter((p) => SCONTENTI.includes(info.get(p.id).umore?.livello))

  // Raggruppati per reparto, nell'ordine del campo (POR → ATT)
  const reparti = FAMIGLIE
    .map((f) => ({ ...f, giocatori: visibili.filter((p) => famigliaRuolo(p.ruoloNaturale) === f.value) }))
    .concat([{ value: 'none', label: 'Senza ruolo', giocatori: visibili.filter((p) => !famigliaRuolo(p.ruoloNaturale)) }])
    .filter((r) => r.giocatori.length > 0)

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
          <div className="stat-grid compatto">
            <div className="stat-tile">
              <div className="value">{disponibili.length}</div>
              <div className="label">Disponibili</div>
            </div>
            <div className={`stat-tile ${inPorta.length === 0 ? 'stat-tile-allarme' : ''}`}>
              <div className="value">{inPorta.length}</div>
              <div className="label">🧤 In porta</div>
            </div>
            <div className={`stat-tile ${scontenti.length > 0 ? 'stat-tile-allarme' : ''}`}>
              <div className="value">{scontenti.length}</div>
              <div className="label">Scontenti</div>
            </div>
          </div>

          <div className="chip-row" style={{ marginBottom: 6 }}>
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
          <p className="muted small" style={{ margin: '0 0 4px' }}>
            Tocca la faccina per la legenda di umore e presenze.
          </p>

          {reparti.map((r) => (
            <div key={r.value}>
              <div className="section-title">{r.label} ({r.giocatori.length})</div>
              {r.giocatori.map((p) => (
                <div key={p.id} style={isAttivo(p) ? undefined : { opacity: 0.55 }}>
                  <RigaGiocatore
                    player={p}
                    umore={info.get(p.id).umore}
                    imp={info.get(p.id).imp}
                    fascia={fasciaDi(p.id, fasce)}
                    onUmore={() => setLegendaUmore(true)}
                  />
                </div>
              ))}
            </div>
          ))}

          {legendaUmore && <LegendaPopup onClose={() => setLegendaUmore(false)} />}
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
