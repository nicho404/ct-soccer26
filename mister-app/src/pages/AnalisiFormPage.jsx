import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import { oggiISO } from '../lib/partite'
import { TIPI_PUNTO, normalizzaAnalisi, puntiDaTesto, testoDaPunti } from '../lib/analisi'

const EMPTY = {
  titolo: '',
  data: '',
  contesto: '',
  sintesi: '',
  fonte: '',
  puntiChiave: [],
  obiettivi: [],
  // nel form i punti di una sezione sono un testo, uno per riga
  sezioni: [],
}

export default function AnalisiFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const [form, setForm] = useState({ ...EMPTY, data: oggiISO() })
  const [loaded, setLoaded] = useState(!editing)

  useEffect(() => {
    if (!editing) return
    db.analisi.get(Number(id)).then((riga) => {
      if (riga) {
        const a = normalizzaAnalisi(riga)
        setForm({ ...a, sezioni: a.sezioni.map((s) => ({ titolo: s.titolo, testo: testoDaPunti(s.punti) })) })
      }
      setLoaded(true)
    })
  }, [id, editing])

  if (!loaded) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const modifica = (lista, indice, patch) =>
    setForm((f) => ({ ...f, [lista]: f[lista].map((x, i) => (i === indice ? { ...x, ...patch } : x)) }))
  const togli = (lista, indice) =>
    setForm((f) => ({ ...f, [lista]: f[lista].filter((_, i) => i !== indice) }))
  const aggiungi = (lista, voce) => setForm((f) => ({ ...f, [lista]: [...f[lista], voce] }))

  const salva = async () => {
    if (!form.titolo.trim() && !form.sintesi.trim()) {
      alert('Serve almeno un titolo o la sintesi')
      return
    }
    const dati = normalizzaAnalisi({
      titolo: form.titolo.trim(),
      data: form.data,
      contesto: form.contesto.trim(),
      sintesi: form.sintesi.trim(),
      fonte: form.fonte.trim(),
      puntiChiave: form.puntiChiave.map((p) => ({ tipo: p.tipo, testo: p.testo.trim() })),
      obiettivi: form.obiettivi.map((o) => ({ testo: o.testo.trim(), fatto: o.fatto })),
      sezioni: form.sezioni.map((s) => ({ titolo: s.titolo.trim(), punti: puntiDaTesto(s.testo) })),
    })
    if (editing) {
      await db.analisi.update(Number(id), dati)
      navigate(`/analisi/${id}`, { replace: true })
    } else {
      const nuovo = await db.analisi.add(dati)
      navigate(`/analisi/${nuovo}`, { replace: true })
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Modifica analisi' : 'Nuova analisi'}</h1>
      </div>

      <div className="field">
        <label>Titolo</label>
        <input
          className="input"
          value={form.titolo}
          onChange={(e) => set('titolo', e.target.value)}
          placeholder="Es. Punto dopo il girone d'andata"
        />
      </div>

      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="field" style={{ width: 160 }}>
          <label>Data</label>
          <input className="input" type="date" value={form.data} onChange={(e) => set('data', e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 0 }}>
          <label>Contesto</label>
          <input
            className="input"
            value={form.contesto}
            onChange={(e) => set('contesto', e.target.value)}
            placeholder="Es. Campionato · 5 partite"
          />
        </div>
      </div>

      <div className="field">
        <label>Sintesi</label>
        <textarea
          className="textarea"
          value={form.sintesi}
          onChange={(e) => set('sintesi', e.target.value)}
          placeholder="La tesi in due frasi: cosa abbiamo capito e dove andiamo."
        />
      </div>

      <div className="section-title">Punti chiave ({form.puntiChiave.length})</div>
      <p className="muted small" style={{ marginTop: 0 }}>In Home vanno i primi quattro: metti in cima i più importanti.</p>
      {form.puntiChiave.map((p, i) => (
        <div className="card" key={i}>
          <div className="chip-row">
            {TIPI_PUNTO.map((t) => (
              <button
                key={t.value}
                className={`chip chip-sm ${p.tipo === t.value ? 'selected' : ''}`}
                onClick={() => modifica('puntiChiave', i, { tipo: t.value })}
              >
                {t.icona} {t.label}
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <textarea
              className="textarea"
              style={{ flex: 1, minHeight: 60 }}
              value={p.testo}
              onChange={(e) => modifica('puntiChiave', i, { testo: e.target.value })}
            />
            <button className="btn btn-sm" aria-label="Togli punto" onClick={() => togli('puntiChiave', i)}>✕</button>
          </div>
        </div>
      ))}
      <button className="btn btn-block" onClick={() => aggiungi('puntiChiave', { tipo: 'problema', testo: '' })}>
        + Punto chiave
      </button>

      <div className="section-title">Obiettivi ({form.obiettivi.length})</div>
      {form.obiettivi.map((o, i) => (
        <div className="row" key={i} style={{ gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 0 }}
            value={o.testo}
            onChange={(e) => modifica('obiettivi', i, { testo: e.target.value })}
            placeholder="Cosa fare, in concreto"
          />
          <button className="btn btn-sm" aria-label="Togli obiettivo" onClick={() => togli('obiettivi', i)}>✕</button>
        </div>
      ))}
      <button className="btn btn-block" onClick={() => aggiungi('obiettivi', { testo: '', fatto: false })}>
        + Obiettivo
      </button>

      <div className="section-title">Sezioni ({form.sezioni.length})</div>
      <p className="muted small" style={{ marginTop: 0 }}>Rotta tattica, partite, allenamenti… un punto per riga.</p>
      {form.sezioni.map((s, i) => (
        <div className="card" key={i}>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 0 }}
              value={s.titolo}
              onChange={(e) => modifica('sezioni', i, { titolo: e.target.value })}
              placeholder="Titolo della sezione"
            />
            <button className="btn btn-sm" aria-label="Togli sezione" onClick={() => togli('sezioni', i)}>✕</button>
          </div>
          <textarea
            className="textarea"
            style={{ marginTop: 8 }}
            value={s.testo}
            onChange={(e) => modifica('sezioni', i, { testo: e.target.value })}
            placeholder="Un punto per riga"
          />
        </div>
      ))}
      <button className="btn btn-block" onClick={() => aggiungi('sezioni', { titolo: '', testo: '' })}>
        + Sezione
      </button>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Fonte</label>
        <input
          className="input"
          value={form.fonte}
          onChange={(e) => set('fonte', e.target.value)}
          placeholder="Es. note partita e referti"
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={salva}>
        {editing ? 'Salva modifiche' : 'Crea analisi'}
      </button>
    </div>
  )
}
