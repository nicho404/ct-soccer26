import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { TIPI_EVENTO, tipoEventoInfo, famigliaRuolo, incaricoInfo } from '../db/constants'
import { MODULI_FORMATO, FORMATI, MODULO_DEFAULT } from '../lib/formazioni'
import { risolviRuoli } from '../tactics/engine'
import { nomeBreve } from '../lib/nomi'
import { formatDataPartita } from '../lib/partite'
import {
  DURATA_DEFAULT, calcolaMinuti, portiereIniziale, golDaEventi, disallineamentoRisultato,
  occupantiPerSlot, campoAlMinuto, espulsiAlMinuto, eventiIncoerenti,
} from '../lib/storico'
import { presentiIds } from '../lib/presenze'
import PitchView from '../components/PitchView'
import IncaricoPicker from '../components/IncaricoPicker'
import Scelta from '../components/Scelta'
import Modal from '../components/Modal'

const VUOTO = (n) => Array(n).fill(null)

// La formazione del referto è uno scatto storico: modulo, slot e la tattica
// con cui sono stati calcolati i ruoli. Gli override manuali del builder non
// entrano — il referto registra chi ha giocato dove, non la messa a punto.
const TATTICA_DEFAULT = { impostazione: 'possesso', costruzione: 'equilibrata', linea: 'normale' }

export default function PartitaRefertoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const partitaId = Number(id)

  const [moduloKey, setModuloKey] = useState(null)
  const [slots, setSlots] = useState([])
  const [tattica, setTattica] = useState(TATTICA_DEFAULT)
  const [durata, setDurata] = useState(DURATA_DEFAULT)
  const [eventi, setEventi] = useState([])
  const [incarichi, setIncarichi] = useState({}) // playerId -> incarico per fase
  // playerId -> incarico davvero svolto in campo, da confrontare con quello
  // assegnato: non è un voto, è la lettura di come ha interpretato la gara
  const [svolti, setSvolti] = useState({})
  const [sel, setSel] = useState(null)
  const [bozza, setBozza] = useState(null) // evento in composizione
  const [loaded, setLoaded] = useState(false)
  // "Osserva in diretta": formazione bloccata, il tap apre un'osservazione
  // invece di editare lo slot — separato per non rischiare di spostare un
  // giocatore mentre si sta solo guardando la partita da bordo campo.
  const [modoLive, setModoLive] = useState(false)

  // ?? null distingue "partita assente" da "query in corso": senza, il
  // referto di una partita cancellata resterebbe su schermo vuoto per sempre
  const partita = useLiveQuery(
    () => db.matches.get(partitaId).then((m) => m ?? null),
    [partitaId]
  )
  const players = useLiveQuery(() => db.players.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])
  const salvati = useLiveQuery(() => db.meta.get('moduliSalvati').then((s) => s ?? null), [])
  const moduloCorrente = useLiveQuery(() => db.meta.get('modulo').then((m) => m ?? null), [])

  const formato = FORMATI.includes(team?.formato) ? team.formato : 7

  useEffect(() => {
    if (loaded || partita === undefined || team === undefined) return
    const f = partita?.formazione
    const fmt = FORMATI.includes(team?.formato) ? team.formato : 7
    const key = f?.modulo && MODULI_FORMATO[fmt][f.modulo] ? f.modulo : MODULO_DEFAULT[fmt]
    setModuloKey(key)
    setSlots(
      Array.isArray(f?.slots) && f.slots.length === fmt ? [...f.slots] : VUOTO(fmt)
    )
    setTattica({
      impostazione: f?.impostazione ?? TATTICA_DEFAULT.impostazione,
      costruzione: f?.costruzione ?? TATTICA_DEFAULT.costruzione,
      linea: f?.linea ?? TATTICA_DEFAULT.linea,
    })
    setDurata(partita?.durata ?? DURATA_DEFAULT)
    setEventi(Array.isArray(partita?.eventi) ? [...partita.eventi] : [])
    setIncarichi(f?.incarichi && typeof f.incarichi === 'object' ? { ...f.incarichi } : {})
    setSvolti(f?.incarichiSvolti && typeof f.incarichiSvolti === 'object' ? { ...f.incarichiSvolti } : {})
    setLoaded(true)
  }, [partita, team, loaded])

  if (!players || !opponents || partita === undefined || team === undefined ||
      salvati === undefined || moduloCorrente === undefined || !loaded) return null

  if (!partita) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" aria-label="Indietro" onClick={() => navigate('/partite')}>‹</button>
          <h1>Referto</h1>
        </div>
        <div className="card muted small">Questa partita non esiste più.</div>
      </div>
    )
  }

  const MODULI = MODULI_FORMATO[formato]
  const modulo = MODULI[moduloKey] ?? MODULI[MODULO_DEFAULT[formato]]
  const sigle = modulo.slots.map((s) => s.sigla)
  const ruoli = risolviRuoli({ modulo, ...tattica })
  const avversario = opponents.find((o) => o.id === partita.opponentId)?.nome

  const giocatoreDi = (pid) => players.find((p) => p.id === pid)
  const nomeDi = (pid) => (pid == null ? '—' : nomeBreve(giocatoreDi(pid)))

  // Candidati: chi era segnato presente per questa partita (stesso appello
  // delle sedute). Se non è stato compilato, i candidati restano vuoti — è
  // un banner sopra a dirlo, non un ripiego silenzioso sull'intera rosa.
  const presenti = players.filter((p) => presentiIds(partita).includes(p.id))
  const inCampo = slots.filter(Boolean)

  const assegna = (pid) => {
    if (sel == null) return
    setSlots((s) => {
      const next = [...s]
      // un giocatore sta in un solo slot: se era altrove, si sposta
      const precedente = next.indexOf(pid)
      if (precedente !== -1) next[precedente] = null
      next[sel] = pid
      return next
    })
    setSel(null)
  }

  const svuotaSlot = () => {
    if (sel == null) return
    setSlots((s) => s.map((x, i) => (i === sel ? null : x)))
    setSel(null)
  }

  // Chi gioca davvero in quello slot ORA, non chi vi era stato schierato
  // all'inizio: dopo un cambio loggato negli eventi è il subentrato, non il
  // titolare originale — stessa logica di lib/storico.occupantiPerSlot,
  // applicata allo stato in editing invece che a un referto già salvato.
  const apriOsservazione = (i) => {
    const occ = occupantiPerSlot({ formazione: { slots, modulo: moduloKey }, eventi }, modulo)
      .find((s) => s.slotIndex === i)
    const playerId = occ?.playerIds.at(-1)
    if (playerId == null) return
    navigate(`/osservazione?matchId=${partitaId}&playerId=${playerId}`)
  }

  const caricaAssetto = (a) => {
    if (!MODULI[a.modulo]) return
    setModuloKey(a.modulo)
    // tiene solo i giocatori che erano davvero presenti a questa partita
    const ammessi = new Set(presenti.map((p) => p.id))
    setSlots(a.slots.map((pid) => (pid != null && ammessi.has(pid) ? pid : null)))
    setIncarichi(Object.fromEntries(
      Object.entries(a.incarichi ?? {}).filter(([pid]) => ammessi.has(Number(pid)))
    ))
    setTattica({
      impostazione: a.impostazione ?? TATTICA_DEFAULT.impostazione,
      costruzione: a.costruzione ?? TATTICA_DEFAULT.costruzione,
      linea: a.linea ?? TATTICA_DEFAULT.linea,
    })
    setSel(null)
  }

  const assettoCorrente = moduloCorrente?.value?.byFormato?.[formato]
  const listaSalvati = (salvati?.value ?? []).filter((s) => s.formato === formato)

  const cambiaModulo = (key) => {
    setModuloKey(key)
    setSlots((s) => {
      const next = VUOTO(formato)
      for (let i = 0; i < Math.min(s.length, formato); i += 1) next[i] = s[i]
      return next
    })
    setSel(null)
  }

  const aggiornaMappa = (setter) => (pid, valore) =>
    setter((m) => {
      const next = { ...m }
      if (valore) next[pid] = valore
      else delete next[pid]
      return next
    })
  const setIncarico = aggiornaMappa(setIncarichi)
  const setSvolto = aggiornaMappa(setSvolti)

  // --- eventi ---------------------------------------------------------------

  // Chi è in campo al minuto dell'evento in composizione, dopo tutti gli
  // eventi già registrati fino a quel minuto: "esce" si sceglie tra loro,
  // "entra" tra tutti gli altri presenti — compreso chi era uscito prima
  // (cambi volanti), escluso chi è stato espulso.
  const campoBozza = bozza ? campoAlMinuto(slots, eventi, bozza.minuto) : slots
  const inCampoBozza = campoBozza.filter(Boolean)
  const espulsiBozza = bozza ? espulsiAlMinuto(eventi, bozza.minuto) : new Set()
  const disponibiliBozza = presenti.filter(
    (p) => !inCampoBozza.includes(p.id) && !espulsiBozza.has(p.id)
  )
  const etichettaSlot = (i) => `${sigle[i]} — ${campoBozza[i] != null ? nomeDi(campoBozza[i]) : 'libero'}`

  const aggiungiEvento = () => {
    if (!bozza) return
    const info = tipoEventoInfo(bozza.tipo)
    if (info.conGiocatore && bozza.playerId == null) {
      alert('Scegli il giocatore')
      return
    }
    if (info.conCambio && bozza.outId == null && bozza.inId == null) {
      alert('Indica chi esce, chi entra o entrambi')
      return
    }
    if (info.conCambio && bozza.outId != null && !inCampoBozza.includes(bozza.outId)) {
      alert(`${nomeDi(bozza.outId)} non è in campo al ${bozza.minuto}′`)
      return
    }
    if (info.conCambio && bozza.inId != null && inCampoBozza.includes(bozza.inId)) {
      alert(`${nomeDi(bozza.inId)} è già in campo al ${bozza.minuto}′`)
      return
    }
    if (info.conCambio && bozza.inId != null && espulsiBozza.has(bozza.inId)) {
      alert(`${nomeDi(bozza.inId)} è stato espulso prima del ${bozza.minuto}′`)
      return
    }
    if (info.conSpostamento && (bozza.playerId == null || bozza.slotIndex == null)) {
      alert('Scegli il giocatore e la nuova posizione')
      return
    }
    if (info.conSpostamento && !inCampoBozza.includes(bozza.playerId)) {
      alert(`${nomeDi(bozza.playerId)} non è in campo al ${bozza.minuto}′`)
      return
    }
    const { incarico, ...ev } = bozza
    if (info.conCambio && ev.inId != null && incarico !== undefined) setIncarico(ev.inId, incarico)
    setEventi((e) => [...e, { ...ev, id: Date.now() }])
    setBozza(null)
  }

  const eliminaEvento = (evId) => setEventi((e) => e.filter((x) => x.id !== evId))

  const eventiOrdinati = [...eventi].sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0))
  // ricalcolato a ogni modifica: se si ritocca la formazione iniziale dopo
  // aver registrato i cambi, gli eventi che non tornano più si vedono subito
  const incoerenti = eventiIncoerenti(slots, eventi, nomeDi)

  // Chi ha giocato, nell'ordine in cui è sceso in campo: titolari, poi
  // subentrati. È l'elenco su cui si segnano incarico assegnato e svolto.
  const hannoGiocato = [...new Set([
    ...slots.filter(Boolean),
    ...eventiOrdinati.filter((ev) => ev.tipo === 'cambio' && ev.inId != null).map((ev) => ev.inId),
  ])]

  const descriviEvento = (ev) => {
    const dove = ev.slotIndex != null && sigle[ev.slotIndex] ? ` (${sigle[ev.slotIndex]})` : ''
    if (ev.tipo === 'cambio') {
      return `${nomeDi(ev.outId)} → ${nomeDi(ev.inId)}${dove}`
    }
    if (ev.tipo === 'spostamento') return `${nomeDi(ev.playerId)} va in${dove || ' —'}`
    if (ev.tipo === 'golSubito') return 'Gol degli avversari'
    const base = nomeDi(ev.playerId)
    return ev.assistId != null ? `${base} (assist ${nomeDi(ev.assistId)})` : base
  }

  // --- salvataggio ----------------------------------------------------------

  const salva = async () => {
    const titolari = slots.filter(Boolean)
    if (titolari.length === 0) {
      alert('Schiera almeno un giocatore: senza formazione non ci sono minuti da calcolare')
      return
    }
    const { minuti, portaMinuti } = calcolaMinuti({
      titolari,
      eventi,
      durata,
      portiereIniziale: portiereIniziale({ slots }, sigle),
      slots,
      slotPortiere: sigle.indexOf('POR'),
    })
    // incarichi solo di chi ha giocato: un titolare tolto dallo slot non
    // si porta dietro l'incarico nel referto salvato
    const giocato = new Set([...titolari, ...Object.keys(minuti).map(Number)])
    const soloGiocato = (mappa) =>
      Object.fromEntries(Object.entries(mappa).filter(([pid]) => giocato.has(Number(pid))))
    await db.matches.update(partitaId, {
      formazione: {
        formato, modulo: moduloKey, slots: [...slots], ...tattica,
        incarichi: soloGiocato(incarichi),
        incarichiSvolti: soloGiocato(svolti),
      },
      durata,
      eventi,
      minuti,
      portaMinuti,
    })
    // la scheda partita riceve lo stesso `state`: sa ancora dove tornare
    navigate(`/partite/${partitaId}`, { state: location.state })
  }

  const allineaRisultato = async () => {
    const { fatti, subiti } = golDaEventi(eventi)
    await db.matches.update(partitaId, { golFatti: fatti, golSubiti: subiti })
  }

  const disallineato = disallineamentoRisultato({ ...partita, eventi })
  const daEventi = golDaEventi(eventi)

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" aria-label="Indietro" onClick={() => navigate(-1)}>‹</button>
        <h1>Referto</h1>
      </div>

      <div className="card">
        <div className="row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{avversario || 'Avversario da definire'}</strong>
            <div className="muted small">{formatDataPartita(partita.data)}</div>
          </div>
          <span className="badge badge-accent">{daEventi.fatti}-{daEventi.subiti}</span>
        </div>
      </div>

      {disallineato && (
        <div className="alert-card">
          <span>⚖️</span>
          <span>
            Il risultato segnato è {disallineato.risultato.fatti}-{disallineato.risultato.subiti},
            gli eventi dicono {disallineato.eventi.fatti}-{disallineato.eventi.subiti}.
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={allineaRisultato}>
              Usa il conto degli eventi
            </button>
          </span>
        </div>
      )}

      {presenti.length === 0 && (
        <div className="alert-card">
          <span>⚠️</span>
          <span>
            Nessun giocatore segnato presente per questa partita: qui non compare nessun candidato.
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => navigate(`/partite/${partitaId}`)}>
              Segna le presenze
            </button>
          </span>
        </div>
      )}

      <div className="section-title">Formazione schierata</div>

      <div className="chip-row" style={{ marginBottom: 8 }}>
        <button
          className={`chip chip-sm ${!modoLive ? 'selected' : ''}`}
          onClick={() => { setModoLive(false); setSel(null) }}
        >
          ✏️ Modifica formazione
        </button>
        <button
          className={`chip chip-sm ${modoLive ? 'selected' : ''}`}
          onClick={() => { setModoLive(true); setSel(null) }}
        >
          👁️ Osserva in diretta
        </button>
      </div>

      {!modoLive && (
        <div className="chip-row">
          {Object.keys(MODULI).map((key) => (
            <button
              key={key}
              className={`chip chip-sm ${moduloKey === key ? 'selected' : ''}`}
              onClick={() => cambiaModulo(key)}
            >
              {key}
            </button>
          ))}
        </div>
      )}

      <PitchView
        modulo={modulo}
        ruoli={ruoli}
        assignments={slots}
        players={players}
        intese={[]}
        incarichi={incarichi}
        selected={sel}
        onSlotTap={modoLive ? apriOsservazione : (i) => setSel(sel === i ? null : i)}
      />

      {modoLive ? (
        <p className="muted small">
          Tocca un giocatore in campo per aprire la sua osservazione. Formazione bloccata.
        </p>
      ) : sel == null ? (
        <p className="muted small">
          Tocca uno slot sul campo per assegnarlo. {inCampo.length}/{formato} schierati.
        </p>
      ) : (
        <div className="field">
          <label>Chi ha giocato {sigle[sel]}?</label>
          <div className="chip-row">
            {presenti.map((p) => (
              <button
                key={p.id}
                className={`chip chip-sm ${slots[sel] === p.id ? 'selected' : ''}`}
                onClick={() => assegna(p.id)}
              >
                <span
                  className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`}
                  style={{ marginRight: 6 }}
                />
                {nomeBreve(p)}
              </button>
            ))}
          </div>
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={svuotaSlot}>
            Lascia vuoto
          </button>
          {slots[sel] != null && (
            <div style={{ marginTop: 12 }}>
              <IncaricoPicker
                label={`Incarico di ${nomeDi(slots[sel])}`}
                value={incarichi[slots[sel]] ?? null}
                onChange={(v) => setIncarico(slots[sel], v)}
              />
            </div>
          )}
        </div>
      )}

      {(assettoCorrente || listaSalvati.length > 0) && (
        <div className="card">
          <div className="muted small" style={{ marginBottom: 8 }}>
            Parti da un assetto già pronto:
          </div>
          <div className="chip-row">
            {assettoCorrente && (
              <button
                className="chip chip-sm"
                onClick={() => caricaAssetto({ ...moduloCorrente.value, ...assettoCorrente })}
              >
                Modulo attuale
              </button>
            )}
            {listaSalvati.map((s) => (
              <button key={s.id} className="chip chip-sm" onClick={() => caricaAssetto(s)}>
                {s.nome}
              </button>
            ))}
          </div>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            Chi non era presente resta fuori: lo slot arriva vuoto.
          </p>
        </div>
      )}

      <div className="section-title">Durata</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Minuti totali di gioco</label>
          <input
            className="input"
            type="number"
            min="1"
            inputMode="numeric"
            value={durata}
            onChange={(e) => setDurata(Math.max(1, Number(e.target.value) || DURATA_DEFAULT))}
          />
        </div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>
          Serve a calcolare i minuti di chi non è stato sostituito.
        </p>
      </div>

      <div className="section-title">Eventi ({eventi.length})</div>

      {incoerenti.size > 0 && (
        <div className="alert-card danger">
          <span>⚠️</span>
          <span>
            {incoerenti.size === 1 ? 'Un evento non torna' : `${incoerenti.size} eventi non tornano`} con
            la formazione: non hanno effetto su posizioni e minuti. Correggili o eliminali e reinseriscili.
          </span>
        </div>
      )}

      {eventiOrdinati.map((ev) => {
        const info = tipoEventoInfo(ev.tipo)
        return (
          <div className="card" key={ev.id}>
            <div className="row">
              <span style={{ fontSize: '1.1rem' }}>{info.icona}</span>
              <span className="badge">{ev.minuto ?? 0}′</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong className="small">{info.label}</strong>
                <div className="muted small">{descriviEvento(ev)}</div>
                {incoerenti.has(ev.id) && (
                  <div className="small" style={{ color: 'var(--danger)' }}>⚠️ {incoerenti.get(ev.id)}</div>
                )}
              </div>
              <button
                className="btn btn-sm"
                aria-label="Elimina evento"
                onClick={() => eliminaEvento(ev.id)}
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}

      <button
        className="btn btn-block"
        onClick={() => setBozza({
          tipo: 'gol', minuto: 0, playerId: null, assistId: null, outId: null, inId: null, slotIndex: null,
        })}
      >
        + Aggiungi evento
      </button>

      {bozza && (
        <Modal titolo="Nuovo evento" onClose={() => setBozza(null)}>
          <div className="field">
            <label>Tipo</label>
            <div className="chip-row">
              {TIPI_EVENTO.map((t) => (
                <button
                  key={t.value}
                  className={`chip chip-sm ${bozza.tipo === t.value ? 'selected' : ''}`}
                  onClick={() => setBozza((b) => ({
                    ...b, tipo: t.value, playerId: null, assistId: null, outId: null, inId: null,
                    slotIndex: null, incarico: undefined,
                  }))}
                >
                  {t.icona} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Minuto</label>
            <input
              className="input"
              type="number"
              min="0"
              max={durata}
              inputMode="numeric"
              value={bozza.minuto}
              onChange={(e) => setBozza((b) => ({ ...b, minuto: Number(e.target.value) || 0 }))}
            />
          </div>

          {(tipoEventoInfo(bozza.tipo).conGiocatore || tipoEventoInfo(bozza.tipo).conSpostamento) && (
            <div className="field">
              <label>Giocatore</label>
              <Scelta
                titolo="Giocatore"
                className="select"
                value={bozza.playerId ?? ''}
                onChange={(e) => setBozza((b) => ({
                  ...b, playerId: e.target.value ? Number(e.target.value) : null,
                }))}
              >
                <option value="">— Scegli —</option>
                {tipoEventoInfo(bozza.tipo).conSpostamento
                  ? inCampoBozza.map((pid) => (
                    <option key={pid} value={pid}>{nomeDi(pid)} ({sigle[campoBozza.indexOf(pid)]})</option>
                  ))
                  : presenti.map((p) => (
                    <option key={p.id} value={p.id}>{nomeBreve(p)}</option>
                  ))}
              </Scelta>
            </div>
          )}

          {tipoEventoInfo(bozza.tipo).conSpostamento && (
            <div className="field">
              <label>Nuova posizione</label>
              <Scelta
                titolo="Nuova posizione"
                className="select"
                value={bozza.slotIndex ?? ''}
                onChange={(e) => setBozza((b) => ({
                  ...b, slotIndex: e.target.value !== '' ? Number(e.target.value) : null,
                }))}
              >
                <option value="">— Scegli —</option>
                {sigle.map((_, i) => (
                  <option key={i} value={i}>{etichettaSlot(i)}</option>
                ))}
              </Scelta>
              <p className="muted small" style={{ margin: '6px 0 0' }}>
                Se la posizione è occupata, i due giocatori si scambiano di posto.
              </p>
            </div>
          )}

          {tipoEventoInfo(bozza.tipo).conAssist && (
            <div className="field">
              <label>Assist (facoltativo)</label>
              <Scelta
                titolo="Assist"
                className="select"
                value={bozza.assistId ?? ''}
                onChange={(e) => setBozza((b) => ({
                  ...b, assistId: e.target.value ? Number(e.target.value) : null,
                }))}
              >
                <option value="">— Nessuno —</option>
                {presenti.map((p) => (
                  <option key={p.id} value={p.id}>{nomeBreve(p)}</option>
                ))}
              </Scelta>
            </div>
          )}

          {tipoEventoInfo(bozza.tipo).conCambio && (
            <>
              <div className="field">
                <label>Esce</label>
                <Scelta
                  titolo="Chi esce"
                  className="select"
                  value={bozza.outId ?? ''}
                  onChange={(e) => setBozza((b) => ({
                    ...b, outId: e.target.value ? Number(e.target.value) : null,
                  }))}
                >
                  <option value="">— Nessuno —</option>
                  {inCampoBozza.map((pid) => (
                    <option key={pid} value={pid}>{nomeDi(pid)} ({sigle[campoBozza.indexOf(pid)]})</option>
                  ))}
                </Scelta>
              </div>
              <div className="field">
                <label>Entra</label>
                <Scelta
                  titolo="Chi entra"
                  className="select"
                  value={bozza.inId ?? ''}
                  onChange={(e) => setBozza((b) => ({
                    ...b, inId: e.target.value ? Number(e.target.value) : null,
                  }))}
                >
                  <option value="">— Nessuno —</option>
                  {disponibiliBozza.map((p) => (
                    <option key={p.id} value={p.id}>{nomeBreve(p)}</option>
                  ))}
                </Scelta>
              </div>
              <div className="field">
                <label>Posizione di chi entra</label>
                <Scelta
                  titolo="Posizione di chi entra"
                  className="select"
                  value={bozza.slotIndex ?? ''}
                  onChange={(e) => setBozza((b) => ({
                    ...b, slotIndex: e.target.value !== '' ? Number(e.target.value) : null,
                  }))}
                >
                  <option value="">Al posto di chi esce</option>
                  {sigle.map((_, i) => (
                    <option key={i} value={i}>{etichettaSlot(i)}</option>
                  ))}
                </Scelta>
                <p className="muted small" style={{ margin: '6px 0 0' }}>
                  Chi occupa quella posizione scala nel posto lasciato libero da chi esce.
                </p>
              </div>
              {bozza.inId != null && (
                <IncaricoPicker
                  label={`Incarico di ${nomeDi(bozza.inId)}`}
                  value={bozza.incarico !== undefined ? bozza.incarico : incarichi[bozza.inId] ?? null}
                  onChange={(v) => setBozza((b) => ({ ...b, incarico: v }))}
                />
              )}
            </>
          )}

          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={aggiungiEvento}>
              Aggiungi
            </button>
            <button className="btn" onClick={() => setBozza(null)}>Annulla</button>
          </div>
        </Modal>
      )}

      {hannoGiocato.length > 0 && (
        <>
          <div className="section-title">Incarichi</div>
          <p className="muted small" style={{ margin: '0 0 8px' }}>
            Per ognuno: l'incarico che gli hai dato e quello che ha svolto davvero in campo.
          </p>
          {hannoGiocato.map((pid) => {
            const a = incaricoInfo(incarichi[pid])
            const s = incaricoInfo(svolti[pid])
            return (
              <div className="card" key={pid}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <strong>{nomeDi(pid)}</strong>
                  <span className="spacer" />
                  {a && s && (
                    <span className={`badge ${a.value === s.value ? 'badge-ok' : 'badge-warn'}`}>
                      {a.value === s.value ? 'Rispettato' : `${a.icona} → ${s.icona}`}
                    </span>
                  )}
                </div>
                <IncaricoPicker
                  label="Incarico assegnato"
                  value={incarichi[pid] ?? null}
                  onChange={(v) => setIncarico(pid, v)}
                />
                <IncaricoPicker
                  label="Incarico svolto"
                  value={svolti[pid] ?? null}
                  onChange={(v) => setSvolto(pid, v)}
                  comeAssegnato={incarichi[pid]}
                />
              </div>
            )
          })}
        </>
      )}

      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={salva}>
        Salva referto
      </button>
    </div>
  )
}
