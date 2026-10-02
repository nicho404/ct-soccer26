import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, convertiSlotRuoliOverride } from '../db/db'
import {
  MODULI_FORMATO, FORMATI, MODULO_DEFAULT, IMPOSTAZIONI, COSTRUZIONI, LINEE_DIFESA,
  costruzioneInfo, lineaDifesaInfo, fuoriRuolo,
} from '../lib/formazioni'
import { nomeBreve } from '../lib/nomi'
import { partiteInProgramma, partiteGiocate, formatDataPartita } from '../lib/partite'
import { presentiIds } from '../lib/presenze'
import { esportaModulo } from '../lib/esportaModulo'
import { famigliaRuolo, isAttivo, incaricoInfo } from '../db/constants'
import { ruoliZona, ruoliNpZona, ruoloInfo, ruoloNpInfo, TRANSIZIONE } from '../tactics/constants'
import {
  risolviRuoli, risolviRuoliNonPossesso, geometriaNonPossesso,
  applicaOverrideRuoli, verificaCoerenza, compatibilitaGiocatore,
} from '../tactics/engine'
import PitchView from '../components/PitchView'
import EmptyState from '../components/EmptyState'
import IncaricoPicker from '../components/IncaricoPicker'
import { IconBall } from '../components/icons'
import Scelta from '../components/Scelta'
import Modal from '../components/Modal'

const VUOTO = (formato) => Array(formato).fill(null)
const OVERRIDE_VUOTO = () => ({ possesso: {}, nonPossesso: {} })

// Perché un cambio previsto scatta: libero abbastanza da coprire i casi reali
// ("dentro Rossi al 60'", "se siamo in vantaggio", "se non ingrana"), il
// dettaglio libero fa il resto.
const TRIGGER_CAMBIO = [
  { value: 'minuto', label: 'Al minuto' },
  { value: 'risultato', label: 'Se il risultato è' },
  { value: 'prestazione', label: 'Se la prestazione è' },
]

const nuovoIdRiga = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_BY_FORMATO = () =>
  Object.fromEntries(
    FORMATI.map((f) => [f, { modulo: MODULO_DEFAULT[f], slots: VUOTO(f), slotRuoliOverride: OVERRIDE_VUOTO(), cambi: {}, incarichi: {} }])
  )

export default function ModuloPage() {
  const navigate = useNavigate()
  const [byFormato, setByFormato] = useState(DEFAULT_BY_FORMATO)
  const [impostazione, setImpostazione] = useState('possesso')
  const [costruzione, setCostruzione] = useState('equilibrata')
  const [linea, setLinea] = useState('normale')
  const [sel, setSel] = useState(null)
  const [loaded, setLoaded] = useState(false)
  // finestra "Tattica" (modulo, impostazione, costruzione, linea) e assetto
  // salvato aperto: il dettaglio si vede solo quando serve
  const [finestraTattica, setFinestraTattica] = useState(false)
  const [assettoAperto, setAssettoAperto] = useState(null)
  const [scegliManuale, setScegliManuale] = useState(false)
  // lente sul campo, non configurazione: non persistita, default possesso
  const [fase, setFase] = useState('possesso')
  const [esitoExport, setEsitoExport] = useState(null)
  // partita selezionata: filtra disponibili/panchina sui presenti; null = tutti gli attivi
  const [matchId, setMatchId] = useState(null)
  // form inline di "+ Salva assetto": null = chiuso
  const [salvaForm, setSalvaForm] = useState(null)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const intese = useLiveQuery(() => db.intese.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])
  const salvati = useLiveQuery(() => db.meta.get('moduliSalvati').then((s) => s ?? null), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])

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
            // normalizza sempre: un record non ancora migrato (o corrotto a
            // mano) non deve mai far crashare il caricamento
            base[f].slotRuoliOverride = convertiSlotRuoliOverride(cfg.slotRuoliOverride)
            if (cfg.cambi && typeof cfg.cambi === 'object') base[f].cambi = cfg.cambi
            if (cfg.incarichi && typeof cfg.incarichi === 'object') base[f].incarichi = cfg.incarichi
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
        if (v.matchId != null) setMatchId(v.matchId)
      }
      setLoaded(true)
    })
  }, [])

  if (!players || !intese || !loaded || team === undefined || salvati === undefined || !matches || !opponents) return null

  // Il formato arriva dalla configurazione squadra (onboarding/impostazioni):
  // qui si vedono solo i moduli di quel formato
  const formato = FORMATI.includes(team?.formato) ? team.formato : 7
  const listaSalvati = (salvati?.value ?? []).filter((s) => s.formato === formato)

  const persist = (patch = {}) => {
    const value = { impostazione, costruzione, linea, byFormato, matchId, ...patch }
    db.meta.put({ key: 'modulo', value })
  }

  const MODULI = MODULI_FORMATO[formato]
  const { modulo: moduloKey, slots, slotRuoliOverride, cambi } = byFormato[formato]
  const incarichi = byFormato[formato].incarichi ?? {}
  const modulo = MODULI[moduloKey]

  // Se è selezionata una partita, disponibili e panchina arrivano da chi era
  // presente (stesso appello delle sedute, non dallo stato attività generico):
  // sono loro a essere in campo o in panchina in quella gara, non "tutti gli
  // attivi" in rosa.
  const matchSelezionata = matches.find((m) => m.id === matchId) ?? null
  const attivi = matchSelezionata
    ? players.filter((p) => presentiIds(matchSelezionata).includes(p.id))
    : players.filter(isAttivo)

  // Motore tattico: un ruolo per fase, con gli override manuali di quella
  // fase sovrapposti sopra il calcolo automatico (mai il contrario). Le due
  // mappe si calcolano sempre entrambe: è lo switch sotto a decidere quale
  // delle due si vede, non quale delle due esiste.
  const ruoliBasePossesso = risolviRuoli({ modulo, impostazione, costruzione })
  const ruoliPossesso = applicaOverrideRuoli(ruoliBasePossesso, slotRuoliOverride?.possesso, ruoloInfo)

  const ruoliBaseNonPossesso = risolviRuoliNonPossesso({ modulo, linea, impostazione })
  const ruoliNonPossesso = applicaOverrideRuoli(ruoliBaseNonPossesso, slotRuoliOverride?.nonPossesso, ruoloNpInfo)

  // "Cambi" pianifica sostituzioni sull'undici titolare: riusa la geometria
  // e i ruoli di possesso, non è una terza mappa tattica.
  const ruoli = fase === 'nonPossesso' ? ruoliNonPossesso : ruoliPossesso
  const coordinatePossesso = modulo.slots.map((s) => ({ u: s.u, t: s.t }))
  const coordinateNonPossesso = geometriaNonPossesso({ modulo, linea })
  const coordinate = fase === 'nonPossesso' ? coordinateNonPossesso : coordinatePossesso

  const coerenza = verificaCoerenza({ impostazione, costruzione, linea, modulo, moduloKey })
  const problemaCostruzione = coerenza.problemi.find((p) => p.tipo === 'costruzione')
  const problemaLinea = coerenza.problemi.find((p) => p.tipo === 'linea')
  const problemaModulo = coerenza.problemi.find((p) => p.tipo === 'modulo')

  // Immagine per i giocatori: campo, posizioni e nomi. Volutamente non passa
  // ruoli, fase, intese o coerenza — quella è la lavagna del mister.
  const esporta = async () => {
    setEsitoExport(null)
    try {
      // legato a una partita: anche la panchina dei convocati e contro chi si gioca
      const esito = await esportaModulo({
        modulo, moduloKey, slots, players, formato, team,
        panchina: matchSelezionata ? panchina : [],
        partita: matchSelezionata
          ? { avversario: nomeAvversarioDi(matchSelezionata), data: formatDataPartita(matchSelezionata.data) }
          : null,
      })
      if (esito !== 'annullata') {
        setEsitoExport(esito === 'condivisa' ? 'Immagine condivisa.' : 'Immagine salvata nei download.')
      }
    } catch {
      setEsitoExport('Non è stato possibile creare l’immagine.')
    }
  }

  // Precompila dai cambi già pianificati sul campo (scheda "Cambi"): senza
  // questo, un cambio impostato lì e mai ritoccato nel form andrebbe perso,
  // perché sono due elenchi distinti (slot->playerId vs righe con trigger).
  const apriSalvaCorrente = () =>
    setSalvaForm({
      nome: '',
      cambiPrevisti: Object.entries(cambi).map(([slotIndex, playerId]) => ({
        id: nuovoIdRiga(),
        escePlayerId: slots[Number(slotIndex)] ?? null,
        entraPlayerId: playerId,
        trigger: 'minuto',
        dettaglio: '',
        slotIndex: null,
      })),
    })

  const aggiungiRigaCambio = () =>
    setSalvaForm((f) => ({
      ...f,
      cambiPrevisti: [
        ...f.cambiPrevisti,
        { id: nuovoIdRiga(), escePlayerId: null, entraPlayerId: null, trigger: 'minuto', dettaglio: '', slotIndex: null },
      ],
    }))

  const modificaRigaCambio = (rid, patch) =>
    setSalvaForm((f) => ({
      ...f,
      cambiPrevisti: f.cambiPrevisti.map((r) => (r.id === rid ? { ...r, ...patch } : r)),
    }))

  const rimuoviRigaCambio = (rid) => {
    if (!window.confirm('Togliere questo cambio previsto?')) return
    setSalvaForm((f) => ({ ...f, cambiPrevisti: f.cambiPrevisti.filter((r) => r.id !== rid) }))
  }

  const confermaSalvaCorrente = async () => {
    const nome = salvaForm.nome.trim()
    if (!nome) return
    const tutti = salvati?.value ?? []
    const nuovo = {
      id: Date.now(),
      nome,
      formato,
      modulo: moduloKey,
      slots: [...slots],
      impostazione,
      costruzione,
      linea,
      slotRuoliOverride: {
        possesso: { ...(slotRuoliOverride?.possesso ?? {}) },
        nonPossesso: { ...(slotRuoliOverride?.nonPossesso ?? {}) },
      },
      incarichi: { ...incarichi },
      // una riga senza chi entra non è un cambio previsto, solo rumore
      cambiPrevisti: salvaForm.cambiPrevisti.filter((r) => r.entraPlayerId != null),
    }
    await db.meta.put({ key: 'moduliSalvati', value: [...tutti, nuovo] })
    setSalvaForm(null)
  }

  const caricaSalvato = (s) => {
    const next = {
      ...byFormato,
      // i cambi previsti sono salvati per giocatore (chi esce/entra), non per
      // slot: si ritrova lo slot cercando dove l'uscente era schierato in
      // *questo* assetto salvato, non in quello attualmente in campo
      [formato]: {
        modulo: s.modulo,
        slots: [...s.slots],
        slotRuoliOverride: convertiSlotRuoliOverride(s.slotRuoliOverride),
        incarichi: s.incarichi && typeof s.incarichi === 'object' ? { ...s.incarichi } : {},
        cambi: Object.fromEntries(
          (s.cambiPrevisti ?? [])
            .map((r) => [s.slots.indexOf(r.escePlayerId), r.entraPlayerId])
            .filter(([idx, entra]) => idx !== -1 && entra != null)
        ),
      },
    }
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
    if (!window.confirm(`Eliminare la formazione "${s.nome}"?`)) return false
    const tutti = (salvati?.value ?? []).filter((x) => x.id !== s.id)
    await db.meta.put({ key: 'moduliSalvati', value: tutti })
    return true
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

  // Un solo setByFormato per aggiornamento: chiamarne due di seguito nello
  // stesso handler farebbe perdere il primo, perché entrambi partirebbero
  // dallo stesso byFormato "stale" prima del re-render.
  const updateFormato = (patch) => {
    const next = { ...byFormato, [formato]: { ...byFormato[formato], ...patch } }
    setByFormato(next)
    persist({ byFormato: next })
    return next
  }

  const setSlots2 = (nextSlots) => updateFormato({ slots: nextSlots })

  const setCambi = (nextCambi) => updateFormato({ cambi: nextCambi })

  // Incarico per fase: per giocatore, non per slot, così segue il giocatore
  // negli scambi e vale anche per chi entra dalla panchina.
  const setIncarico = (playerId, valore) => {
    const next = { ...incarichi }
    if (valore) next[playerId] = valore
    else delete next[playerId]
    updateFormato({ incarichi: next })
  }

  const setOverride = (codice) => {
    if (sel === null) return
    const overrideAttuale = {
      possesso: { ...(byFormato[formato].slotRuoliOverride?.possesso ?? {}) },
      nonPossesso: { ...(byFormato[formato].slotRuoliOverride?.nonPossesso ?? {}) },
    }
    if (codice) overrideAttuale[fase][sel] = codice
    else delete overrideAttuale[fase][sel]
    const next = { ...byFormato, [formato]: { ...byFormato[formato], slotRuoliOverride: overrideAttuale } }
    setByFormato(next)
    setScegliManuale(false)
    persist({ byFormato: next })
  }

  const onSlotTap = (i) => {
    setScegliManuale(false)
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

  // In fase Cambi il tap seleziona soltanto: mai scambiare i titolari in
  // campo, quello resta un gesto esplicito delle altre fasi.
  const onSlotTapCambi = (i) => {
    setSel((cur) => (cur === i ? null : i))
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
    const nextSlots = [...slots]
    nextSlots[sel] = null
    const nextCambi = { ...cambi }
    delete nextCambi[sel]
    updateFormato({ slots: nextSlots, cambi: nextCambi })
    setSel(null)
  }

  const svuota = () => {
    if (!window.confirm('Togliere tutti i giocatori dal campo?')) return
    updateFormato({ slots: VUOTO(formato), cambi: {} })
    setSel(null)
  }

  // Cambi pianificati: un giocatore in panchina entra al posto del titolare
  // nello slot selezionato. Un entrante può essere assegnato a un solo slot
  // alla volta: assegnarlo altrove lo sposta, non lo duplica.
  const assegnaCambio = (playerId) => {
    if (sel === null) return
    const nextCambi = {}
    for (const [k, v] of Object.entries(cambi)) {
      if (v !== playerId) nextCambi[k] = v
    }
    nextCambi[sel] = playerId
    setCambi(nextCambi)
  }

  const rimuoviCambio = () => {
    if (sel === null || cambi[sel] === undefined) return
    if (!window.confirm('Annullare questo cambio pianificato?')) return
    const nextCambi = { ...cambi }
    delete nextCambi[sel]
    setCambi(nextCambi)
  }

  const slotSel = sel !== null ? modulo.slots[sel] : null
  const ruoloSel = sel !== null ? ruoli[sel] : null
  const playerSel = sel !== null && slots[sel] ? players.find((p) => p.id === slots[sel]) : null
  const cambioSel = sel !== null && cambi[sel] != null ? players.find((p) => p.id === cambi[sel]) : null

  // Candidati per lo slot selezionato: prima chi è in posizione, poi chi ha
  // già il ruolo tattico assegnato dal motore
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

  const nomeAvversarioDi = (m) => opponents.find((o) => o.id === m.opponentId)?.nome ?? 'Avversario da definire'
  const opzioniPartita = [
    { value: '__nessuna__', label: 'Tutti gli attivi' },
    ...[...partiteInProgramma(matches), ...partiteGiocate(matches)].map((m) => ({
      value: m.id,
      label: `${nomeAvversarioDi(m)} · ${formatDataPartita(m.data)}`,
    })),
  ]

  const cambiaPartita = (v) => {
    const next = v === '__nessuna__' ? null : v
    setMatchId(next)
    setSel(null)
    persist({ matchId: next })
  }

  const impInfo = IMPOSTAZIONI.find((i) => i.value === impostazione)
  const coerenzaIcona = coerenza.livello === 'ok' ? '🟢' : coerenza.livello === 'rotto' ? '🔴' : '🟡'

  // Una voce della finestra Tattica: le opzioni come pulsanti, sotto la
  // descrizione di quella scelta e l'eventuale problema di coerenza.
  const voceTattica = ({ titolo, opzioni, valore, onScegli, descrizione, problema }) => (
    <div className="field">
      <label>{titolo}</label>
      <div className="chip-row">
        {opzioni.map((o) => (
          <button
            key={o.value}
            className={`chip chip-sm ${valore === o.value ? 'selected' : ''}`}
            onClick={() => onScegli(o.value)}
          >
            {o.icona ? `${o.icona} ` : ''}{o.label}
          </button>
        ))}
      </div>
      {descrizione && <p className="muted small" style={{ margin: '6px 0 0' }}>{descrizione}</p>}
      {problema && <p className="small" style={{ margin: '6px 0 0', color: 'var(--warn)' }}>🟡 {problema}</p>}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>Modulo</h1>
        <button className="btn btn-sm" onClick={svuota}>Svuota</button>
        {attivi.length > 0 && (
          <button className="btn btn-sm" aria-label="Esporta immagine" onClick={esporta}>📷</button>
        )}
      </div>

      {/* Sempre visibile, anche a rosa vuota: altrimenti selezionare una
          partita senza presenti segnati blocca la pagina senza via d'uscita
          se non seguire il link "Vai alla partita". */}
      <div style={{ marginBottom: 8 }}>
        <Scelta
          titolo="Giocatori di quale partita?"
          className="select select-compatta"
          value={matchId ?? '__nessuna__'}
          onChange={(e) => cambiaPartita(e.target.value === '__nessuna__' ? '__nessuna__' : Number(e.target.value))}
        >
          {opzioniPartita.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === '__nessuna__' ? '👥 Tutti gli attivi' : `⚽ ${o.label}`}
            </option>
          ))}
        </Scelta>
      </div>
      {matchSelezionata && (
        <p className="muted small" style={{ margin: '0 0 10px' }}>
          Solo i {presentiIds(matchSelezionata).length} presenti per {nomeAvversarioDi(matchSelezionata)}.
        </p>
      )}

      {attivi.length === 0 ? (
        <EmptyState
          icon={<IconBall />}
          title={matchSelezionata ? 'Nessun presente' : 'Nessun giocatore attivo'}
          text={
            matchSelezionata
              ? `Segna chi era presente alla partita con ${nomeAvversarioDi(matchSelezionata)} per schierarli sul campo.`
              : 'Aggiungi i giocatori alla rosa per schierarli sul campo.'
          }
          action={
            matchSelezionata ? (
              <button className="btn btn-primary" onClick={() => navigate(`/partite/${matchSelezionata.id}`)}>
                Vai alla partita
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate('/rosa/nuovo')}>
                Vai alla rosa
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Assetto in una riga: il modulo si cambia al volo, la tattica
              (impostazione, costruzione, linea) si apre in finestra */}
          <div className="card modulo-assetto">
            <div style={{ width: 92, flexShrink: 0 }}>
              <Scelta
                titolo={`Modulo (calcio a ${formato})`}
                className="select select-compatta"
                value={moduloKey}
                onChange={(e) => cambiaModulo(e.target.value)}
              >
                {Object.keys(MODULI).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </Scelta>
            </div>
            <button
              type="button"
              className="modulo-tattica"
              aria-label="Tattica"
              onClick={() => setFinestraTattica(true)}
            >
              <span aria-hidden="true">{coerenzaIcona}</span>
              <span className="modulo-tattica-testo">
                <strong>{impInfo?.icona} {impInfo?.label}</strong>
                <span className="muted">
                  {costruzioneInfo(costruzione).label} · Linea {lineaDifesaInfo(linea).label.toLowerCase()}
                </span>
              </span>
              <span className="muted">✎</span>
            </button>
          </div>
          {coerenza.livello !== 'ok' && (
            <div className={`coerenza-banner coerenza-banner-${coerenza.livello}`}>
              {coerenza.problemi.map((p, i) => (
                <span key={i}>{coerenza.livello === 'rotto' ? '🔴' : '🟡'} {p.messaggio}</span>
              ))}
            </div>
          )}

          {finestraTattica && (
            <Modal titolo="Tattica" onClose={() => setFinestraTattica(false)}>
              <p className="small" style={{ margin: '0 0 12px' }}>
                {coerenzaIcona}{' '}
                {coerenza.livello === 'ok'
                  ? 'Modulo, impostazione, costruzione e linea sono coerenti.'
                  : 'Qualcosa non torna: vedi gli avvisi sotto le voci.'}
              </p>
              {voceTattica({
                titolo: `Modulo (calcio a ${formato})`,
                opzioni: Object.keys(MODULI).map((k) => ({ value: k, label: k })),
                valore: moduloKey,
                onScegli: cambiaModulo,
                descrizione: modulo.descrizione,
                problema: problemaModulo?.messaggio,
              })}
              {voceTattica({
                titolo: 'Impostazione',
                opzioni: IMPOSTAZIONI,
                valore: impostazione,
                onScegli: cambiaImpostazione,
                descrizione: impInfo?.descrizione,
              })}
              {voceTattica({
                titolo: 'Costruzione',
                opzioni: COSTRUZIONI,
                valore: costruzione,
                onScegli: (v) => { setCostruzione(v); persist({ costruzione: v }) },
                descrizione: costruzioneInfo(costruzione).descrizione,
                problema: problemaCostruzione?.messaggio,
              })}
              {voceTattica({
                titolo: 'Linea difensiva',
                opzioni: LINEE_DIFESA,
                valore: linea,
                onScegli: (v) => { setLinea(v); persist({ linea: v }) },
                descrizione: lineaDifesaInfo(linea).descrizione,
                problema: problemaLinea?.messaggio,
              })}
              <button className="btn btn-primary btn-block" onClick={() => setFinestraTattica(false)}>
                Fatto
              </button>
            </Modal>
          )}

          {/* Switch di fase: lente esclusiva sul campo, mai le due mappe insieme */}
          <div className="schede" role="tablist">
            {[
              { value: 'possesso', label: '⚽ Con palla' },
              { value: 'nonPossesso', label: '🛡️ Senza palla' },
              { value: 'cambi', label: '🔁 Cambi' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={fase === f.value}
                className={`scheda ${fase === f.value ? 'attiva' : ''}`}
                onClick={() => { setFase(f.value); setSel(null); setScegliManuale(false) }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="pitch-wrap">
            <PitchView
              modulo={modulo}
              ruoli={ruoli}
              coordinate={coordinate}
              fase={fase}
              cambi={cambi}
              incarichi={incarichi}
              assignments={slots}
              players={players}
              intese={intese}
              selected={sel}
              onSlotTap={fase === 'cambi' ? onSlotTapCambi : onSlotTap}
              badgeInfo={
                fase === 'possesso'
                  ? IMPOSTAZIONI.find((i) => i.value === impostazione)
                  : fase === 'nonPossesso'
                  ? { icona: '🛡️', label: `Senza palla — linea ${lineaDifesaInfo(linea).label.toLowerCase()}` }
                  : { icona: '🔁', label: 'Cambi pianificati' }
              }
            />
          </div>

          {esitoExport && (
            <p className="muted small" style={{ margin: '0 0 10px' }} onClick={() => setEsitoExport(null)}>
              {esitoExport} L’immagine mostra solo campo, posizioni e nomi: niente indicazioni tattiche.
            </p>
          )}

          {fase === 'nonPossesso' && TRANSIZIONE[impostazione]?.nota && (
            <p className="muted small" style={{ margin: '0 0 10px' }}>
              <strong>Transizione:</strong> {TRANSIZIONE[impostazione].nota}
            </p>
          )}

          {fase === 'cambi' ? (
            slotSel ? (
              <div className="card" style={{ marginTop: 10 }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <strong>
                    {slotSel.sigla} — {playerSel ? nomeBreve(playerSel) : 'vuoto'}
                  </strong>
                  <span className="spacer" />
                  {cambioSel && (
                    <button className="btn btn-sm btn-danger" onClick={rimuoviCambio}>
                      Annulla cambio
                    </button>
                  )}
                </div>
                {!playerSel ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    Schiera prima un titolare in questa posizione (fase "Con palla") per pianificarne la sostituzione.
                  </p>
                ) : (
                  <>
                    <p className="muted small" style={{ margin: '0 0 8px' }}>
                      {cambioSel
                        ? `${nomeBreve(cambioSel)} entra al posto di ${nomeBreve(playerSel)}.`
                        : `Tocca un giocatore dalla panchina per farlo entrare al posto di ${nomeBreve(playerSel)}.`}
                    </p>
                    {cambioSel && (
                      <IncaricoPicker
                        label={`Incarico di ${nomeBreve(cambioSel)}`}
                        value={incarichi[cambioSel.id] ?? null}
                        onChange={(v) => setIncarico(cambioSel.id, v)}
                      />
                    )}
                    <div className="chip-row">
                      {panchina.length === 0 ? (
                        <span className="muted small">Nessun giocatore disponibile in panchina.</span>
                      ) : (
                        panchina.map((p) => (
                          <button
                            key={p.id}
                            className={`chip chip-sm ${cambioSel?.id === p.id ? 'selected' : ''}`}
                            onClick={() => assegnaCambio(p.id)}
                          >
                            <span
                              className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                              style={{ marginRight: 6 }}
                            />
                            {p.titolare && <span className="star-on">★ </span>}
                            {nomeBreve(p)}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="card" style={{ marginTop: 10 }}>
                {Object.keys(cambi).length === 0 ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    Nessun cambio pianificato. Tocca un titolare sul campo per pianificarne la sostituzione.
                    {panchina.length > 0 && ` In panchina: ${panchina.map(nomeBreve).join(', ')}.`}
                  </p>
                ) : (
                  Object.entries(cambi).map(([slotIndex, playerId]) => {
                    const uscente = players.find((p) => p.id === slots[Number(slotIndex)])
                    const entrante = players.find((p) => p.id === playerId)
                    if (!entrante) return null
                    return (
                      <div className="row" key={slotIndex} style={{ marginBottom: 6 }}>
                        <span>
                          {uscente ? nomeBreve(uscente) : modulo.slots[Number(slotIndex)].sigla} → {nomeBreve(entrante)}
                        </span>
                        <span className="spacer" />
                        <button
                          className="btn btn-sm btn-danger"
                          aria-label={`Annulla cambio ${nomeBreve(entrante)}`}
                          onClick={() => {
                            if (!window.confirm(`Annullare il cambio di ${nomeBreve(entrante)}?`)) return
                            const nextCambi = { ...cambi }
                            delete nextCambi[slotIndex]
                            setCambi(nextCambi)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )
          ) : slotSel ? (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <strong>
                  {slotSel.sigla} — {ruoloSel.nome}
                </strong>
                {ruoloSel.manuale && <span className="badge badge-accent">manuale</span>}
                <span className="spacer" />
                {playerSel && (
                  <button className="btn btn-sm btn-danger" onClick={togli}>
                    Togli {nomeBreve(playerSel)}
                  </button>
                )}
              </div>
              {ruoloSel.compito && (
                <p className="muted small" style={{ margin: '0 0 8px' }}>{ruoloSel.compito}</p>
              )}

              {playerSel && (
                <IncaricoPicker
                  label={`Incarico di ${nomeBreve(playerSel)}`}
                  value={incarichi[playerSel.id] ?? null}
                  onChange={(v) => setIncarico(playerSel.id, v)}
                />
              )}

              <div className="row" style={{ marginBottom: 8 }}>
                <button className="btn btn-sm" onClick={() => setScegliManuale(true)}>
                  Ruolo manuale
                </button>
                {ruoloSel.manuale && (
                  <button className="btn btn-sm" onClick={() => setOverride(null)}>
                    Torna automatico
                  </button>
                )}
              </div>
              {scegliManuale && (
                <Modal titolo={`Ruolo manuale — ${slotSel.sigla}`} onClose={() => setScegliManuale(false)}>
                <div className="chip-row">
                  {(fase === 'possesso' ? ruoliZona(ruoloSel.zona) : ruoliNpZona(ruoloSel.zona)).map((r) => (
                    <button
                      key={r.codice}
                      className={`chip chip-sm ${ruoloSel.ruoloSuggerito === r.codice ? 'selected' : ''}`}
                      onClick={() => setOverride(r.codice)}
                    >
                      {r.nome}
                    </button>
                  ))}
                </div>
                </Modal>
              )}

              <div className="chip-row">
                {candidati.map((p) => {
                  const ok = !fuoriRuolo({ player: p, slot: slotSel, ruoloNome: ruoloSel.nome })
                  // il badge di compatibilità confronta contro ruoliTattici
                  // osservati (vocabolario di possesso): in non possesso non
                  // si calcola, non è una svista — vedi PitchView/engine.
                  const compat = fase === 'possesso' && ok
                    ? compatibilitaGiocatore({ slotRuolo: ruoloSel.ruoloSuggerito, player: p })
                    : null
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
                      {compat?.livello === 'naturale' && <span className="fit-plus"> +</span>}
                      {compat?.livello === 'adattabile' && <span className="fit-plus" style={{ color: 'var(--warn)' }}> ~</span>}
                      {!ok && ' ⚠️'}
                    </button>
                  )
                })}
              </div>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                {fase === 'possesso' && (
                  <>
                    <span className="fit-plus">+</span> = ha il ruolo tattico richiesto ·{' '}
                    <span className="fit-plus" style={{ color: 'var(--warn)' }}>~</span> = ruolo adattabile ·{' '}
                  </>
                )}
                ⚠️ = fuori dalle sue posizioni. Tocca un altro slot sul campo per scambiare.
              </p>
            </div>
          ) : (
            <p className="muted small" style={{ margin: '10px 0 0' }}>
              Tocca una posizione sul campo per schierare, togliere o scambiare un giocatore.
              {panchina.length > 0 && ` In panchina: ${panchina.map(nomeBreve).join(', ')}.`}
            </p>
          )}

          <div className="section-title row">
            <span style={{ flex: 1 }}>Assetti salvati ({listaSalvati.length})</span>
            <button className="btn btn-sm" onClick={apriSalvaCorrente}>+ Salva assetto</button>
          </div>

          {salvaForm && (
            <Modal titolo="Salva assetto" onClose={() => setSalvaForm(null)}>
              <div className="field">
                <label>Nome assetto</label>
                <input
                  className="input"
                  value={salvaForm.nome}
                  onChange={(e) => setSalvaForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Es. Titolari, Anti-pressing"
                />
              </div>

              <div className="section-title row" style={{ padding: 0 }}>
                <span style={{ flex: 1 }}>Cambi previsti</span>
                <button className="btn btn-sm" onClick={aggiungiRigaCambio}>+ Aggiungi cambio</button>
              </div>
              {salvaForm.cambiPrevisti.length === 0 && (
                <p className="muted small" style={{ margin: '0 0 8px' }}>
                  Facoltativo: chi esce, chi entra e quando o perché.
                </p>
              )}
              {salvaForm.cambiPrevisti.map((r) => {
                // Cambi volanti: può uscire anche chi è entrato in un'altra
                // riga, e può entrare anche chi è uscito in un'altra riga.
                const altre = salvaForm.cambiPrevisti.filter((x) => x.id !== r.id)
                const titolari = slots.filter(Boolean)
                const esceIds = [...new Set([
                  ...titolari,
                  ...altre.map((x) => x.entraPlayerId).filter((pid) => pid != null),
                ])]
                const entraIds = [...new Set([
                  ...panchina.map((p) => p.id),
                  ...altre.map((x) => x.escePlayerId).filter((pid) => pid != null),
                ])].filter((pid) => pid !== r.escePlayerId)
                const nome = (pid) => nomeBreve(players.find((p) => p.id === pid))
                return (
                <div className="card" key={r.id} style={{ marginBottom: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Scelta
                      titolo="Chi esce"
                      className="select"
                      style={{ flex: 1 }}
                      value={r.escePlayerId ?? ''}
                      onChange={(e) => modificaRigaCambio(r.id, { escePlayerId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Esce — chi?</option>
                      {esceIds.map((pid) => (
                        <option key={pid} value={pid}>{nome(pid)}</option>
                      ))}
                    </Scelta>
                    <Scelta
                      titolo="Chi entra"
                      className="select"
                      style={{ flex: 1 }}
                      value={r.entraPlayerId ?? ''}
                      onChange={(e) => modificaRigaCambio(r.id, { entraPlayerId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Entra — chi?</option>
                      {entraIds.map((pid) => (
                        <option key={pid} value={pid}>{nome(pid)}</option>
                      ))}
                    </Scelta>
                    <button
                      className="btn btn-sm"
                      aria-label="Rimuovi cambio"
                      onClick={() => rimuoviRigaCambio(r.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="chip-row" style={{ marginTop: 8 }}>
                    {TRIGGER_CAMBIO.map((t) => (
                      <button
                        key={t.value}
                        className={`chip chip-sm ${r.trigger === t.value ? 'selected' : ''}`}
                        onClick={() => modificaRigaCambio(r.id, { trigger: t.value })}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input"
                    style={{ marginTop: 8 }}
                    value={r.dettaglio}
                    onChange={(e) => modificaRigaCambio(r.id, { dettaglio: e.target.value })}
                    placeholder="Es. inizio ripresa, se in vantaggio, se prestazione non convince…"
                  />
                  <Scelta
                    titolo="Posizione di chi entra"
                    className="select"
                    style={{ marginTop: 8 }}
                    value={r.slotIndex ?? ''}
                    onChange={(e) => modificaRigaCambio(r.id, { slotIndex: e.target.value !== '' ? Number(e.target.value) : null })}
                  >
                    <option value="">Posizione: al posto di chi esce</option>
                    {modulo.slots.map((sl, i) => (
                      <option key={i} value={i}>
                        Posizione: {sl.sigla}{slots[i] != null ? ` (oggi ${nome(slots[i])})` : ''}
                      </option>
                    ))}
                  </Scelta>
                  {r.entraPlayerId != null && (
                    <div style={{ marginTop: 8 }}>
                      <IncaricoPicker
                        label={`Incarico di ${nome(r.entraPlayerId)}`}
                        value={incarichi[r.entraPlayerId] ?? null}
                        onChange={(v) => setIncarico(r.entraPlayerId, v)}
                      />
                    </div>
                  )}
                </div>
                )
              })}

              <div className="row" style={{ gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={confermaSalvaCorrente}>
                  Salva
                </button>
                <button className="btn" onClick={() => setSalvaForm(null)}>Annulla</button>
              </div>
            </Modal>
          )}

          {listaSalvati.length === 0 ? (
            <div className="card muted small">
              Salva l'assetto attuale (modulo, undici, tattica, costruzione e linea) con un nome:
              potrai richiamarlo con un tocco.
            </div>
          ) : (
            <div className="card referto-cronologia">
              {listaSalvati.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className="incarico-riga"
                  aria-label={`Assetto ${a.nome}`}
                  onClick={() => setAssettoAperto(a.id)}
                >
                  <strong className="incarico-nome">{a.nome}</strong>
                  <span className="badge badge-accent">{a.modulo}</span>
                  {(a.cambiPrevisti ?? []).length > 0 && (
                    <span className="badge" title="Cambi previsti">🔁 {a.cambiPrevisti.length}</span>
                  )}
                  <span className="muted">›</span>
                </button>
              ))}
            </div>
          )}

          {(() => {
            const a = listaSalvati.find((x) => x.id === assettoAperto)
            if (!a) return null
            const nomeDi = (pid) => nomeBreve(players.find((p) => p.id === pid))
            return (
              <Modal titolo={a.nome} onClose={() => setAssettoAperto(null)}>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="badge badge-accent">{a.modulo}</span>
                  <span className="muted small">
                    {[
                      IMPOSTAZIONI.find((i) => i.value === a.impostazione)?.label,
                      costruzioneInfo(a.costruzione).label,
                      `Linea ${lineaDifesaInfo(a.linea).label.toLowerCase()}`,
                      `${a.slots.filter(Boolean).length}/${a.formato} schierati`,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {Object.keys(a.incarichi ?? {}).length > 0 && (
                  <p className="small muted" style={{ margin: '0 0 10px' }}>
                    {Object.entries(a.incarichi)
                      .map(([pid, v]) => {
                        const info = incaricoInfo(v)
                        const pl = players.find((p) => p.id === Number(pid))
                        return pl && info ? `${info.icona} ${nomeBreve(pl)}` : null
                      })
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {(a.cambiPrevisti ?? []).length > 0 && (
                  <>
                    <div className="oss-sezione"><span>Cambi previsti</span></div>
                    {a.cambiPrevisti.map((r) => (
                      <div className="evento-riga" key={r.id}>
                        <span className="evento-icona">🔁</span>
                        <span className="evento-testo">
                          {r.escePlayerId != null ? nomeDi(r.escePlayerId) : '?'} → {nomeDi(r.entraPlayerId)}
                          {r.slotIndex != null && MODULI[a.modulo]?.slots[r.slotIndex]
                            ? ` (${MODULI[a.modulo].slots[r.slotIndex].sigla})`
                            : ''}
                          <span className="muted small" style={{ display: 'block' }}>
                            {TRIGGER_CAMBIO.find((t) => t.value === r.trigger)?.label}
                            {r.dettaglio ? ` · ${r.dettaglio}` : ''}
                          </span>
                        </span>
                      </div>
                    ))}
                  </>
                )}
                <div className="row" style={{ gap: 10, marginTop: 14 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => { caricaSalvato(a); setAssettoAperto(null) }}
                  >
                    Carica in campo
                  </button>
                  <button
                    className="btn btn-danger"
                    aria-label={`Elimina assetto ${a.nome}`}
                    onClick={async () => { if (await eliminaSalvato(a)) setAssettoAperto(null) }}
                  >
                    Elimina
                  </button>
                </div>
              </Modal>
            )
          })()}
        </>
      )}
    </div>
  )
}
