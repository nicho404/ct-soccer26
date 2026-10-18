import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { MODULI_FORMATO, FORMATI, IMPOSTAZIONI, lineaDifesaInfo } from '../lib/formazioni'
import { nomeBreve } from '../lib/nomi'
import { formatDataPartita } from '../lib/partite'
import { presentiIds } from '../lib/presenze'
import { esportaModulo } from '../lib/esportaModulo'
import { isAttivo } from '../db/constants'
import { ruoloInfo, ruoloNpInfo, TRANSIZIONE } from '../tactics/constants'
import {
  risolviRuoli, risolviRuoliNonPossesso, geometriaNonPossesso,
  applicaOverrideRuoli, verificaCoerenza,
} from '../tactics/engine'
import PitchView from '../components/PitchView'
import EmptyState from '../components/EmptyState'
import { IconBall, IconCamera, IconShield, IconSwap } from '../components/icons'
import { vistaCompleta } from '../lib/vistaCampo'
import VistaCampo from '../components/VistaCampo'
import { VUOTO, righeDaCambi, ordinaCandidati } from '../components/modulo/stato'
import useConfigModulo from '../components/modulo/useConfigModulo'
import SceltaPartita from '../components/modulo/SceltaPartita'
import AssettoRiga from '../components/modulo/AssettoRiga'
import FinestraTattica from '../components/modulo/FinestraTattica'
import PannelloSlot from '../components/modulo/PannelloSlot'
import PannelloCambi from '../components/modulo/PannelloCambi'
import FinestraSalvaAssetto from '../components/modulo/FinestraSalvaAssetto'
import AssettiSalvati from '../components/modulo/AssettiSalvati'

// Switch di fase: lente esclusiva sul campo, mai le due mappe insieme
const FASI = [
  { value: 'possesso', label: 'Con palla', Icon: IconBall },
  { value: 'nonPossesso', label: 'Senza palla', Icon: IconShield },
  { value: 'cambi', label: 'Cambi', Icon: IconSwap },
]

export default function ModuloPage() {
  const navigate = useNavigate()
  const [sel, setSel] = useState(null)
  // finestra "Tattica" (modulo, impostazione, costruzione, linea): il
  // dettaglio si vede solo quando serve
  const [finestraTattica, setFinestraTattica] = useState(false)
  // lente sul campo, non configurazione: non persistita, default possesso
  const [fase, setFase] = useState('possesso')
  const [esitoExport, setEsitoExport] = useState(null)
  // righe iniziali della finestra "+ Salva assetto": null = chiusa
  const [salvaRighe, setSalvaRighe] = useState(null)

  const players = useLiveQuery(() => db.players.toArray(), [])
  const intese = useLiveQuery(() => db.intese.toArray(), [])
  const team = useLiveQuery(() => db.meta.get('team').then((t) => t ?? null), [])
  const salvati = useLiveQuery(() => db.meta.get('moduliSalvati').then((s) => s ?? null), [])
  const matches = useLiveQuery(() => db.matches.toArray(), [])
  const opponents = useLiveQuery(() => db.opponents.toArray(), [])
  const vistaRiga = useLiveQuery(() => db.meta.get('vistaCampo').then((v) => v ?? null), [])

  // Il formato arriva dalla configurazione squadra (onboarding/impostazioni):
  // qui si vedono solo i moduli di quel formato
  const formato = FORMATI.includes(team?.formato) ? team.formato : 7
  const cfg = useConfigModulo(formato)
  const { impostazione, costruzione, linea, matchId } = cfg

  if (!players || !intese || !cfg.loaded || team === undefined || salvati === undefined || !matches || !opponents || vistaRiga === undefined) return null

  const tuttiSalvati = salvati?.value ?? []
  const listaSalvati = tuttiSalvati.filter((s) => s.formato === formato)

  const MODULI = MODULI_FORMATO[formato]
  const { modulo: moduloKey, slots, slotRuoliOverride, cambi } = cfg.config
  const incarichi = cfg.config.incarichi ?? {}
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

  const inCampo = new Set(slots.filter(Boolean))
  const panchina = attivi.filter((p) => !inCampo.has(p.id))
  const nomeAvversarioDi = (m) => opponents.find((o) => o.id === m.opponentId)?.nome ?? 'Avversario da definire'

  // Immagine per i giocatori: campo, posizioni e nomi, più gli indicatori
  // accesi in questo momento (lib/vistaCampo). Tutti spenti → solo formazione.
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
        mostra: vistaCompleta(vistaRiga?.value),
        ruoli: ruoliPossesso, intese, incarichi, cambi,
      })
      if (esito !== 'annullata') {
        setEsitoExport(esito === 'condivisa' ? 'Immagine condivisa.' : 'Immagine salvata nei download.')
      }
    } catch {
      setEsitoExport('Non è stato possibile creare l’immagine.')
    }
  }

  const { updateFormato } = cfg
  const setCambi = (nextCambi) => updateFormato({ cambi: nextCambi })

  const cambiaModulo = (key) => {
    updateFormato({ modulo: key })
    setSel(null)
  }

  const onSlotTap = (i) => {
    if (sel === null || slots[sel] == null) {
      setSel(sel === i ? null : i)
      return
    }
    if (sel === i) {
      setSel(null)
      return
    }
    // secondo tocco su un altro slot: sposta o scambia se il primo era occupato
    const next = [...slots]
    ;[next[sel], next[i]] = [next[i], next[sel]]
    updateFormato({ slots: next })
    setSel(null)
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
    updateFormato({ slots: next })
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

  const annullaCambio = (slotIndex, entrante) => {
    if (!window.confirm(`Annullare il cambio di ${nomeBreve(entrante)}?`)) return
    const nextCambi = { ...cambi }
    delete nextCambi[slotIndex]
    setCambi(nextCambi)
  }

  const slotSel = sel !== null ? modulo.slots[sel] : null
  const playerSel = sel !== null && slots[sel] ? players.find((p) => p.id === slots[sel]) : null
  const cambioSel = sel !== null && cambi[sel] != null ? players.find((p) => p.id === cambi[sel]) : null

  const cambiaPartita = (id) => {
    cfg.cambiaPartita(id)
    setSel(null)
  }

  const impInfo = IMPOSTAZIONI.find((i) => i.value === impostazione)
  const vista = vistaCompleta(vistaRiga?.value)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Modulo</h1>
        <button className="btn btn-sm" onClick={svuota}>Svuota</button>
        {attivi.length > 0 && (
          <button className="btn btn-sm" aria-label="Esporta immagine" title="Esporta immagine" onClick={esporta}>
            <IconCamera size={18} />
          </button>
        )}
      </div>

      <SceltaPartita
        matches={matches}
        matchId={matchId}
        partita={matchSelezionata}
        nomeAvversarioDi={nomeAvversarioDi}
        onCambia={cambiaPartita}
      />

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
          <AssettoRiga
            formato={formato}
            moduli={Object.keys(MODULI)}
            moduloKey={moduloKey}
            onModulo={cambiaModulo}
            impInfo={impInfo}
            impostazione={impostazione}
            costruzione={costruzione}
            linea={linea}
            coerenza={coerenza}
            onApriTattica={() => setFinestraTattica(true)}
          />

          {finestraTattica && (
            <FinestraTattica
              formato={formato}
              moduli={Object.keys(MODULI)}
              moduloKey={moduloKey}
              modulo={modulo}
              onModulo={cambiaModulo}
              impostazione={impostazione}
              onImpostazione={cfg.cambiaTattica('impostazione')}
              costruzione={costruzione}
              onCostruzione={cfg.cambiaTattica('costruzione')}
              linea={linea}
              onLinea={cfg.cambiaTattica('linea')}
              coerenza={coerenza}
              onClose={() => setFinestraTattica(false)}
            />
          )}

          <div className="schede" role="tablist">
            {FASI.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={fase === f.value}
                className={`scheda scheda-icona ${fase === f.value ? 'attiva' : ''}`}
                onClick={() => { setFase(f.value); setSel(null) }}
              >
                <f.Icon size={16} /> {f.label}
              </button>
            ))}
          </div>

          <div className="pitch-wrap" style={{ position: 'relative' }}>
            <VistaCampo vista={vista} />
            <PitchView
              mostra={vista}
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
                  ? impInfo
                  : fase === 'nonPossesso'
                  ? { icona: '🛡️', label: `Senza palla — linea ${lineaDifesaInfo(linea).label.toLowerCase()}` }
                  : { icona: '🔁', label: 'Cambi pianificati' }
              }
            />
          </div>

          {esitoExport && (
            <p className="muted small" style={{ margin: '0 0 10px' }} onClick={() => setEsitoExport(null)}>
              {esitoExport} L’immagine riporta gli indicatori accesi sul campo: spegnili tutti per avere solo posizioni e nomi.
            </p>
          )}

          {fase === 'nonPossesso' && TRANSIZIONE[impostazione]?.nota && (
            <p className="muted small" style={{ margin: '0 0 10px' }}>
              <strong>Transizione:</strong> {TRANSIZIONE[impostazione].nota}
            </p>
          )}

          {fase === 'cambi' ? (
            <PannelloCambi
              slot={slotSel}
              player={playerSel}
              cambio={cambioSel}
              panchina={panchina}
              cambi={cambi}
              slots={slots}
              players={players}
              modulo={modulo}
              incarichi={incarichi}
              onIncarico={cfg.setIncarico}
              onAssegnaCambio={assegnaCambio}
              onRimuoviCambio={rimuoviCambio}
              onAnnullaCambio={annullaCambio}
            />
          ) : slotSel ? (
            <PannelloSlot
              key={`${fase}-${sel}`}
              fase={fase}
              slot={slotSel}
              ruolo={ruoli[sel]}
              player={playerSel}
              incarichi={incarichi}
              onIncarico={cfg.setIncarico}
              onTogli={togli}
              onRuoloManuale={(codice) => cfg.setOverride(fase, sel, codice)}
              candidati={ordinaCandidati(attivi, slotSel, slots[sel])}
              inCampo={inCampo}
              onAssegna={assegna}
            />
          ) : (
            <p className="muted small" style={{ margin: '10px 0 0' }}>
              Tocca una posizione sul campo per schierare, togliere o scambiare un giocatore.
              {panchina.length > 0 && ` In panchina: ${panchina.map(nomeBreve).join(', ')}.`}
            </p>
          )}

          <AssettiSalvati
            assetti={listaSalvati}
            tutti={tuttiSalvati}
            moduli={MODULI}
            players={players}
            onNuovo={() => setSalvaRighe(righeDaCambi(cambi, slots))}
            onCarica={(a) => { cfg.caricaAssetto(a); setSel(null) }}
          />

          {salvaRighe && (
            <FinestraSalvaAssetto
              righeIniziali={salvaRighe}
              slots={slots}
              panchina={panchina}
              players={players}
              modulo={modulo}
              incarichi={incarichi}
              onIncarico={cfg.setIncarico}
              onSalva={async (nome, righe) => { await cfg.salvaAssetto(nome, righe, tuttiSalvati); setSalvaRighe(null) }}
              onClose={() => setSalvaRighe(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
