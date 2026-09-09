import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import { CATEGORIE_MANUALE } from '../db/constants'

const EMPTY = { categoria: 'tattica', titolo: '', testo: '' }

export default function ManualeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!editing)

  useEffect(() => {
    if (!editing) return
    db.manualEntries.get(Number(id)).then((v) => {
      if (v) setForm({ ...EMPTY, ...v })
      setLoaded(true)
    })
  }, [id, editing])

  if (!loaded) return null

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const salva = async () => {
    if (!form.titolo.trim()) {
      alert('Serve un titolo: è quello che ritrovi nella lista')
      return
    }
    const dati = { ...form, titolo: form.titolo.trim(), testo: form.testo.trim() }
    if (editing) {
      await db.manualEntries.update(Number(id), dati)
    } else {
      await db.manualEntries.add(dati)
    }
    navigate('/manuale')
  }

  const elimina = async () => {
    if (!window.confirm('Eliminare questa voce del manuale?')) return
    await db.manualEntries.delete(Number(id))
    navigate('/manuale', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Modifica voce' : 'Nuova voce'}</h1>
      </div>

      <div className="field">
        <label>Categoria</label>
        <div className="chip-row">
          {CATEGORIE_MANUALE.map((c) => (
            <button
              key={c.value}
              className={`chip chip-sm ${form.categoria === c.value ? 'selected' : ''}`}
              onClick={() => set('categoria', c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Titolo</label>
        <input
          className="input"
          value={form.titolo}
          onChange={(e) => set('titolo', e.target.value)}
          placeholder="Es. Come usciamo dal pressing alto"
        />
      </div>

      <div className="field">
        <label>Testo</label>
        <textarea
          className="textarea"
          style={{ minHeight: 220 }}
          value={form.testo}
          onChange={(e) => set('testo', e.target.value)}
          placeholder="Scrivi come parleresti alla squadra: principio, quando vale, cosa fare se non funziona."
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={salva}>
        {editing ? 'Salva modifiche' : 'Crea voce'}
      </button>

      {editing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
          Elimina voce
        </button>
      )}
    </div>
  )
}
