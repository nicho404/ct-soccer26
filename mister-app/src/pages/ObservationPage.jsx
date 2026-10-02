import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  CRITERI_OSSERVAZIONE, CONTESTI_OSSERVAZIONE, famigliaRuolo, isAttivo, ruoloOrdine, ruoloLabel,
} from '../db/constants'
import { MODULI_FORMATO, FORMATI } from '../lib/formazioni'
import { risolviRuoli } from '../tactics/engine'
import { refertoCompilato, occupantiPerSlot } from '../lib/storico'
import { presentiIds } from '../lib/presenze'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Scelta from '../components/Scelta'
import Avatar from '../components/Avatar'
import { IconEye } from '../components/icons'
import { nomeBreve } from '../lib/nomi'
import { formatDataPartita, oggiISO, perDataDecrescente } from '../lib/partite'

// A bordo campo un voto da 1 a 5 è lento e cambia con chi lo dà: qui tre
// pollici, giù / di lato / su. Si salvano sulla stessa scala di prima (2, 3,
// 4), così scheda giocatore e Capitano continuano a leggerli.
const LIVELLI = [
  { voto: 2, icona: '👎', label: 'Negativo', classe: 'sotto' },
  { voto: 3, icona: '👍', label: 'Neutro', classe: 'norma' },
  { voto: 4, icona: '👍', label: 'Positivo', classe: 'sopra' },
]
// anche i voti 1-5 già salvati si leggono come pollice
const livelloDi = (v) => (v == null ? null : v <= 2 ? LIVELLI[0] : v === 3 ? LIVELLI[1] : LIVELLI[2])

// Etichette corte: stanno su una riga accanto ai tre pulsanti
const ETICHETTE = {
  lettura: 'Lettura del gioco',
  piedeForte: 'Tecnica',
  piedeDebole: 'Piede debole',
  pressione: 'Sotto pressione',
  intensita: 'Intensità',
  leadership: 'Leadership',
  posizione: 'Posizione',
}
const scalaKeys = new Set(CRITERI_OSSERVAZIONE.map((c) => c.key))

// ruoloOk: true (sì) / false (no) / null (non risposto); con "no" serve il motivo
const VUOTA = () => ({ voti: {}, nota: '', ruoloOk: null, motivo: '' })

export default function ObservationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deepLinkMatchId = searchParams.get('matchId') ? Number(searchParams.get('matchId')) : null
  const deepLinkPlayerId = searchParams.get('playerId') ? Number(searchParams.get('playerId')) : null

  const [contesto, setContesto] = useState(deepLinkMatchId != null ? 'partita' : 'partitella')
  const [data, setData] = useState(oggiISO())
  const [matchId, setMatchId] = useState(deepLinkMatchId)
  // giocatore aperto nella finestra e la sua osservazione in corso
  const [selId, setSelId] = useState(deepLinkPlayerId)
  const [bozza, setBozza] = useState(VUOTA)
  const [vista, setVista] = useState('osserva')

  const players = useLiveQuery(() => db.players.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])
  const partita = matches && matchId != null ? matches.find((m) => m.id === matchId) ?? null : null
  // In partita la sessione segue la data della partita scelta
  const dataSessione = contesto === 'partita' ? partita?.data ?? null : data
  const sessione = useLiveQuery(
    () =>
      dataSessione == null
        ? []
        : db.observations.where('data').equals(dataSessione).filter((o) => o.contesto === contesto).toArray(),
    [dataSessione, contesto]
  )

  if (!players || !sessione || !matches || team === undefined) return null

  const partiteOsservabili = matches.filter(refertoCompilato).sort(perDataDecrescente)
  const formato = FORMATI.includes(team?.formato) ? team.formato : 7
  const modulo = partita ? MODULI_FORMATO[formato]?.[partita.formazione?.modulo] : null
  const occupanti = partita && modulo ? occupantiPerSlot(partita, modulo) : []
  const slotDi = (pid) => occupanti.find((s) => s.playerIds.includes(pid))?.sigla ?? null
  // Il ruolo su cui si chiede "lo svolge bene?": in partita quello tattico
  // dello slot occupato in quella gara (es. "Stopper (DC)"), altrimenti la
  // sua posizione naturale (es. "Difensore centrale").
  const ruoliPartita = partita && modulo
    ? risolviRuoli({
      modulo,
      impostazione: partita.formazione?.impostazione ?? 'possesso',
      costruzione: partita.formazione?.costruzione ?? 'equilibrata',
    })
    : []
  const ruoloDi = (p) => {
    const occ = occupanti.find((s) => s.playerIds.includes(p.id))
    const tattico = occ ? ruoliPartita[occ.slotIndex]?.nome : null
    if (contesto === 'partita' && tattico) return `${tattico} (${occ.sigla})`
    return ruoloLabel(p.ruoloNaturale)
  }

  // In partita: solo chi ha giocato (o almeno era presente). Altrimenti gli attivi.
  const giocatori = (() => {
    if (contesto === 'partita' && partita) {
      const hannoGiocato = new Set([
        ...Object.entries(partita.minuti ?? {}).filter(([, m]) => m > 0).map(([id]) => Number(id)),
        ...presentiIds(partita),
      ])
      return players.filter((p) => hannoGiocato.has(p.id))
    }
    return players.filter(isAttivo)
  })().sort((a, b) => ruoloOrdine(a.ruoloNaturale) - ruoloOrdine(b.ruoloNaturale) || nomeBreve(a).localeCompare(nomeBreve(b)))

  const osservati = new Map()
  for (const o of sessione) osservati.set(o.playerId, [...(osservati.get(o.playerId) ?? []), o])

  const selezionato = selId != null ? players.find((p) => p.id === selId) : null
  const scala = CRITERI_OSSERVAZIONE

  const apri = (pid) => { setSelId(pid); setBozza(VUOTA()) }
  const chiudi = () => {
    const pieno = bozza.nota.trim() || Object.keys(bozza.voti).length > 0 || bozza.ruoloOk != null
    if (pieno && !window.confirm('Chiudere senza salvare questa osservazione?')) return
    setSelId(null)
    setBozza(VUOTA())
  }
  // ritoccare il pulsante già scelto lo toglie; per salvare basta un dato
  const segna = (key, voto) =>
    setBozza((b) => {
      const voti = { ...b.voti }
      if (voti[key] === voto) delete voti[key]
      else voti[key] = voto
      return { ...b, voti }
    })

  const salva = async () => {
    if (!bozza.nota.trim() && Object.keys(bozza.voti).length === 0 && bozza.ruoloOk == null) {
      alert('Scrivi una nota o segna almeno un aspetto')
      return
    }
    // "no" sul ruolo senza motivo: l'errore lo mostra la finestra, sotto il campo
    if (bozza.ruoloOk === false && !bozza.motivo.trim()) {
      setBozza((b) => ({ ...b, mostraErrore: true }))
      return
    }
    await db.observations.add({
      playerId: selId,
      data: dataSessione ?? data,
      contesto,
      ...(contesto === 'partita' && matchId != null ? { matchId } : {}),
      voti: bozza.voti,
      noteCriteri: {},
      notaGenerale: bozza.nota.trim(),
      ...(bozza.ruoloOk != null
        ? {
          ruolo: {
            nome: ruoloDi(selezionato),
            ok: bozza.ruoloOk,
            ...(bozza.ruoloOk ? {} : { motivo: bozza.motivo.trim() }),
          },
        }
        : {}),
    })
    setSelId(null)
    setBozza(VUOTA())
  }

  const serveUnaPartita = contesto === 'partita' && !partita

  return (
    <div className="page">
      <div className="page-header">
        <h1>Osservazione</h1>
        <button className="btn btn-sm" onClick={() => navigate('/intese/nuova')}>🔗 Intesa</button>
      </div>

      {/* Dove e quando: tre schede uguali, poi una riga sola */}
      <div className="schede" role="tablist">
        {CONTESTI_OSSERVAZIONE.map((c) => (
          <button
            key={c.value}
            type="button"
            role="tab"
            aria-selected={contesto === c.value}
            className={`scheda ${contesto === c.value ? 'attiva' : ''}`}
            onClick={() => { setContesto(c.value); if (c.value !== 'partita') setMatchId(null) }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        {contesto === 'partita' ? (
          partiteOsservabili.length === 0 ? (
            <div className="card muted small">Serve una partita con il referto compilato.</div>
          ) : (
            <Scelta
              titolo="Quale partita?"
              className="select select-compatta"
              value={matchId ?? ''}
              onChange={(e) => setMatchId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Scegli la partita —</option>
              {partiteOsservabili.map((m) => (
                <option key={m.id} value={m.id}>
                  {formatDataPartita(m.data)}{m.golFatti != null ? ` · ${m.golFatti}-${m.golSubiti}` : ''}
                </option>
              ))}
            </Scelta>
          )
        ) : (
          <input
            className="input select-compatta"
            type="date"
            aria-label="Data"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        )}
      </div>

      {giocatori.length === 0 && !serveUnaPartita ? (
        <EmptyState
          icon={<IconEye />}
          title="Nessun giocatore da osservare"
          text="Aggiungi i giocatori alla rosa (o segna i presenti della partita) per osservarli da bordo campo."
          action={<button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>Vai alla rosa</button>}
        />
      ) : serveUnaPartita ? null : (
        <>
          <div className="chip-row" style={{ marginBottom: 10 }}>
            <button
              className={`chip chip-sm ${vista === 'osserva' ? 'selected' : ''}`}
              onClick={() => setVista('osserva')}
            >
              ✏️ Osserva
            </button>
            <button
              className={`chip chip-sm ${vista === 'riepilogo' ? 'selected' : ''}`}
              onClick={() => setVista('riepilogo')}
            >
              📋 Riepilogo ({osservati.size})
            </button>
          </div>

          {vista === 'osserva' ? (
            <>
              <p className="muted small" style={{ margin: '0 0 8px' }}>
                Tocca un giocatore per annotare quello che hai visto.
              </p>
              <div className="oss-griglia">
                {giocatori.map((p) => {
                  const n = osservati.get(p.id)?.length ?? 0
                  const sigla = contesto === 'partita' ? slotDi(p.id) : p.ruoloNaturale
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`oss-tessera ${n ? 'fatta' : ''}`}
                      onClick={() => apri(p.id)}
                    >
                      <span className="oss-avatar">
                        <Avatar src={p.foto} size={40} />
                        {n > 0 && <span className="oss-conta">✓{n > 1 ? n : ''}</span>}
                      </span>
                      <strong>{nomeBreve(p)}</strong>
                      {sigla && <span className={`badge oss-sigla badge-role-${famigliaRuolo(sigla) || 'none'}`}>{sigla}</span>}
                    </button>
                  )
                })}
              </div>
            </>
          ) : osservati.size === 0 ? (
            <div className="card muted small">Nessuna osservazione in questa sessione.</div>
          ) : (
            [...osservati.entries()].map(([pid, lista]) => {
              const p = players.find((x) => x.id === pid)
              if (!p) return null
              return (
                <div className="card voce-lista" key={pid}>
                  <strong>{nomeBreve(p)}{lista.length > 1 ? ` · ${lista.length} osservazioni` : ''}</strong>
                  {lista.map((o) => (
                    <div key={o.id} className="oss-riepilogo">
                      <div className="chip-row" style={{ gap: 4 }}>
                        {Object.entries(o.voti ?? {}).filter(([k]) => scalaKeys.has(k)).map(([k, v]) => {
                          const l = livelloDi(v)
                          return (
                            <span key={k} className={`badge oss-badge ${l.classe}`} title={l.label}>
                              <span className="pollice">{l.icona}</span> {ETICHETTE[k] ?? k}
                            </span>
                          )
                        })}
                      </div>
                      {o.ruolo && (
                        <span className="small" style={{ color: o.ruolo.ok ? 'var(--ok)' : 'var(--danger)' }}>
                          {o.ruolo.ok ? '✓' : '✗'} Ruolo da {o.ruolo.nome}{o.ruolo.motivo ? `: ${o.ruolo.motivo}` : ''}
                        </span>
                      )}
                      {o.notaGenerale && <span className="voce-anteprima">{o.notaGenerale}</span>}
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </>
      )}

      {selezionato && (
        <Modal
          titolo={`${nomeBreve(selezionato)}${contesto === 'partita' && slotDi(selId) ? ` · ${slotDi(selId)}` : ''}`}
          onClose={chiudi}
        >
          <textarea
            className="textarea"
            style={{ minHeight: 76 }}
            value={bozza.nota}
            onChange={(e) => setBozza((b) => ({ ...b, nota: e.target.value }))}
            placeholder="Cosa hai visto? Es. resta fermo sul rigore, si propone sempre…"
            aria-label="Nota"
          />

          <div style={{ height: 8 }} />
          {scala.map((c) => (
            <div className="oss-riga" key={c.key}>
              <span className="oss-etichetta">{ETICHETTE[c.key] ?? c.label}</span>
              <span className="oss-livelli">
                {LIVELLI.map((l) => (
                  <button
                    key={l.voto}
                    type="button"
                    className={`oss-livello ${l.classe} ${bozza.voti[c.key] === l.voto ? 'on' : ''}`}
                    aria-label={`${ETICHETTE[c.key] ?? c.label}: ${l.label}`}
                    aria-pressed={bozza.voti[c.key] === l.voto}
                    onClick={() => segna(c.key, l.voto)}
                  >
                    <span className="pollice">{l.icona}</span>
                  </button>
                ))}
              </span>
            </div>
          ))}

          <div className="oss-sezione"><span>Ruolo</span></div>
          <div className="oss-domanda">
            <span className="small">Svolge bene il suo ruolo da <strong>{ruoloDi(selezionato)}</strong>?</span>
            <span className="oss-livelli">
              {[{ ok: true, t: 'Sì', classe: 'sopra' }, { ok: false, t: 'No', classe: 'sotto' }].map((r) => (
                <button
                  key={r.t}
                  type="button"
                  className={`oss-livello ${r.classe} ${bozza.ruoloOk === r.ok ? 'on' : ''}`}
                  aria-pressed={bozza.ruoloOk === r.ok}
                  aria-label={`Ruolo: ${r.t}`}
                  onClick={() => setBozza((b) => ({
                    ...b, ruoloOk: b.ruoloOk === r.ok ? null : r.ok, mostraErrore: false,
                  }))}
                >
                  {r.t}
                </button>
              ))}
            </span>
          </div>
          {bozza.ruoloOk === false && (
            <div style={{ marginTop: 8 }}>
              <textarea
                className="textarea"
                style={{ minHeight: 56 }}
                value={bozza.motivo}
                onChange={(e) => setBozza((b) => ({ ...b, motivo: e.target.value, mostraErrore: false }))}
                placeholder="Perché no? Es. sale troppo e lascia scoperto il centrale…"
                aria-label="Motivo"
              />
              {bozza.mostraErrore && (
                <p className="errore-piccolo">Inserisci il motivo della valutazione</p>
              )}
            </div>
          )}

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={salva}>Salva</button>
            <button className="btn" onClick={chiudi}>Annulla</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
