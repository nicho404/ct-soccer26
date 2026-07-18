import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  MODULI_FORMATO, FORMATI, MODULO_DEFAULT, IMPOSTAZIONI, COSTRUZIONI, LINEE_DIFESA,
  costruzioneInfo, lineaDifesaInfo, costruzioneInContrasto, ruoloSlot, inPosizione,
} from '../lib/formazioni'
import { nomeBreve } from '../lib/nomi'
import { famigliaRuolo, isAttivo, ruoloLabel, ruoloTatticoInfo } from '../db/constants'
import PitchView from '../components/PitchView'
import EmptyState from '../components/EmptyState'
import ArrowSelect from '../components/ArrowSelect'
import { IconBall } from '../components/icons'

const VUOTO = (formato) => Array(formato).fill(null)

const DEFAULT_BY_FORMATO = () =>
  Object.fromEntries(FORMATI.map((f) => [f, { modulo: MODULO_DEFAULT[f], slots: VUOTO(f) }]))

export default function ModuloPage() {
  const navigate = useNavigate()
  const [byFormato, setByFormato] = useState(DEFAULT_BY_FORMATO)
  const [impostazione, setImpostazione] = useState('possesso')
  const [costruzione, setCostruzione] = useState('equilibrata')
  const [linea, setLinea] = useState('normale')
  const [sel, setSel] = useState(null)
  const [loaded, setLoaded] = useState(false)
  // ultima riga tattica toccata: solo quella mostra la descrizione,
  // così il pannello resta compatto in un'unica schermata col campo
  const [touched, setTouched] = useState(null)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const intese = useLiveQuery(() => db.intese.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])
  const salvati = useLiveQuery(() => db.meta.get('moduliSalvati').then((s) => s ?? null), [])

  useEffect(() => {
    db.meta.get('modulo').then((m) => {
      const v = m?.value
      if (v) {
        const base = DEFAULT_BY_FORMATO()
        if (v.byFormato) {
          for (const f of FORMATI) {
            const cfg = v.byFormato[f]
            if (!cfg) continue
            if (MODULI_FORMATO[f][cfg.modulo]) base[f].modulo = cfg.modulo
            if (Array.isArray(cfg.slots) && cfg.slots.length === f) base[f].slots = cfg.slots
          }
        } else {
          // dati salvati prima dello switch di formato: erano solo calcio a 7
          if (MODULI_FORMATO[7][v.modulo]) base[7].modulo = v.modulo
          if (Array.isArray(v.slots) && v.slots.length === 7) base[7].slots = v.slots
        }
        setByFormato(base)
        if (IMPOSTAZIONI.some((i) => i.value === v.impostazione)) {
          setImpostazione(v.impostazione)
        }
        if (COSTRUZIONI.some((c) => c.value === v.costruzione)) setCostruzione(v.costruzione)
        if (LINEE_DIFESA.some((l) => l.value === v.linea)) setLinea(v.linea)
      }
      setLoaded(true)
    })
  }, [])

  if (!players || !intese || !loaded || team === undefined || salvati === undefined) return null

  // Il formato arriva dalla configurazione squadra (onboarding/impostazioni):
  // qui si vedono solo i moduli di quel formato
  const formato = FORMATI.includes(team?.formato) ? team.formato : 7
  const listaSalvati = (salvati?.value ?? []).filter((s) => s.formato === formato)

  const persist = (patch = {}) => {
    const value = { impostazione, costruzione, linea, byFormato, ...patch }
    db.meta.put({ key: 'modulo', value })
  }

  const MODULI = MODULI_FORMATO[formato]
  const { modulo: moduloKey, slots } = byFormato[formato]
  const modulo = MODULI[moduloKey]
  const attivi = players.filter(isAttivo)

  const salvaCorrente = async () => {
    const nome = window.prompt('Nome per questo assetto (es. Titolari, Anti-pressing):')
    if (!nome?.trim()) return
    const tutti = salvati?.value ?? []
    const nuovo = {
      id: Date.now(),
      nome: nome.trim(),
      formato,
      modulo: moduloKey,
      slots: [...slots],
      impostazione,
      costruzione,
      linea,
    }
    await db.meta.put({ key: 'moduliSalvati', value: [...tutti, nuovo] })
  }

  const caricaSalvato = (s) => {
    const next = { ...byFormato, [formato]: { modulo: s.modulo, slots: [...s.slots] } }
    const imp = IMPOSTAZIONI.some((i) => i.value === s.impostazione) ? s.impostazione : impostazione
    const cos = COSTRUZIONI.some((c) => c.value === s.costruzione) ? s.costruzione : 'equilibrata'
    const lin = LINEE_DIFESA.some((l) => l.value === s.linea) ? s.linea : 'normale'
    setByFormato(next)
    setImpostazione(imp)
    setCostruzione(cos)
    setLinea(lin)
    setSel(null)
    persist({ byFormato: next, impostazione: imp, costruzione: cos, linea: lin })
  }

  const eliminaSalvato = async (s) => {
    if (!window.confirm(`Eliminare la formazione "${s.nome}"?`)) return
    const tutti = (salvati?.value ?? []).filter((x) => x.id !== s.id)
    await db.meta.put({ key: 'moduliSalvati', value: tutti })
  }

  const cambiaModulo = (key) => {
    const next = { ...byFormato, [formato]: { ...byFormato[formato], modulo: key } }
    setByFormato(next)
    setSel(null)
    persist({ byFormato: next })
  }

  const cambiaImpostazione = (value) => {
    setImpostazione(value)
    persist({ impostazione: value })
  }

  const setSlots2 = (nextSlots) => {
    const next = { ...byFormato, [formato]: { ...byFormato[formato], slots: nextSlots } }
    setByFormato(next)
    persist({ byFormato: next })
  }

  const onSlotTap = (i) => {
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
    setSlots2(VUOTO(formato))
    setSel(null)
  }

  const slotSel = sel !== null ? modulo.slots[sel] : null
  const playerSel = sel !== null && slots[sel] ? players.find((p) => p.id === slots[sel]) : null
  const ruoloRichiesto = slotSel ? ruoloSlot(slotSel, modulo, impostazione) : ''

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
            return (
              fit(a) - fit(b) ||
              (b.titolare === true) - (a.titolare === true) ||
              a.nome.localeCompare(b.nome)
            )
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
          icon={<IconBall />}
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
          <div className="tactics-panel">
            <ArrowSelect
              label="Tattica"
              options={IMPOSTAZIONI}
              value={impostazione}
              showDesc={touched === 'tattica'}
              onChange={(v) => {
                setTouched('tattica')
                cambiaImpostazione(v)
              }}
            />
            <ArrowSelect
              label={`Modulo — calcio a ${formato}`}
              options={Object.entries(MODULI).map(([key, m]) => ({
                value: key,
                label: key,
                descrizione: m.descrizione,
              }))}
              value={moduloKey}
              showDesc={touched === 'modulo'}
              onChange={(v) => {
                setTouched('modulo')
                cambiaModulo(v)
              }}
            />
            <ArrowSelect
              label="Manovra di costruzione"
              options={COSTRUZIONI}
              value={costruzione}
              showDesc={touched === 'costruzione'}
              warning={
                costruzioneInContrasto(impostazione, costruzione)
                  ? `In contrasto con "${IMPOSTAZIONI.find((i) => i.value === impostazione)?.label}": la squadra riceve indicazioni opposte.`
                  : null
              }
              onChange={(v) => {
                setTouched('costruzione')
                setCostruzione(v)
                persist({ costruzione: v })
              }}
            />
            <ArrowSelect
              label="Linea difensiva"
              options={LINEE_DIFESA}
              value={linea}
              showDesc={touched === 'linea'}
              onChange={(v) => {
                setTouched('linea')
                setLinea(v)
                persist({ linea: v })
              }}
            />
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
                <span className="badge badge-accent">{ruoloRichiesto}</span>
                <span className="spacer" />
                {playerSel && (
                  <button className="btn btn-sm btn-danger" onClick={togli}>
                    Togli {nomeBreve(playerSel)}
                  </button>
                )}
              </div>
              {ruoloTatticoInfo(ruoloRichiesto) && (
                <p className="muted small" style={{ margin: '0 0 8px' }}>
                  <span className="en">({ruoloTatticoInfo(ruoloRichiesto).en})</span>{' '}
                  {ruoloTatticoInfo(ruoloRichiesto).descrizione}
                </p>
              )}
              <div className="chip-row">
                {candidati.map((p) => {
                  const ok = inPosizione(p, slotSel.sigla)
                  const fitTattico = ok && (p.ruoliTattici ?? []).includes(ruoloRichiesto)
                  return (
                    <button
                      key={p.id}
                      className="chip chip-sm"
                      style={inCampo.has(p.id) ? { opacity: 0.55 } : undefined}
                      onClick={() => assegna(p.id)}
                    >
                      <span
                        className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                        style={{ marginRight: 6 }}
                      />
                      {p.titolare && <span className="star-on">★ </span>}
                      {nomeBreve(p)}
                      {inCampo.has(p.id) ? ' (in campo)' : ''}
                      {fitTattico && <span className="fit-plus"> +</span>}
                      {!ok && ' ⚠️'}
                    </button>
                  )
                })}
              </div>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                <span className="fit-plus">+</span> = ha il ruolo tattico richiesto · ⚠️ = fuori
                dalle sue posizioni. Tocca un altro slot sul campo per scambiare.
              </p>
            </div>
          ) : (
            <p className="muted small" style={{ margin: '10px 6px 0' }}>
              Tocca una posizione sul campo per schierare, togliere o scambiare un giocatore.
              {panchina.length > 0 && ` In panchina: ${panchina.map(nomeBreve).join(', ')}.`}
            </p>
          )}

          <div className="section-title row" style={{ paddingLeft: 6 }}>
            <span style={{ flex: 1 }}>Gestione squadra</span>
            <button className="btn btn-sm" onClick={salvaCorrente}>+ Salva assetto</button>
          </div>
          {listaSalvati.length === 0 ? (
            <div className="card muted small" style={{ marginLeft: 6, marginRight: 6 }}>
              Salva l'assetto attuale (modulo, undici, tattica, costruzione e linea) con un nome:
              potrai richiamarlo con un tocco, come i piani partita di FC26.
            </div>
          ) : (
            listaSalvati.map((s) => (
              <div className="card" key={s.id} style={{ marginLeft: 6, marginRight: 6 }}>
                <div className="row">
                  <strong>{s.nome}</strong>
                  <span className="badge badge-accent">{s.modulo}</span>
                  <span className="spacer" />
                  <button className="btn btn-sm" onClick={() => caricaSalvato(s)}>Carica</button>
                  <button
                    className="btn btn-sm btn-danger"
                    aria-label={`Elimina assetto ${s.nome}`}
                    onClick={() => eliminaSalvato(s)}
                  >
                    ×
                  </button>
                </div>
                <div className="muted small" style={{ marginTop: 6 }}>
                  {[
                    IMPOSTAZIONI.find((i) => i.value === s.impostazione)?.label,
                    costruzioneInfo(s.costruzione).label,
                    `Linea ${lineaDifesaInfo(s.linea).label.toLowerCase()}`,
                  ].filter(Boolean).join(' · ')}
                  {' · '}
                  {s.slots.filter(Boolean).length}/{s.formato} schierati
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
