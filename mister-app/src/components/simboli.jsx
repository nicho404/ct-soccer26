// Un solo file per la resa dei valori di dominio: componenti e mappe insieme
// di proposito, anche se il fast refresh preferirebbe file separati.
/* oxlint-disable react/only-export-components */
import {
  IconBall, IconGoal, IconSwap, IconMove, IconSword, IconShield, IconCycle, IconWing, IconLongBall,
  IconBolt, IconAlert, IconCheck, IconBulb,
} from './icons'

// Dal valore di dominio alla sua resa grafica: colori (sempre token CSS) e,
// più avanti, icone. Le costanti in db/ e lib/ restano solo valori ed
// etichette.

// Linee delle intese sul campo e pallini nelle liste, per tipo
export const COLORE_INTESA = {
  confermata: 'var(--ruolo-dif)',
  potenziale: 'var(--muted)',
  speciale: 'var(--accent-strong)',
  pattern: 'var(--text)',
}

export const coloreIntesa = (tipo) => COLORE_INTESA[tipo] ?? 'var(--text)'

// Colore del reparto (por, dif, cen, att)
export const coloreFamiglia = (famiglia) => (famiglia ? `var(--ruolo-${famiglia})` : 'var(--muted)')

// Lo stesso colore usato come testo: mescolato con --text resta leggibile
// anche sul fondo chiaro
export const testoIntesa = (tipo) => `color-mix(in srgb, ${coloreIntesa(tipo)} 55%, var(--text))`

// --- icone ----------------------------------------------------------------

// Cartellino come rettangolo pieno: giallo (--warn) o rosso (--danger)
export const Cartellino = ({ colore, size = 14, title }) => (
  <span
    className={`cartellino cartellino-${colore}`}
    style={{ '--cartellino-h': `${size}px` }}
    role="img"
    aria-label={title ?? (colore === 'rosso' ? 'Cartellino rosso' : 'Cartellino giallo')}
    title={title}
  />
)

const giallo = (p) => <Cartellino colore="giallo" size={p.size} />
const rosso = (p) => <Cartellino colore="rosso" size={p.size} />

const MAPPE = {
  // eventi del referto (db/constants TIPI_EVENTO)
  evento: { gol: IconBall, golSubito: IconGoal, cambio: IconSwap, spostamento: IconMove, giallo, rosso },
  // marcatori e cartellini avversari (lib/girone TIPI_EVENTO_AVVERSARI)
  eventoAvversari: { gol: IconBall, giallo, rosso },
  // incarico per fase (db/constants INCARICHI_FASE)
  incarico: { offensivo: IconSword, difensivo: IconShield, entrambe: IconCycle },
  // impostazione di gioco (lib/formazioni IMPOSTAZIONI)
  impostazione: { possesso: IconBall, ali: IconWing, lunga: IconLongBall, contropiede: IconBolt, oltranza: IconShield },
  // punti chiave dell'analisi (lib/analisi TIPI_PUNTO)
  analisi: { problema: IconAlert, forza: IconCheck, novita: IconBulb },
}

// Icona di un valore di dominio, o niente se il valore non ne ha una
export function Simbolo({ gruppo, valore, size = 16, ...resto }) {
  const Componente = MAPPE[gruppo]?.[valore]
  return Componente ? <Componente size={size} {...resto} /> : null
}

// Il nome dell'icona per l'immagine esportata (components/tracciati)
export const TRACCIATO_INCARICO = { offensivo: 'spada', difensivo: 'scudo', entrambe: 'ciclo' }

// --- toni dei badge (ok, warn, danger, accent) -----------------------------

export const TONO_STATO_ATTIVITA = { sicuro: 'ok', condizionale: 'accent', tiepido: 'warn', infortunato: 'danger', inattivo: '' }
export const TONO_TESSERAMENTO = { ok: 'ok', da_verificare: 'warn', non_tesserabile: 'danger' }
export const TONO_ESITO = { V: 'ok', N: 'warn', P: 'danger' }
export const TONO_PRESENZE = { piena: 'ok', media: 'warn', bassa: 'danger' }
export const TONO_BACKUP = { recente: '', vecchio: 'warn', scaduto: 'danger' }

// Classe del badge per un tono ('' → badge neutro)
export const badgeTono = (tono) => (tono ? `badge-${tono}` : '')

// Rischio scontento: il pallino compare solo se c'è qualcosa da tenere d'occhio
export const TONO_RISCHIO = { nessuno: '', monitorare: 'warn', alto: 'danger' }

export function PallinoRischio({ rischio }) {
  if (!rischio || rischio.livello === 'nessuno') return null
  const testo = `Rischio scontento: ${rischio.label.toLowerCase()} · ${rischio.causa}`
  return <span className={`pallino-rischio pallino-${TONO_RISCHIO[rischio.livello]}`} role="img" aria-label={testo} title={testo} />
}
