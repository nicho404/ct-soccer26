import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { RUOLI } from '../db/constants'
import { MODULI_FORMATO, FORMATI } from '../lib/formazioni'
import { partiteContro, bilancio, esitoPartita, ESITO_INFO, formatDataPartita } from '../lib/partite'

const EMPTY = {
  nome: '',
  moduloAbituale: '',
  stile: '',
  pericolosi: [],
  note: '',
}

const nuovoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const PERICOLOSO_VUOTO = () => ({ id: nuovoId(), nome: '', numero: '', ruolo: '', nota: '' })

export default function AvversarioFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const opponentId = editing ? Number(id) : null
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!editing)

  const partite = useLiveQuery(() => db.matches.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])

  useEffect(() => {
    if (!editing) return
    db.opponents.get(opponentId).then((o) => {
      if (o) {
        setForm({
          ...EMPTY,
          ...o,
          pericolosi: (o.pericolosi ?? []).map((p) => ({ ...p, id: p.id ?? nuovoId() })),
        })
      }
      setLoaded(true)
    })
  }, [opponentId, editing])

  if (!partite || team === undefined || !loaded) return null

  const formato = FORMATI.includes(team?.formato) ? team.formato : 7
  const moduli = Object.keys(MODULI_FORMATO[formato])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const modificaPericoloso = (pid, patch) =>
    setForm((f) => ({
      ...f,
      pericolosi: f.pericolosi.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
    }))

  const eliminaPericoloso = (pid) =>
    setForm((f) => ({ ...f, pericolosi: f.pericolosi.filter((p) => p.id !== pid) }))

  const salva = async () => {
    if (!form.nome.trim()) {
      alert('Serve il nome della squadra')
      return
    }
    const dati = {
      ...form,
      nome: form.nome.trim(),
      stile: form.stile.trim(),
      note: form.note.trim(),
      pericolosi: form.pericolosi
        .filter((p) => p.nome.trim() || p.numero !== '' || p.nota.trim())
        .map((p) => ({ ...p, nome: p.nome.trim(), nota: p.nota.trim() })),
    }
    if (editing) {
      await db.opponents.update(opponentId, dati)
    } else {
      await db.opponents.add(dati)
    }
    navigate('/avversari')
  }

  const scontri = editing ? partiteContro(partite, opponentId) : []

  const elimina = async () => {
    // La partita punta all'avversario per id: cancellarlo lascerebbe in
    // calendario partite senza nome. Prima si sganciano le partite.
    if (scontri.length > 0) {
      alert(
        `${form.nome} è collegata a ${scontri.length} partite in calendario. ` +
        'Cambia o elimina quelle partite prima di eliminare la squadra.'
      )
      return
    }
    if (!window.confirm(`Eliminare ${form.nome}?`)) return
    await db.opponents.delete(opponentId)
    navigate('/avversari', { replace: true })
  }

  const b = bilancio(scontri)

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? form.nome || 'Squadra' : 'Nuova squadra'}</h1>
      </div>

      <div className="field">
        <label>Nome</label>
        <input
          className="input"
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Es. Real Bovisa"
        />
      </div>

      <div className="field">
        <label>Modulo abituale</label>
        <div className="chip-row">
          {moduli.map((m) => (
            <button
              key={m}
              className={`chip chip-sm ${form.moduloAbituale === m ? 'selected' : ''}`}
              onClick={() => set('moduloAbituale', form.moduloAbituale === m ? '' : m)}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ margin: '6px 0 0' }}>
          Moduli del calcio a {formato}: tocca di nuovo per togliere la scelta.
        </p>
      </div>

      <div className="field">
        <label>Come giocano</label>
        <textarea
          className="textarea"
          value={form.stile}
          onChange={(e) => set('stile', e.target.value)}
          placeholder="Es. difesa alta e pressing sul portatore, ripartenze sull'esterno sinistro…"
        />
      </div>

      <div className="section-title row">
        <span style={{ flex: 1 }}>Giocatori pericolosi ({form.pericolosi.length})</span>
      </div>

      {form.pericolosi.map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ gap: 10 }}>
            <input
              className="input"
              style={{ width: 62 }}
              value={p.numero}
              onChange={(e) => modificaPericoloso(p.id, { numero: e.target.value })}
              placeholder="N°"
              inputMode="numeric"
            />
            <input
              className="input"
              style={{ flex: 1 }}
              value={p.nome}
              onChange={(e) => modificaPericoloso(p.id, { nome: e.target.value })}
              placeholder="Nome o segno particolare"
            />
            <button
              className="btn btn-sm"
              aria-label="Elimina giocatore"
              onClick={() => eliminaPericoloso(p.id)}
            >
              ✕
            </button>
          </div>
          <div className="chip-row" style={{ marginTop: 8 }}>
            {RUOLI.map((r) => (
              <button
                key={r.value}
                className={`chip chip-sm pos-sigla pos-${r.famiglia} ${p.ruolo === r.value ? 'selected' : ''}`}
                onClick={() => modificaPericoloso(p.id, { ruolo: p.ruolo === r.value ? '' : r.value })}
              >
                {r.value}
              </button>
            ))}
          </div>
          <textarea
            className="textarea"
            style={{ marginTop: 8 }}
            value={p.nota}
            onChange={(e) => modificaPericoloso(p.id, { nota: e.target.value })}
            placeholder="Come lo fermi: piede forte, dove taglia, chi lo prende…"
          />
        </div>
      ))}

      <button
        className="btn btn-block"
        onClick={() => setForm((f) => ({ ...f, pericolosi: [...f.pericolosi, PERICOLOSO_VUOTO()] }))}
      >
        + Aggiungi giocatore
      </button>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Note</label>
        <textarea
          className="textarea"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Campo, arbitri, clima, precedenti…"
        />
      </div>

      {editing && scontri.length > 0 && (
        <>
          <div className="section-title">
            Scontri diretti {b.giocate > 0 && `(${b.vinte}V ${b.pari}N ${b.perse}P)`}
          </div>
          {scontri.map((m) => {
            const esito = esitoPartita(m)
            return (
              <Link to={`/partite/${m.id}`} className="card tappable" key={m.id}>
                <div className="row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong className="small">{formatDataPartita(m.data)}</strong>
                    <div className="muted small">{m.campo === 'trasferta' ? 'Trasferta' : 'Casa'}</div>
                  </div>
                  {esito ? (
                    <span className={`badge ${ESITO_INFO[esito].badge}`}>
                      {m.golFatti}-{m.golSubiti}
                    </span>
                  ) : (
                    <span className="badge badge-accent">In programma</span>
                  )}
                </div>
              </Link>
            )
          })}
        </>
      )}

      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={salva}>
        {editing ? 'Salva modifiche' : 'Crea squadra'}
      </button>

      {editing && (
        <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={elimina}>
          Elimina squadra
        </button>
      )}
    </div>
  )
}
