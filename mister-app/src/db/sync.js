import { db } from './db'
import { leggiBackup, importBackup, CHIAVE_ULTIMO_BACKUP } from './backup'
import {
  driveConfigurato, caricaGis, tokenValido, cancellaToken, chiediToken,
  trovaFile, scaricaFile, caricaFile,
} from '../lib/drive'

// Sincronizzazione personale con Google Drive: tutto il database in un solo file.
//
// Cosa è cambiato si capisce dal confronto, non da un flag: l'impronta dei dati
// locali contro quella dell'ultima sincronizzazione, la revisione di Drive
// contro l'ultima vista. Così una scrittura che lascia i dati identici non
// conta come modifica. Questo stato sta in localStorage e non in Dexie, perché
// importBackup sostituisce tutte le tabelle.
const CHIAVE_STATO = 'mister-sync'
const ATTESA_MODIFICHE_MS = 3000

// Cosa fare, dati i due lati. Se il database locale è vuoto non si carica mai
// su Drive: può essere un dispositivo nuovo o un browser che ha svuotato i dati,
// e sovrascrivere il backup con il vuoto farebbe perdere tutto.
export function decidiSync({ hashNoto, hashLocale, revisioneNota, revisioneRemota, vuoto }) {
  if (revisioneRemota == null) return vuoto ? 'niente' : 'carica'
  if (vuoto) return hashNoto == null ? 'scarica' : 'conflitto'
  const cambiatoLocale = hashLocale !== hashNoto
  const cambiatoRemoto = revisioneRemota !== revisioneNota
  if (cambiatoLocale && cambiatoRemoto) return 'conflitto'
  if (cambiatoLocale) return 'carica'
  return cambiatoRemoto ? 'scarica' : 'niente'
}

// La data dell'ultimo export non conta: è del singolo dispositivo, non dei dati.
async function impronta(tables) {
  const meta = tables.meta?.filter((r) => r.key !== CHIAVE_ULTIMO_BACKUP)
  const dati = new TextEncoder().encode(JSON.stringify({ ...tables, meta }))
  const digest = await crypto.subtle.digest('SHA-256', dati)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const isVuoto = ({ tables }) =>
  !tables.players?.length && !tables.matches?.length &&
  !tables.meta?.some((r) => r.key === 'team' && r.setupDone)

function leggiSalvato() {
  try {
    return JSON.parse(localStorage.getItem(CHIAVE_STATO))
  } catch {
    return null
  }
}

const scriviSalvato = (s) => localStorage.setItem(CHIAVE_STATO, JSON.stringify(s))

// --- stato per l'interfaccia ------------------------------------------------

// fase: 'spento' | 'accesso' | 'lavoro' | 'ok' | 'offline' | 'conflitto' | 'errore'
let stato = { fase: 'spento' }
const ascoltatori = new Set()

const imposta = (patch) => {
  stato = { ...patch }
  ascoltatori.forEach((a) => a())
}

export const leggiStatoSync = () => stato
export const iscriviSync = (a) => {
  ascoltatori.add(a)
  return () => ascoltatori.delete(a)
}

// --- motore -----------------------------------------------------------------

let timer = null
let applicando = false
let inCorso = null
let daRifare = false

async function applica(testo) {
  applicando = true
  try {
    await importBackup({ text: async () => testo })
    // come l'onboarding: un backup vecchio con il nome squadra vale come configurato
    const team = await db.meta.get('team')
    if (team?.nome?.trim() && !team.setupDone) await db.meta.put({ ...team, setupDone: true })
  } finally {
    applicando = false
  }
}

async function scarica(token, file, salvato) {
  await applica(await scaricaFile(token, file.id))
  const { tables } = await leggiBackup()
  scriviSalvato({
    ...salvato, fileId: file.id, revisione: file.headRevisionId, hash: await impronta(tables),
  })
}

async function carica(token, fileId, salvato, payload) {
  const file = await caricaFile(token, fileId, JSON.stringify(payload))
  scriviSalvato({
    ...salvato, fileId: file.id, revisione: file.headRevisionId, hash: await impronta(payload.tables),
  })
}

async function giro() {
  const salvato = leggiSalvato()
  if (!salvato) {
    imposta({ fase: 'spento' })
    return
  }
  const token = tokenValido()
  if (!token) {
    imposta({ fase: 'accesso' })
    return
  }
  imposta({ fase: 'lavoro' })
  const file = await trovaFile(token, salvato.fileId)
  const payload = await leggiBackup()
  const hashLocale = await impronta(payload.tables)
  const azione = decidiSync({
    hashNoto: salvato.hash,
    hashLocale,
    revisioneNota: salvato.revisione,
    revisioneRemota: file?.headRevisionId ?? null,
    vuoto: isVuoto(payload),
  })

  if (azione === 'carica') await carica(token, file?.id ?? null, salvato, payload)
  else if (azione === 'scarica') await scarica(token, file, salvato)
  else if (azione === 'conflitto') {
    // i due lati possono essere arrivati agli stessi dati: lì non c'è da scegliere
    const remoto = JSON.parse(await scaricaFile(token, file.id))
    if ((await impronta(remoto.tables)) !== hashLocale) {
      imposta({ fase: 'conflitto', dataDrive: file.modifiedTime })
      return
    }
    scriviSalvato({ ...salvato, fileId: file.id, revisione: file.headRevisionId, hash: hashLocale })
  }
  imposta({ fase: 'ok', ultimo: new Date().toISOString(), nessunFile: azione === 'niente' && !file })
}

function gestisciErrore(e) {
  if (e.status === 401) {
    cancellaToken()
    imposta({ fase: 'accesso' })
  } else if (e instanceof TypeError) {
    // fetch fallita: senza rete si riprova da soli al ritorno della connessione
    imposta({ fase: 'offline' })
  } else {
    imposta({ fase: 'errore', messaggio: e.message })
  }
}

// Un solo giro alla volta; ciò che arriva nel frattempo ne fa partire un altro.
export function sincronizza() {
  if (inCorso) {
    daRifare = true
    return inCorso
  }
  inCorso = (async () => {
    do {
      daRifare = false
      try {
        await giro()
      } catch (e) {
        gestisciErrore(e)
      }
    } while (daRifare)
    inCorso = null
  })()
  return inCorso
}

function pianifica() {
  if (applicando || !leggiSalvato()) return
  clearTimeout(timer)
  timer = setTimeout(() => { timer = null; sincronizza() }, ATTESA_MODIFICHE_MS)
}

// Va chiamata dal tocco dell'utente: il browser blocca la finestra Google altrimenti.
export async function collega() {
  try {
    await chiediToken()
  } catch (e) {
    imposta({ fase: 'errore', messaggio: e.message })
    return
  }
  if (!leggiSalvato()) scriviSalvato({ fileId: null, revisione: null, hash: null })
  await sincronizza()
}

// Scollegare non tocca i dati, né qui né su Drive.
export function scollega() {
  clearTimeout(timer)
  cancellaToken()
  localStorage.removeItem(CHIAVE_STATO)
  imposta({ fase: 'spento' })
}

// lato: 'locale' tiene questo dispositivo, 'drive' tiene il file su Drive.
export async function risolviConflitto(lato) {
  const salvato = leggiSalvato()
  const token = tokenValido()
  if (!salvato || !token) {
    imposta({ fase: 'accesso' })
    return
  }
  imposta({ fase: 'lavoro' })
  try {
    const file = await trovaFile(token, salvato.fileId)
    if (lato === 'drive' && file) await scarica(token, file, salvato)
    else await carica(token, file?.id ?? null, salvato, await leggiBackup())
    imposta({ fase: 'ok', ultimo: new Date().toISOString() })
  } catch (e) {
    gestisciErrore(e)
  }
}

let avviata = false

// Una volta sola all'avvio: controlla Drive e resta in ascolto di modifiche,
// ritorno sull'app e ritorno della rete.
export function avviaSync() {
  if (avviata || !driveConfigurato) return
  avviata = true
  caricaGis().catch(() => {})
  for (const table of db.tables) {
    table.hook('creating', () => { pianifica() })
    table.hook('updating', () => { pianifica() })
    table.hook('deleting', () => { pianifica() })
  }
  document.addEventListener('visibilitychange', () => {
    // in uscita si salva subito ciò che era in attesa: dopo, il telefono può
    // sospendere l'app, e la modifica partirebbe solo alla prossima apertura
    if (document.visibilityState === 'visible' || timer) {
      clearTimeout(timer)
      timer = null
      sincronizza()
    }
  })
  window.addEventListener('online', () => sincronizza())
  sincronizza()
}
