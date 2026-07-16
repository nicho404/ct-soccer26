import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { MODULI, IMPOSTAZIONI, ruoloSlot, inPosizione } from '../lib/formazioni'
import { famigliaRuolo, isAttivo, ruoloLabel, ruoloTatticoInfo } from '../db/constants'
import PitchView from '../components/PitchView'
import EmptyState from '../components/EmptyState'

const VUOTO = () => Array(7).fill(null)

export default function ModuloPage() {
  const navigate = useNavigate()
  const [moduloKey, setModuloKey] = useState('2-3-1')
  const [impostazione, setImpostazione] = useState('possesso')
  const [slots, setSlots] = useState(VUOTO())
  const [sel, setSel] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [infoModulo, setInfoModulo] = useState(null)
  const [infoRuolo, setInfoRuolo] = useState(false)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const intese = useLiveQuery(() => db.intese.toArray(), [])

  useEffect(() => {
    db.meta.get('modulo').then((m) => {
      if (m?.value) {
        if (MODULI[m.value.modulo]) setModuloKey(m.value.modulo)
        if (IMPOSTAZIONI.some((i) => i.value === m.value.impostazione)) {
          setImpostazione(m.value.impostazione)
        }
        if (Array.isArray(m.value.slots) && m.value.slots.length === 7) {
          setSlots(m.value.slots)
        }
      }
      setLoaded(true)
    })
  }, [])

  const persist = (patch = {}) => {
    const value = { modulo: moduloKey, impostazione, slots, ...patch }
    db.meta.put({ key: 'modulo', value })
  }

  if (!players || !intese || !loaded) return null

  const modulo = MODULI[moduloKey]
  const attivi = players.filter(isAttivo)

  const cambiaModulo = (key) => {
    setModuloKey(key)
    setSel(null)
    persist({ modulo: key })
  }

  const cambiaImpostazione = (value) => {
    setImpostazione(value)
    persist({ impostazione: value })
  }

  const setSlots2 = (next) => {
    setSlots(next)
    persist({ slots: next })
  }

  const onSlotTap = (i) => {
    setInfoRuolo(false)
    if (sel === null) {
      setSel(i)
      return
    }
    if (sel === i) {
      setSel(null)
      return
    }
    // secondo tocco su un altro slot: sposta o scambia se il primo era occupato
    if (slots[sel] != null) {
      const next = [...slots]
      ;[next[sel], next[i]] = [next[i], next[sel]]
      setSlots2(next)
      setSel(null)
    } else {
      setSel(i)
    }
  }

  const assegna = (playerId) => {
    if (sel === null) return
    const next = [...slots]
    const gia = next.indexOf(playerId)
    if (gia !== -1) next[gia] = next[sel] // scambio se già in campo
    next[sel] = playerId
    setSlots2(next)
    setSel(null)
  }

  const togli = () => {
    if (sel === null) return
    const next = [...slots]
    next[sel] = null
    setSlots2(next)
    setSel(null)
  }

  const svuota = () => {
    if (!window.confirm('Togliere tutti i giocatori dal campo?')) return
    setSlots2(VUOTO())
    setSel(null)
  }

  const slotSel = sel !== null ? modulo.slots[sel] : null
  const playerSel = sel !== null && slots[sel] ? players.find((p) => p.id === slots[sel]) : null

  // Candidati per lo slot selezionato: prima chi è in posizione
  const candidati =
    slotSel === null
      ? []
      : [...attivi]
          .sort((a, b) => {
            const fit = (p) =>
              p.ruoloNaturale === slotSel.sigla ? 0
              : (p.ruoliAdattati ?? []).includes(slotSel.sigla) ? 1
              : famigliaRuolo(p.ruoloNaturale) === famigliaRuolo(slotSel.sigla) ? 2
              : 3
            return fit(a) - fit(b) || a.nome.localeCompare(b.nome)
          })
          .filter((p) => p.id !== slots[sel])

  const inCampo = new Set(slots.filter(Boolean))
  const panchina = attivi.filter((p) => !inCampo.has(p.id))

  return (
    <div className="page" style={{ paddingLeft: 10, paddingRight: 10 }}>
      <div className="page-header" style={{ paddingLeft: 6 }}>
        <h1>Modulo</h1>
        <button className="btn btn-sm" onClick={svuota}>Svuota</button>
      </div>

      {attivi.length === 0 ? (
        <EmptyState
          icon="⚽"
          title="Nessun giocatore attivo"
          text="Aggiungi i giocatori alla rosa per schierarli sul campo."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>
              Vai alla rosa
            </button>
          }
        />
      ) : (
        <>
          <div className="chip-row" style={{ marginBottom: 8, paddingLeft: 6 }}>
            {Object.keys(MODULI).map((key) => (
              <button
                key={key}
                className={`chip chip-sm ${moduloKey === key ? 'selected' : ''}`}
                onClick={() => cambiaModulo(key)}
              >
                {key}
                <span
                  className="chip-info"
                  role="button"
                  aria-label={`Info sul modulo ${key}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfoModulo((v) => (v === key ? null : key))
                  }}
                >
                  ?
                </span>
              </button>
            ))}
          </div>
          {infoModulo && MODULI[infoModulo] && (
            <div className="info-pop" style={{ marginBottom: 8 }} onClick={() => setInfoModulo(null)}>
              <strong>{infoModulo}</strong>
              <p>{MODULI[infoModulo].descrizione}</p>
            </div>
          )}
          <div className="chip-row" style={{ marginBottom: 10, paddingLeft: 6 }}>
            {IMPOSTAZIONI.map((imp) => (
              <button
                key={imp.value}
                className={`chip chip-sm ${impostazione === imp.value ? 'selected' : ''}`}
                onClick={() => cambiaImpostazione(imp.value)}
              >
                {imp.icona} {imp.label}
              </button>
            ))}
          </div>

          <div className="pitch-wrap">
            <PitchView
              modulo={modulo}
              impostazione={impostazione}
              assignments={slots}
              players={players}
              intese={intese}
              selected={sel}
              onSlotTap={onSlotTap}
            />
          </div>

          {slotSel ? (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <strong>
                  {slotSel.sigla} — {ruoloLabel(slotSel.sigla)}
                </strong>
                <span className="badge badge-accent">{ruoloSlot(slotSel.sigla, impostazione)}</span>
                <span
                  className="chip-info"
                  role="button"
                  aria-label={`Info sul ruolo ${ruoloSlot(slotSel.sigla, impostazione)}`}
                  onClick={() => setInfoRuolo((v) => !v)}
                >
                  ?
                </span>
                <span className="spacer" />
                {playerSel && (
                  <button className="btn btn-sm btn-danger" onClick={togli}>
                    Togli {playerSel.soprannome || playerSel.nome.split(' ')[0]}
                  </button>
                )}
              </div>
              {infoRuolo && ruoloTatticoInfo(ruoloSlot(slotSel.sigla, impostazione)) && (
                <div className="info-pop" style={{ marginBottom: 8 }} onClick={() => setInfoRuolo(false)}>
                  <strong>{ruoloSlot(slotSel.sigla, impostazione)}</strong>{' '}
                  <span className="en">({ruoloTatticoInfo(ruoloSlot(slotSel.sigla, impostazione)).en})</span>
                  <p>{ruoloTatticoInfo(ruoloSlot(slotSel.sigla, impostazione)).descrizione}</p>
                </div>
              )}
              <div className="chip-row">
                {candidati.map((p) => {
                  const ok = inPosizione(p, slotSel.sigla)
                  return (
                    <button
                      key={p.id}
                      className={`chip chip-sm ${inCampo.has(p.id) ? '' : ''}`}
                      style={inCampo.has(p.id) ? { opacity: 0.55 } : undefined}
                      onClick={() => assegna(p.id)}
                    >
                      <span
                        className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                        style={{ marginRight: 6 }}
                      />
                      {p.soprannome || p.nome.split(' ')[0]}
                      {inCampo.has(p.id) ? ' (in campo)' : ''}
                      {!ok && ' ⚠️'}
                    </button>
                  )
                })}
              </div>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                ⚠️ = fuori dalle sue posizioni. Tocca un altro slot sul campo per scambiare.
              </p>
            </div>
          ) : (
            <p className="muted small" style={{ margin: '10px 6px 0' }}>
              Tocca una posizione sul campo per schierare, togliere o scambiare un giocatore.
              {panchina.length > 0 && ` In panchina: ${panchina.map((p) => p.soprannome || p.nome.split(' ')[0]).join(', ')}.`}
            </p>
          )}
        </>
      )}
    </div>
  )
}
