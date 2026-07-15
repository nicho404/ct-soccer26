import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { TIPI_INTESA, famigliaRuolo, isAttivo } from '../db/constants'

const EMPTY = {
  playerIds: [],
  tipo: 'potenziale',
  descrizione: '',
  fonte: '',
}

export default function IntesaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const editing = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!editing)

  const players = useLiveQuery(() => db.players.toArray(), [])

  useEffect(() => {
    if (!editing) {
      const pre = Number(searchParams.get('player'))
      if (pre) setForm((f) => ({ ...f, playerIds: [pre] }))
      return
    }
    db.intese.get(Number(id)).then((i) => {
      if (i) setForm({ ...EMPTY, ...i })
      setLoaded(true)
    })
    // searchParams intenzionalmente fuori dalle dipendenze: serve solo al primo render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  if (!players || !loaded) return null

  const attivi = players.filter(isAttivo)
  // In modifica mostra anche eventuali giocatori inattivi già coinvolti
  const selezionabili = [
    ...attivi,
    ...players.filter((p) => !isAttivo(p) && form.playerIds.includes(p.id)),
  ]

  const togglePlayer = (pid) =>
    setForm((f) => ({
      ...f,
      playerIds: f.playerIds.includes(pid)
        ? f.playerIds.filter((x) => x !== pid)
        : [...f.playerIds, pid],
    }))

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const salva = async () => {
    if (form.playerIds.length < 2) {
      alert('Un\'intesa coinvolge almeno 2 giocatori')
      return
    }
    const data = { ...form, descrizione: form.descrizione.trim(), fonte: form.fonte.trim() }
    if (editing) {
      await db.intese.update(Number(id), data)
    } else {
      await db.intese.add(data)
    }
    navigate('/intese')
  }

  const elimina = async () => {
    if (!window.confirm('Eliminare questa intesa?')) return
    await db.intese.delete(Number(id))
    navigate('/intese', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Modifica intesa' : 'Nuova intesa'}</h1>
      </div>

      <div className="field">
        <label>Giocatori coinvolti (almeno 2 — anche 3-4 per le catene)</label>
        <div className="chip-row">
          {selezionabili.map((p) => (
            <button
              key={p.id}
              className={`chip chip-sm ${form.playerIds.includes(p.id) ? 'selected' : ''}`}
              onClick={() => togglePlayer(p.id)}
            >
              <span
                className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                style={{ marginRight: 6 }}
              />
              {p.soprannome || p.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Tipo</label>
        <div className="chip-row">
          {TIPI_INTESA.map((t) => (
            <button
              key={t.value}
              className={`chip chip-sm ${form.tipo === t.value ? 'selected' : ''}`}
              onClick={() => set('tipo', t.value)}
            >
              <span
                className="role-dot"
                style={{ background: t.colore, marginRight: 6 }}
              />
              {t.label}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ margin: '6px 0 0' }}>
          Il colore è quello della linea disegnata sul campo nel builder formazione.
        </p>
      </div>

      <div className="field">
        <label>Cosa fanno bene insieme</label>
        <textarea
          className="textarea"
          value={form.descrizione}
          onChange={(e) => set('descrizione', e.target.value)}
          placeholder="Es. si cercano sull'uno-due, triangolo corto per uscire dal pressing…"
        />
      </div>

      <div className="field">
        <label>Fonte (dove l'hai vista)</label>
        <input
          className="input"
          value={form.fonte}
          onChange={(e) => set('fonte', e.target.value)}
          placeholder="Es. partitella del 20/7, allenamento, storica…"
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={salva}>
        {editing ? 'Salva modifiche' : 'Crea intesa'}
      </button>

      {editing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
          Elimina intesa
        </button>
      )}
    </div>
  )
}
