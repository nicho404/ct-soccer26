import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  CAMPI_PARTITA, TIPI_COMPETIZIONE, isAttivo, ruoloOrdine, campoPartitaInfo,
} from '../db/constants'
import {
  oggiISO, esitoPartita, ESITO_INFO, campiForm, partitaGiocata, formatDataPartita, quandoPartita,
} from '../lib/partite'
import { marcatori, cartellini, disallineamentoGirone, pulisciNome } from '../lib/girone'
import { eventiPerForm, eventiPerDb } from '../db/girone'
import EventiAvversari from '../components/EventiAvversari'
import { refertoCompilato, titolariDi } from '../lib/storico'
import { contaSeduta } from '../lib/presenze'
import AppelloPresenze from '../components/AppelloPresenze'
import Scelta from '../components/Scelta'
import Modal from '../components/Modal'

const EMPTY = {
  data: '',
  ora: '',
  campo: 'casa',
  luogo: '',
  competitionId: null,
  opponentId: null,
  presenze: {},
  golFatti: null,
  golSubiti: null,
  note: '',
  giornata: '',
}

// Il campo numerico del risultato è "vuoto" finché non lo compili:
// '' → null, così partitaGiocata() distingue lo 0-0 dal non giocato.
const toGol = (raw) => {
  if (raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 ? n : null
}

const toGiornata = (raw) => {
  const n = Number(raw)
  return raw !== '' && raw != null && Number.isInteger(n) && n > 0 ? n : null
}

export default function PartitaFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Chi apre la partita da un'altra sezione (es. Presenze e sedute) passa
  // `state.da`: salvando o eliminando si torna lì, non alla lista partite.
  const tornaA = location.state?.da ?? '/partite'
  const { id } = useParams()
  const editing = Boolean(id)
  const [form, setForm] = useState({ ...EMPTY, data: oggiISO() })
  const [nomeAvversario, setNomeAvversario] = useState('')
  const [nuovaComp, setNuovaComp] = useState(null) // { nome, tipo } quando aperta
  const [loaded, setLoaded] = useState(!editing)
  // marcatori e cartellini avversari nella forma del form ({ tipo, lato, nome })
  const [eventiAvv, setEventiAvv] = useState([])
  // finestra aperta: 'dati' | 'appello' | 'avversari' | null
  const [finestra, setFinestra] = useState(null)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])
  const giocatoriAvversari = useLiveQuery(() => db.giocatoriAvversari.toArray(), [])
  const partiteGirone = useLiveQuery(() => db.partiteGirone.toArray(), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])

  useEffect(() => {
    if (!editing) return
    Promise.all([
      db.matches.get(Number(id)), db.opponents.toArray(), db.giocatoriAvversari.toArray(),
    ]).then(([m, opps, gioc]) => {
      if (m) {
        setForm({ ...EMPTY, ...m, giornata: m.giornata ?? '' })
        setNomeAvversario(opps.find((o) => o.id === m.opponentId)?.nome ?? '')
        setEventiAvv(eventiPerForm(m.eventiAvversari, () => 'avversario', gioc))
      }
      setLoaded(true)
    })
  }, [id, editing])

  if (
    !players || !opponents || !competitions || !giocatoriAvversari || !partiteGirone || !matches || !loaded
  ) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // Stesso appello delle sedute: in modifica restano visibili anche gli
  // inattivi già segnati, per non perdere una presenza registrata quel giorno.
  const convocabili = [
    ...players.filter(isAttivo),
    ...players.filter((p) => !isAttivo(p) && form.presenze[p.id]),
  ].sort((a, b) => ruoloOrdine(a.ruoloNaturale) - ruoloOrdine(b.ruoloNaturale))

  const segna = (pid, stato) =>
    setForm((f) => {
      const next = { ...f.presenze }
      // ritoccare lo stesso stato lo toglie: si esce dall'appello, non si
      // resta bloccati su una scelta fatta per sbaglio
      if (next[pid] === stato) delete next[pid]
      else next[pid] = stato
      return { ...f, presenze: next }
    })

  const tuttiPresenti = () =>
    setForm((f) => ({
      ...f,
      presenze: Object.fromEntries(convocabili.map((p) => [p.id, f.presenze[p.id] ?? 'presente'])),
    }))

  const svuotaAppello = () => set('presenze', {})

  // Cerca l'avversario per nome (senza distinzione di maiuscole) e lo crea se non c'è:
  // così il calendario si popola senza passare da un CRUD avversari, che arriva con M7.
  const risolviAvversario = async (nome) => {
    const pulito = nome.trim()
    if (!pulito) return null
    const esistente = opponents.find(
      (o) => o.nome.trim().toLowerCase() === pulito.toLowerCase()
    )
    if (esistente) return esistente.id
    return db.opponents.add({ nome: pulito })
  }

  const risolviCompetizione = async () => {
    if (!nuovaComp) return form.competitionId
    const pulito = nuovaComp.nome.trim()
    if (!pulito) return form.competitionId
    return db.competitions.add({ nome: pulito, tipo: nuovaComp.tipo })
  }

  const salva = async () => {
    if (!form.data) {
      alert('Serve almeno la data della partita')
      return
    }
    const opponentId = await risolviAvversario(nomeAvversario)
    const eventiAvversari = (await eventiPerDb(eventiAvv, { avversario: opponentId }))
      .map(({ tipo, giocatoreId }) => ({ tipo, giocatoreId }))
    const dati = {
      ...form,
      luogo: form.luogo.trim(),
      note: form.note.trim(),
      opponentId,
      competitionId: await risolviCompetizione(),
      giornata: toGiornata(form.giornata),
      eventiAvversari,
    }
    if (editing) {
      await db.matches.update(Number(id), campiForm(dati))
    } else {
      await db.matches.add(dati)
    }
    navigate(tornaA)
  }

  const elimina = async () => {
    if (!window.confirm('Eliminare questa partita?')) return
    await db.matches.delete(Number(id))
    navigate(tornaA, { replace: true })
  }

  const esito = esitoPartita(form)
  const conteggioPresenze = contaSeduta(form)

  // L'avversario come lo vede il girone: quello scritto nel campo, se esiste già
  const avversarioId = opponents.find(
    (o) => pulisciNome(o.nome).toLowerCase() === pulisciNome(nomeAvversario).toLowerCase()
  )?.id ?? null
  const datiGirone = { partiteGirone, matches, opponents, giocatoriAvversari }
  const scheda = avversarioId != null && !partitaGiocata(form)
    ? {
        bomber: marcatori(null, datiGirone, { tutteLeCompetizioni: true })
          .filter((r) => r.squadraId === avversarioId)
          .slice(0, 3),
        cartellini: cartellini(datiGirone).filter((r) => r.squadraId === avversarioId),
      }
    : null
  const squalificati = scheda?.cartellini.filter((r) => r.daScontare) ?? []
  const diffidati = scheda?.cartellini.filter((r) => r.diffidato) ?? []
  const storti = disallineamentoGirone({ golSubiti: form.golSubiti, eventiAvversari: eventiAvv })

  // Dati anagrafici della partita: in creazione stanno nella pagina (vanno
  // compilati subito), in modifica in una finestra dietro al riepilogo.
  const campiDati = (
    <>
      <div className="field">
        <label>Avversario</label>
        <input
          className="input"
          list="lista-avversari"
          value={nomeAvversario}
          onChange={(e) => setNomeAvversario(e.target.value)}
          placeholder="Es. Real Bovisa"
        />
        <datalist id="lista-avversari">
          {opponents.map((o) => (
            <option key={o.id} value={o.nome} />
          ))}
        </datalist>
        <p className="muted small" style={{ margin: '6px 0 0' }}>
          Se il nome è nuovo viene creata la squadra.
        </p>
      </div>

      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Data</label>
          <input
            className="input"
            type="date"
            value={form.data}
            onChange={(e) => set('data', e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Ora</label>
          <input
            className="input"
            type="time"
            value={form.ora}
            onChange={(e) => set('ora', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Dove si gioca</label>
        <div className="chip-row">
          {CAMPI_PARTITA.map((c) => (
            <button
              key={c.value}
              className={`chip chip-sm ${form.campo === c.value ? 'selected' : ''}`}
              onClick={() => set('campo', c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Campo / indirizzo</label>
        <input
          className="input"
          value={form.luogo}
          onChange={(e) => set('luogo', e.target.value)}
          placeholder="Es. Centro sportivo Bonola, campo 2"
        />
      </div>

      <div className="field">
        <label>Competizione</label>
        {nuovaComp ? (
          <>
            <input
              className="input"
              value={nuovaComp.nome}
              onChange={(e) => setNuovaComp((c) => ({ ...c, nome: e.target.value }))}
              placeholder="Nome della competizione"
            />
            <div className="chip-row" style={{ marginTop: 8 }}>
              {TIPI_COMPETIZIONE.map((t) => (
                <button
                  key={t.value}
                  className={`chip chip-sm ${nuovaComp.tipo === t.value ? 'selected' : ''}`}
                  onClick={() => setNuovaComp((c) => ({ ...c, tipo: t.value }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setNuovaComp(null)}>
              Annulla
            </button>
          </>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Scelta
                titolo="Competizione"
                className="select"
                value={form.competitionId ?? ''}
                onChange={(e) => set('competitionId', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Nessuna —</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Scelta>
            </div>
            <button className="btn btn-sm" onClick={() => setNuovaComp({ nome: '', tipo: 'campionato' })}>
              + Nuova
            </button>
          </div>
        )}
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label>Giornata</label>
        <input
          className="input"
          style={{ width: 110 }}
          type="number"
          min="1"
          inputMode="numeric"
          value={form.giornata}
          onChange={(e) => set('giornata', e.target.value)}
        />
        <p className="muted small" style={{ margin: '6px 0 0' }}>
          Con la competizione, mette la partita nella classifica del Girone.
        </p>
      </div>
    </>
  )

  const nomeCompetizione = nuovaComp?.nome.trim()
    || competitions.find((c) => c.id === form.competitionId)?.nome
  const giustificati = Object.values(form.presenze).filter((x) => x === 'giustificato').length
  const nEventiAvv = eventiAvv.length

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Partita' : 'Nuova partita'}</h1>
      </div>

      {editing ? (
        // Riepilogo: chi, quando, dove e com'è finita. I dati si cambiano
        // dalla finestra, non stanno aperti sotto gli occhi.
        <div className="card partita-riepilogo">
          <div className="row" style={{ gap: 10 }}>
            {esito ? (
              <span className={`badge risultato-grande ${ESITO_INFO[esito].badge}`}>
                {form.golFatti}-{form.golSubiti}
              </span>
            ) : (
              <span className="badge badge-accent">{quandoPartita(form.data) || 'Da giocare'}</span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{nomeAvversario.trim() || 'Avversario da definire'}</strong>
              <div className="muted small">
                {[formatDataPartita(form.data), form.ora, campoPartitaInfo(form.campo).label].filter(Boolean).join(' · ')}
              </div>
              {(nomeCompetizione || form.giornata || form.luogo) && (
                <div className="muted small">
                  {[nomeCompetizione, form.giornata ? `G${form.giornata}` : '', form.luogo].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <button className="btn btn-sm" aria-label="Modifica dati partita" onClick={() => setFinestra('dati')}>✎</button>
          </div>
        </div>
      ) : (
        campiDati
      )}

      {scheda && (scheda.bomber.length > 0 || squalificati.length > 0 || diffidati.length > 0) && (
        <div className="card">
          <strong className="small">Dal girone</strong>
          {scheda.bomber.length > 0 && (
            <div className="small" style={{ marginTop: 6 }}>
              ⚽ {scheda.bomber.map((r) => `${r.nome} ${r.gol}`).join(' · ')}
            </div>
          )}
          {squalificati.length > 0 && (
            <div className="small" style={{ marginTop: 6, color: 'var(--danger)' }}>
              Squalificati: {squalificati.map((r) => `${r.nome} (${r.squalifica.motivo.toLowerCase()})`).join(' · ')}
            </div>
          )}
          {diffidati.length > 0 && (
            <div className="small" style={{ marginTop: 6, color: 'var(--warn)' }}>
              Diffidati: {diffidati.map((r) => r.nome).join(' · ')}
            </div>
          )}
        </div>
      )}

      <div className="section-title">Risultato</div>
      <div className="card row" style={{ gap: 10 }}>
        <input
          className="input risultato-input"
          type="number"
          min="0"
          inputMode="numeric"
          aria-label="Gol fatti"
          placeholder="Noi"
          value={form.golFatti ?? ''}
          onChange={(e) => set('golFatti', toGol(e.target.value))}
        />
        <span className="muted" style={{ fontWeight: 800 }}>–</span>
        <input
          className="input risultato-input"
          type="number"
          min="0"
          inputMode="numeric"
          aria-label="Gol subiti"
          placeholder="Loro"
          value={form.golSubiti ?? ''}
          onChange={(e) => set('golSubiti', toGol(e.target.value))}
        />
        <span className="muted small" style={{ flex: 1, textAlign: 'right' }}>
          {esito ? ESITO_INFO[esito].label : 'Vuoto finché non si gioca'}
        </span>
      </div>

      {/* Le tre cose da fare su una partita, una riga ciascuna: il
          dettaglio si apre in finestra (o nel referto) solo quando serve */}
      <div className="section-title">Compilazione</div>
      <button type="button" className="card tappable partita-voce" onClick={() => setFinestra('appello')}>
        <span className="partita-voce-icona">✅</span>
        <span className="partita-voce-testo">
          <strong>Presenze</strong>
          <span className="muted small">
            {conteggioPresenze.totale === 0
              ? 'Appello da fare'
              : `${conteggioPresenze.presenti} presenti su ${conteggioPresenze.totale}${giustificati ? ` · ${giustificati} giustificati` : ''}`}
          </span>
        </span>
        <span className={`badge ${conteggioPresenze.totale === 0 ? 'badge-warn' : 'badge-ok'}`}>
          {conteggioPresenze.totale === 0 ? 'Da fare' : `${conteggioPresenze.presenti}`}
        </span>
      </button>

      {editing && (
        <button
          type="button"
          className="card tappable partita-voce"
          onClick={() => navigate(`/partite/${id}/referto`, { state: location.state })}
        >
          <span className="partita-voce-icona">📋</span>
          <span className="partita-voce-testo">
            <strong>Referto</strong>
            <span className="muted small">
              {refertoCompilato(form)
                ? `${titolariDi(form).length} schierati · ${(form.eventi ?? []).length} eventi`
                : 'Formazione, cambi, gol e minuti'}
            </span>
          </span>
          <span className={`badge ${refertoCompilato(form) ? 'badge-ok' : 'badge-warn'}`}>
            {refertoCompilato(form) ? 'Fatto' : 'Da fare'}
          </span>
        </button>
      )}

      <button type="button" className="card tappable partita-voce" onClick={() => setFinestra('avversari')}>
        <span className="partita-voce-icona">🟨</span>
        <span className="partita-voce-testo">
          <strong>Marcatori e cartellini avversari</strong>
          <span className="muted small">
            {nEventiAvv === 0
              ? 'Per la classifica marcatori e le squalifiche del girone'
              : eventiAvv.map((e) => e.nome).slice(0, 3).join(', ') + (nEventiAvv > 3 ? '…' : '')}
          </span>
        </span>
        <span className="badge">{nEventiAvv}</span>
      </button>
      {storti && (
        <div className="alert-card" style={{ marginTop: 10 }}>
          {storti[0].eventi} marcatori avversari su {storti[0].risultato ?? 'nessun'} gol subiti:
          controlla prima di salvare, o salva lo stesso.
        </div>
      )}

      <div className="field" style={{ marginTop: 14 }}>
        <label>Note</label>
        <textarea
          className="textarea"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Es. loro giocano a 3 dietro, occhio al 10 mancino…"
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={salva}>
        {editing ? 'Salva modifiche' : 'Crea partita'}
      </button>

      {editing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
          Elimina partita
        </button>
      )}

      {finestra === 'dati' && (
        <Modal titolo="Dati partita" onClose={() => setFinestra(null)}>
          {campiDati}
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => setFinestra(null)}>
            Fatto
          </button>
        </Modal>
      )}

      {finestra === 'appello' && (
        <Modal
          titolo={`Presenze (${conteggioPresenze.presenti}/${conteggioPresenze.totale})`}
          onClose={() => setFinestra(null)}
        >
          <div className="row" style={{ gap: 8, marginBottom: 10 }}>
            <button className="btn btn-sm" onClick={tuttiPresenti}>Tutti presenti</button>
            {conteggioPresenze.totale > 0 && (
              <button className="btn btn-sm" onClick={svuotaAppello}>Svuota</button>
            )}
          </div>
          <AppelloPresenze giocatori={convocabili} presenze={form.presenze} onSegna={segna} />
          <p className="muted small" style={{ margin: '10px 0 0' }}>
            P presente · A assente · G giustificato. I presenti sono i candidati in Modulo e nel referto.
          </p>
          <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={() => setFinestra(null)}>
            Fatto
          </button>
        </Modal>
      )}

      {finestra === 'avversari' && (
        <Modal titolo="Marcatori e cartellini avversari" onClose={() => setFinestra(null)}>
          <EventiAvversari
            eventi={eventiAvv}
            onChange={setEventiAvv}
            lati={[{ key: 'avversario', nome: nomeAvversario, opponentId: avversarioId }]}
            giocatori={giocatoriAvversari}
          />
          <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={() => setFinestra(null)}>
            Fatto
          </button>
        </Modal>
      )}
    </div>
  )
}
