import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { STATI_PRESENZA, famigliaRuolo, isAttivo, ruoloOrdine } from '../db/constants'
import { nomeBreve } from '../lib/nomi'
import { oggiISO } from '../lib/partite'
import { contaSeduta, durataPiano } from '../lib/presenze'

const EMPTY = {
  data: '',
  ora: '',
  tema: '',
  luogo: '',
  presenze: {},
  piano: { obiettivo: '', blocchi: [] },
  note: '',
}

// Sigle dei tre stati sui bottoni dell'appello: la riga deve stare su una
// schermata da telefono accanto al nome.
const SIGLA = { presente: 'P', assente: 'A', giustificato: 'G' }

// id locale al form (non finisce mai su Dexie come chiave): due tap ravvicinati
// cadono nello stesso millisecondo, quindi al timestamp serve una coda casuale
const nuovoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const BLOCCO_VUOTO = () => ({ id: nuovoId(), titolo: '', minuti: 15, note: '' })

export default function SedutaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const [form, setForm] = useState({ ...EMPTY, data: oggiISO() })
  const [loaded, setLoaded] = useState(!editing)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const piani = useLiveQuery(() => db.sessionPlans.toArray(), [])

  useEffect(() => {
    if (!editing) return
    db.trainings.get(Number(id)).then((t) => {
      if (t) {
        setForm({
          ...EMPTY,
          ...t,
          presenze: { ...(t.presenze ?? {}) },
          piano: { obiettivo: t.piano?.obiettivo ?? '', blocchi: [...(t.piano?.blocchi ?? [])] },
        })
      }
      setLoaded(true)
    })
  }, [id, editing])

  if (!players || !piani || !loaded) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // All'appello va la rosa attiva. In modifica restano visibili anche gli
  // inattivi già segnati: un giocatore può uscire dalla rosa dopo la seduta,
  // ma quel giorno c'era e la sua presenza non va persa.
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

  // --- piano seduta ---------------------------------------------------------

  const setPiano = (patch) => setForm((f) => ({ ...f, piano: { ...f.piano, ...patch } }))

  const aggiungiBlocco = () => setPiano({ blocchi: [...form.piano.blocchi, BLOCCO_VUOTO()] })

  const modificaBlocco = (bid, patch) =>
    setPiano({
      blocchi: form.piano.blocchi.map((b) => (b.id === bid ? { ...b, ...patch } : b)),
    })

  const eliminaBlocco = (bid) =>
    setPiano({ blocchi: form.piano.blocchi.filter((b) => b.id !== bid) })

  const caricaModello = (m) =>
    setPiano({
      obiettivo: m.obiettivo ?? '',
      // id nuovi: i blocchi del modello e quelli della seduta sono copie
      // indipendenti, modificarne una non tocca l'altra
      blocchi: (m.blocchi ?? []).map((b) => ({ ...b, id: nuovoId() })),
    })

  const salvaComeModello = async () => {
    if (form.piano.blocchi.length === 0) {
      alert('Aggiungi almeno un blocco prima di salvare il modello')
      return
    }
    const nome = window.prompt('Nome del modello (es. Seduta pre-partita):', form.tema)
    if (!nome?.trim()) return
    await db.sessionPlans.add({
      nome: nome.trim(),
      isTemplate: true,
      obiettivo: form.piano.obiettivo,
      blocchi: form.piano.blocchi.map(({ id: _id, ...b }) => b),
    })
  }

  // --- salvataggio ----------------------------------------------------------

  const salva = async () => {
    if (!form.data) {
      alert('Serve almeno la data della seduta')
      return
    }
    const dati = {
      ...form,
      tema: form.tema.trim(),
      luogo: form.luogo.trim(),
      note: form.note.trim(),
      piano: { ...form.piano, obiettivo: form.piano.obiettivo.trim() },
    }
    if (editing) {
      await db.trainings.update(Number(id), dati)
    } else {
      await db.trainings.add(dati)
    }
    navigate('/presenze')
  }

  const elimina = async () => {
    if (!window.confirm('Eliminare questa seduta?')) return
    await db.trainings.delete(Number(id))
    navigate('/presenze', { replace: true })
  }

  const conteggio = contaSeduta(form)
  const modelli = piani.filter((p) => p.isTemplate)
  const minutiPiano = durataPiano(form.piano)

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Modifica seduta' : 'Nuova seduta'}</h1>
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
        <label>Tema della seduta</label>
        <input
          className="input"
          value={form.tema}
          onChange={(e) => set('tema', e.target.value)}
          placeholder="Es. Uscita dal pressing"
        />
      </div>

      <div className="field">
        <label>Campo</label>
        <input
          className="input"
          value={form.luogo}
          onChange={(e) => set('luogo', e.target.value)}
          placeholder="Es. CS Bonola, campo 2"
        />
      </div>

      <div className="section-title row">
        <span style={{ flex: 1 }}>
          Appello ({conteggio.presenti}/{conteggio.totale})
        </span>
        <button className="btn btn-sm" onClick={tuttiPresenti}>Tutti presenti</button>
      </div>

      <div className="card">
        {convocabili.map((p) => (
          <div className="crit-row" key={p.id}>
            <div className="crit-label">
              <span
                className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                style={{ marginRight: 6 }}
              />
              {nomeBreve(p)}
            </div>
            <div className="vote-row">
              {STATI_PRESENZA.map((s) => (
                <button
                  key={s.value}
                  className={`vote-btn ${form.presenze[p.id] === s.value ? 'on' : ''}`}
                  aria-label={`${nomeBreve(p)}: ${s.label}`}
                  onClick={() => segna(p.id, s.value)}
                >
                  {SIGLA[s.value]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {convocabili.length === 0 && (
          <div className="muted small">Nessun giocatore attivo in rosa.</div>
        )}
        {conteggio.totale > 0 && (
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={svuotaAppello}>
            Svuota appello
          </button>
        )}
      </div>

      <p className="muted small">
        P presente · A assente · G giustificato. Chi resta senza scelta non entra
        nelle statistiche: quel giorno non era in rosa.
      </p>

      <div className="section-title row">
        <span style={{ flex: 1 }}>
          Piano{minutiPiano > 0 ? ` (${minutiPiano}′)` : ''}
        </span>
        {form.piano.blocchi.length > 0 && (
          <button className="btn btn-sm" onClick={salvaComeModello}>Salva modello</button>
        )}
      </div>

      {modelli.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {modelli.map((m) => (
            <button key={m.id} className="chip chip-sm" onClick={() => caricaModello(m)}>
              {m.nome}
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <label>Obiettivo</label>
        <input
          className="input"
          value={form.piano.obiettivo}
          onChange={(e) => setPiano({ obiettivo: e.target.value })}
          placeholder="Es. accorciare le distanze tra i reparti"
        />
      </div>

      {form.piano.blocchi.map((b) => (
        <div className="card" key={b.id}>
          <div className="row" style={{ gap: 10 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              value={b.titolo}
              onChange={(e) => modificaBlocco(b.id, { titolo: e.target.value })}
              placeholder="Es. Torello 5v2"
            />
            <input
              className="input"
              style={{ width: 72 }}
              type="number"
              min="0"
              inputMode="numeric"
              value={b.minuti}
              onChange={(e) => modificaBlocco(b.id, { minuti: Number(e.target.value) || 0 })}
            />
            <button className="btn btn-sm" aria-label="Elimina blocco" onClick={() => eliminaBlocco(b.id)}>
              ✕
            </button>
          </div>
          <textarea
            className="textarea"
            style={{ marginTop: 8 }}
            value={b.note}
            onChange={(e) => modificaBlocco(b.id, { note: e.target.value })}
            placeholder="Regole, spazi, varianti…"
          />
        </div>
      ))}

      <button className="btn btn-block" onClick={aggiungiBlocco}>+ Aggiungi blocco</button>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Note della seduta</label>
        <textarea
          className="textarea"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Com'è andata, chi stava bene, cosa riprendere…"
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={salva}>
        {editing ? 'Salva modifiche' : 'Crea seduta'}
      </button>

      {editing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
          Elimina seduta
        </button>
      )}
    </div>
  )
}
