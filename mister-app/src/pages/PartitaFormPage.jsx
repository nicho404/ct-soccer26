import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  CAMPI_PARTITA, TIPI_COMPETIZIONE, isAttivo, ruoloOrdine,
} from '../db/constants'
import { oggiISO, esitoPartita, ESITO_INFO } from '../lib/partite'
import { refertoCompilato, titolariDi } from '../lib/storico'
import { contaSeduta } from '../lib/presenze'
import AppelloPresenze from '../components/AppelloPresenze'

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
}

// Il campo numerico del risultato è "vuoto" finché non lo compili:
// '' → null, così partitaGiocata() distingue lo 0-0 dal non giocato.
const toGol = (raw) => {
  if (raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 ? n : null
}

export default function PartitaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const [form, setForm] = useState({ ...EMPTY, data: oggiISO() })
  const [nomeAvversario, setNomeAvversario] = useState('')
  const [nuovaComp, setNuovaComp] = useState(null) // { nome, tipo } quando aperta
  const [loaded, setLoaded] = useState(!editing)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const competitions = useLiveQuery(() => db.competitions.toArray(), [])

  useEffect(() => {
    if (!editing) return
    Promise.all([db.matches.get(Number(id)), db.opponents.toArray()]).then(([m, opps]) => {
      if (m) {
        setForm({ ...EMPTY, ...m })
        setNomeAvversario(opps.find((o) => o.id === m.opponentId)?.nome ?? '')
      }
      setLoaded(true)
    })
  }, [id, editing])

  if (!players || !opponents || !competitions || !loaded) return null

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
    const dati = {
      ...form,
      luogo: form.luogo.trim(),
      note: form.note.trim(),
      opponentId: await risolviAvversario(nomeAvversario),
      competitionId: await risolviCompetizione(),
    }
    if (editing) {
      await db.matches.update(Number(id), dati)
    } else {
      await db.matches.add(dati)
    }
    navigate('/partite')
  }

  const elimina = async () => {
    if (!window.confirm('Eliminare questa partita?')) return
    await db.matches.delete(Number(id))
    navigate('/partite', { replace: true })
  }

  const esito = esitoPartita(form)
  const conteggioPresenze = contaSeduta(form)

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Modifica partita' : 'Nuova partita'}</h1>
      </div>

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
          Se il nome è nuovo viene creata la squadra: lo scouting completo arriva con M7.
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
            <button
              className="btn btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => setNuovaComp(null)}
            >
              Annulla
            </button>
          </>
        ) : (
          <>
            <select
              className="select"
              value={form.competitionId ?? ''}
              onChange={(e) => set('competitionId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Nessuna —</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <button
              className="btn btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => setNuovaComp({ nome: '', tipo: 'campionato' })}
            >
              + Nuova competizione
            </button>
          </>
        )}
      </div>

      <div className="section-title row">
        <span style={{ flex: 1 }}>
          Presenze ({conteggioPresenze.presenti}/{conteggioPresenze.totale})
        </span>
        <button className="btn btn-sm" onClick={tuttiPresenti}>Tutti presenti</button>
      </div>

      <AppelloPresenze giocatori={convocabili} presenze={form.presenze} onSegna={segna} />
      {conteggioPresenze.totale > 0 && (
        <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={svuotaAppello}>
          Svuota appello
        </button>
      )}

      <p className="muted small" style={{ margin: '10px 0 0' }}>
        P presente · A assente · G giustificato. Sono i presenti a comparire come
        candidati in Modulo e nel referto della partita.
      </p>

      <div className="section-title">Risultato</div>
      <div className="card">
        <div className="row" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Gol fatti</label>
            <input
              className="input"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.golFatti ?? ''}
              onChange={(e) => set('golFatti', toGol(e.target.value))}
            />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Gol subiti</label>
            <input
              className="input"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.golSubiti ?? ''}
              onChange={(e) => set('golSubiti', toGol(e.target.value))}
            />
          </div>
        </div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>
          {esito
            ? `${ESITO_INFO[esito].label} ${form.golFatti}-${form.golSubiti}.`
            : 'Lascia vuoto finché la partita non è giocata.'}
        </p>
      </div>

      {editing && (
        <>
          <div className="section-title">Referto</div>
          <div className="card">
            <div className="muted small">
              {refertoCompilato(form)
                ? `${titolariDi(form).length} schierati · ${(form.eventi ?? []).length} eventi registrati.`
                : 'Formazione schierata, marcatori, cambi e minuti giocati.'}
            </div>
            <button
              className="btn btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => navigate(`/partite/${id}/referto`)}
            >
              {refertoCompilato(form) ? 'Apri referto' : '+ Compila referto'}
            </button>
          </div>
        </>
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
    </div>
  )
}
