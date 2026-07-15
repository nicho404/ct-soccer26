import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import {
  RUOLI, RUOLI_TATTICI, ruoloLabel, famigliaRuolo, famigliaRuoloTattico, ruoloTatticoInfo,
  PIEDI, TESSERAMENTO, STATI_ATTIVITA, PORTA, CALCI_FISSI,
} from '../db/constants'

const EMPTY = {
  nome: '',
  soprannome: '',
  numero: '',
  ruoloNaturale: '',
  ruoliAdattati: [],
  ruoliTattici: [],
  piede: 'destro',
  altezza: '',
  statoAttivita: 'sicuro',
  acciaccato: false,
  condizione: '',
  tesseramento: 'da_verificare',
  porta: 'no',
  calciFissi: [],
  note: '',
}

export default function PlayerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!editing)
  const [infoRuolo, setInfoRuolo] = useState(null)

  useEffect(() => {
    if (!editing) return
    db.players.get(Number(id)).then((p) => {
      if (p) setForm({ ...EMPTY, ...p })
      setLoaded(true)
    })
  }, [id, editing])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleInList = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))

  // Ruoli tattici raggruppati per posizione del giocatore (naturale + coperture),
  // come su FC26. Un ruolo condiviso tra più posizioni appare solo nel primo gruppo.
  const posizioniGiocatore = [form.ruoloNaturale, ...form.ruoliAdattati].filter(Boolean)
  const gruppiTattici = []
  const ruoliVisti = new Set()
  for (const pos of posizioniGiocatore) {
    const ruoli = RUOLI_TATTICI.filter(
      (r) => r.posizioni.includes(pos) && !ruoliVisti.has(r.value)
    )
    if (ruoli.length === 0) continue
    ruoli.forEach((r) => ruoliVisti.add(r.value))
    gruppiTattici.push({ pos, ruoli })
  }
  // Ruoli selezionati che non appartengono più alle posizioni attuali:
  // restano visibili per poterli togliere
  const ruoliOrfani = form.ruoliTattici.filter((v) => !ruoliVisti.has(v))

  const save = async () => {
    if (!form.nome.trim()) {
      alert('Il nome è obbligatorio')
      return
    }
    const data = {
      ...form,
      nome: form.nome.trim(),
      soprannome: form.soprannome.trim(),
      numero: form.numero === '' ? '' : Number(form.numero),
      altezza: form.altezza === '' ? '' : Number(form.altezza),
    }
    if (editing) {
      await db.players.update(Number(id), data)
      navigate(`/rosa/${id}`)
    } else {
      const newId = await db.players.add(data)
      navigate(`/rosa/${newId}`, { replace: true })
    }
  }

  if (!loaded) return null

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>{editing ? 'Modifica giocatore' : 'Nuovo giocatore'}</h1>
      </div>

      <div className="field">
        <label>Nome *</label>
        <input
          className="input"
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Nome e cognome"
        />
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Soprannome</label>
          <input
            className="input"
            value={form.soprannome}
            onChange={(e) => set('soprannome', e.target.value)}
            placeholder="In campo"
          />
        </div>
        <div className="field" style={{ width: 90 }}>
          <label>Maglia</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="1"
            max="99"
            value={form.numero}
            onChange={(e) => set('numero', e.target.value)}
            placeholder="N°"
          />
        </div>
      </div>

      <div className="field">
        <label>Posizione naturale</label>
        <div className="chip-row">
          {RUOLI.map((r) => (
            <button
              key={r.value}
              title={r.label}
              className={`chip chip-sm pos-sigla pos-${r.famiglia} ${form.ruoloNaturale === r.value ? 'selected' : ''}`}
              onClick={() => set('ruoloNaturale', r.value)}
            >
              {r.value}
            </button>
          ))}
        </div>
        {form.ruoloNaturale && (
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            {form.ruoloNaturale} — {ruoloLabel(form.ruoloNaturale)}
          </p>
        )}
      </div>

      <div className="field">
        <label>Può coprire (posizioni all'occorrenza)</label>
        <div className="chip-row">
          {RUOLI.filter((r) => r.value !== form.ruoloNaturale).map((r) => (
            <button
              key={r.value}
              title={r.label}
              className={`chip chip-sm pos-sigla pos-${r.famiglia} ${form.ruoliAdattati.includes(r.value) ? 'selected' : ''}`}
              onClick={() => toggleInList('ruoliAdattati', r.value)}
            >
              {r.value}
            </button>
          ))}
        </div>
        {form.ruoliAdattati.length > 0 && (
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            {form.ruoliAdattati.map((v) => `${v} — ${ruoloLabel(v)}`).join(' · ')}
          </p>
        )}
      </div>

      <div className="field">
        <label>Ruoli tattici FC26 (anche più di uno)</label>
        {gruppiTattici.length === 0 && ruoliOrfani.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            Scegli prima la posizione naturale: qui compariranno i ruoli tattici di quella
            posizione (e di quelle che può coprire).
          </p>
        ) : (
          <>
            {gruppiTattici.map(({ pos, ruoli }) => (
              <div key={pos} style={{ marginBottom: 10 }}>
                <div className="muted small" style={{ marginBottom: 4 }}>
                  <strong>{pos}</strong> — {ruoloLabel(pos)}
                </div>
                <div className="chip-row">
                  {ruoli.map((r) => (
                    <button
                      key={r.value}
                      className={`chip chip-sm pos-${famigliaRuolo(pos)} ${form.ruoliTattici.includes(r.value) ? 'selected' : ''}`}
                      onClick={() => toggleInList('ruoliTattici', r.value)}
                    >
                      {form.ruoliTattici.includes(r.value) ? '✓ ' : ''}{r.value}
                      <span
                        className="chip-info"
                        role="button"
                        aria-label={`Info su ${r.value}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setInfoRuolo((v) => (v === r.value ? null : r.value))
                        }}
                      >
                        ?
                      </span>
                    </button>
                  ))}
                </div>
                {infoRuolo && ruoli.some((r) => r.value === infoRuolo) && (
                  <div className="info-pop" onClick={() => setInfoRuolo(null)}>
                    <strong>{infoRuolo}</strong>{' '}
                    <span className="en">({ruoloTatticoInfo(infoRuolo)?.en})</span>
                    <p>{ruoloTatticoInfo(infoRuolo)?.descrizione}</p>
                  </div>
                )}
              </div>
            ))}
            {ruoliOrfani.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div className="muted small" style={{ marginBottom: 4 }}>
                  Fuori dalle posizioni attuali (tocca per rimuovere)
                </div>
                <div className="chip-row">
                  {ruoliOrfani.map((v) => (
                    <button
                      key={v}
                      className={`chip chip-sm pos-${famigliaRuoloTattico(v)} selected`}
                      onClick={() => toggleInList('ruoliTattici', v)}
                    >
                      ✓ {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Piede preferito</label>
          <div className="chip-row">
            {PIEDI.map((p) => (
              <button
                key={p.value}
                className={`chip chip-sm ${form.piede === p.value ? 'selected' : ''}`}
                onClick={() => set('piede', p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field" style={{ width: 110 }}>
          <label>Altezza (cm)</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="100"
            max="230"
            value={form.altezza}
            onChange={(e) => set('altezza', e.target.value)}
            placeholder="cm"
          />
        </div>
      </div>

      <div className="field">
        <label>Stato attività (rosa attiva vs allargata)</label>
        <div className="chip-row">
          {STATI_ATTIVITA.map((s) => (
            <button
              key={s.value}
              className={`chip chip-sm ${form.statoAttivita === s.value ? 'selected' : ''}`}
              onClick={() => set('statoAttivita', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Disponibile in porta</label>
        <div className="chip-row">
          {PORTA.map((p) => (
            <button
              key={p.value}
              className={`chip chip-sm ${form.porta === p.value ? 'selected' : ''}`}
              onClick={() => set('porta', p.value)}
            >
              🧤 {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Calci fissi (incaricato di)</label>
        <div className="chip-row">
          {CALCI_FISSI.map((c) => (
            <button
              key={c.key}
              className={`chip chip-sm ${form.calciFissi.includes(c.key) ? 'selected' : ''}`}
              onClick={() => toggleInList('calciFissi', c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="switch-row">
          <span className="label">🩹 Acciaccato</span>
          <button
            className={`toggle ${form.acciaccato ? 'on' : ''}`}
            aria-label="Acciaccato"
            onClick={() => set('acciaccato', !form.acciaccato)}
          />
        </div>
      </div>

      <div className="field">
        <label>Condizione fisica (note)</label>
        <textarea
          className="textarea"
          value={form.condizione}
          onChange={(e) => set('condizione', e.target.value)}
          placeholder="Es. fastidio al polpaccio, rientra la prossima settimana…"
        />
      </div>

      <div className="field">
        <label>Tesseramento CSI</label>
        <div className="chip-row">
          {TESSERAMENTO.map((t) => (
            <button
              key={t.value}
              className={`chip chip-sm ${form.tesseramento === t.value ? 'selected' : ''}`}
              onClick={() => set('tesseramento', t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Note libere</label>
        <textarea
          className="textarea"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Caratteristiche, storia, cose da ricordare…"
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={save}>
        {editing ? 'Salva modifiche' : 'Aggiungi alla rosa'}
      </button>
    </div>
  )
}
