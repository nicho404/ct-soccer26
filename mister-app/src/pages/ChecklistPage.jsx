import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { FORMATI, MODULI_FORMATO } from '../lib/formazioni'
import { formatDataPartita, perDataDecrescente } from '../lib/partite'
import { refertoCompilato, occupantiPerSlot } from '../lib/storico'
import { domandePerSlot } from '../lib/domandeRuolo'
import { nomeBreve } from '../lib/nomi'
import EmptyState from '../components/EmptyState'
import { IconCheckSquare } from '../components/icons'

// Quante domande di una lettura hanno già una risposta (sì/no o un "altro"
// scritto): il "non sicuro, due parole" conta come risposta a tutti gli
// effetti, non come casella vuota.
function contaRisposte(lettura) {
  if (!lettura) return 0
  return (lettura.risposte ?? []).filter((r) => r.risposta || (r.altro && r.altro.trim())).length
}

export default function ChecklistPage() {
  const navigate = useNavigate()
  const [matchId, setMatchId] = useState(null)
  const [sel, setSel] = useState(null) // { playerId, slotIndex, sigla }
  const [risposte, setRisposte] = useState({})

  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const players = useLiveQuery(() => db.players.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])
  const letture = useLiveQuery(
    () => (matchId != null ? db.letturePartita.where('matchId').equals(matchId).toArray() : Promise.resolve([])),
    [matchId]
  )

  // `letture` va letto solo al momento della selezione, non ogni volta che
  // la query si aggiorna: altrimenti un salvataggio altrove (o anche solo un
  // re-render della live query) cancellerebbe le risposte in corso di
  // compilazione per il giocatore aperto. Il ref bypassa la dipendenza senza
  // congelare il dato: legge sempre il valore più recente al momento giusto.
  const lettureRef = useRef(letture)
  lettureRef.current = letture

  // Al cambio di giocatore selezionato, ricarica la lettura già salvata (se
  // c'è) o riparte da zero: mai trascinare le risposte del giocatore
  // precedente su quello nuovo.
  useEffect(() => {
    if (!sel) return
    const esistente = lettureRef.current?.find((l) => l.playerId === sel.playerId)
    const domande = domandePerSlot(sel.sigla)
    const base = Object.fromEntries(domande.map((d) => [d.id, { risposta: null, altro: '' }]))
    for (const r of esistente?.risposte ?? []) {
      if (base[r.domandaId]) base[r.domandaId] = { risposta: r.risposta ?? null, altro: r.altro ?? '' }
    }
    setRisposte(base)
  }, [sel])

  if (!matches || !players || !opponents || team === undefined || letture === undefined) return null

  const nomeAvversario = (id) => opponents.find((o) => o.id === id)?.nome

  const candidatiCompilabili = matches.filter(refertoCompilato).sort(perDataDecrescente)
  const matchSelezionata = matches.find((m) => m.id === matchId) ?? null

  const fmt = FORMATI.includes(matchSelezionata?.formazione?.formato)
    ? matchSelezionata.formazione.formato
    : FORMATI.includes(team?.formato) ? team.formato : 7
  const modulo = matchSelezionata ? MODULI_FORMATO[fmt]?.[matchSelezionata.formazione.modulo] : null
  const slotsOccupati = matchSelezionata && modulo ? occupantiPerSlot(matchSelezionata, modulo) : []

  const tornaIndietro = () => {
    if (sel) { setSel(null); return }
    if (matchId != null) { setMatchId(null); return }
    navigate('/altro')
  }

  const toggleRisposta = (domandaId, valore) =>
    setRisposte((r) => ({
      ...r,
      [domandaId]: { ...(r[domandaId] ?? { altro: '' }), risposta: r[domandaId]?.risposta === valore ? null : valore },
    }))

  const setAltro = (domandaId, testo) =>
    setRisposte((r) => ({
      ...r,
      [domandaId]: { ...(r[domandaId] ?? { risposta: null }), altro: testo },
    }))

  const salvaLettura = async () => {
    const arr = domandePerSlot(sel.sigla).map((d) => ({
      domandaId: d.id,
      risposta: risposte[d.id]?.risposta ?? null,
      altro: risposte[d.id]?.altro ?? '',
    }))
    const esistente = letture.find((l) => l.playerId === sel.playerId)
    const dati = { matchId, playerId: sel.playerId, slot: sel.sigla, risposte: arr }
    if (esistente) await db.letturePartita.update(esistente.id, dati)
    else await db.letturePartita.add(dati)
    setSel(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={tornaIndietro}>‹</button>
        <h1>Checklist ruoli</h1>
      </div>

      {!matchSelezionata && (
        candidatiCompilabili.length === 0 ? (
          <EmptyState
            icon={<IconCheckSquare />}
            title="Nessun referto compilato"
            text="La checklist nasce dalla formazione schierata: compila prima il referto di una partita."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/partite')}>
                Vai alle partite
              </button>
            }
          />
        ) : (
          <>
            <div className="section-title">Scegli la partita</div>
            {candidatiCompilabili.map((m) => (
              <button
                key={m.id}
                className="card tappable"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => setMatchId(m.id)}
              >
                <strong>{nomeAvversario(m.opponentId) || 'Avversario da definire'}</strong>
                <div className="muted small">{formatDataPartita(m.data)}</div>
              </button>
            ))}
          </>
        )
      )}

      {matchSelezionata && !sel && (
        <>
          <div className="card">
            <strong>{nomeAvversario(matchSelezionata.opponentId) || 'Avversario da definire'}</strong>
            <div className="muted small">{formatDataPartita(matchSelezionata.data)}</div>
          </div>

          <div className="section-title">Scegli chi valutare</div>
          {slotsOccupati.length === 0 && (
            <div className="card muted small">Nessuna formazione schierata per questa partita.</div>
          )}
          {slotsOccupati.map((s) => {
            const domande = domandePerSlot(s.sigla)
            return (
              <div key={s.slotIndex} style={{ marginBottom: 10 }}>
                <div className="muted small" style={{ margin: '0 6px 4px' }}>{s.sigla}</div>
                {s.playerIds.map((pid, idx) => {
                  const p = players.find((pl) => pl.id === pid)
                  if (!p) return null
                  const lettura = letture.find((l) => l.playerId === pid)
                  const fatte = contaRisposte(lettura)
                  return (
                    <button
                      key={pid}
                      className="card tappable"
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => setSel({ playerId: pid, slotIndex: s.slotIndex, sigla: s.sigla })}
                    >
                      <div className="row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{nomeBreve(p)}</strong>
                          <span className="muted small" style={{ marginLeft: 8 }}>
                            {idx === 0 ? 'Titolare' : 'Cambio'}
                          </span>
                        </div>
                        <span className={`badge ${domande.length > 0 && fatte === domande.length ? 'badge-ok' : ''}`}>
                          {domande.length === 0 ? '—' : `${fatte}/${domande.length}`}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {matchSelezionata && sel && (
        <>
          <div className="card">
            <strong>{nomeBreve(players.find((p) => p.id === sel.playerId))}</strong>
            <span className="muted small" style={{ marginLeft: 8 }}>{sel.sigla}</span>
          </div>

          {domandePerSlot(sel.sigla).map((d) => (
            <div className="card" key={d.id} style={{ marginTop: 8 }}>
              <div className="row">
                <div style={{ flex: 1 }}>{d.testo}</div>
                <div className="vote-row">
                  <button
                    className={`vote-btn ${risposte[d.id]?.risposta === 'si' ? 'on' : ''}`}
                    aria-label={`${d.testo}: sì`}
                    onClick={() => toggleRisposta(d.id, 'si')}
                  >
                    Sì
                  </button>
                  <button
                    className={`vote-btn ${risposte[d.id]?.risposta === 'no' ? 'on' : ''}`}
                    aria-label={`${d.testo}: no`}
                    onClick={() => toggleRisposta(d.id, 'no')}
                  >
                    No
                  </button>
                </div>
              </div>
              <input
                className="input"
                style={{ marginTop: 8 }}
                value={risposte[d.id]?.altro ?? ''}
                onChange={(e) => setAltro(d.id, e.target.value)}
                placeholder="Non sicuro? Scrivi due parole invece di tirare a indovinare."
              />
            </div>
          ))}

          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={salvaLettura}>
            Salva
          </button>
        </>
      )}
    </div>
  )
}
