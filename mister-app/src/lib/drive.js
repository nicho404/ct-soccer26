// Accesso a Google Drive dal browser, senza server: login con Google Identity
// Services e chiamate REST dirette. Lo scope drive.file vede solo i file creati
// da questa app, non il resto del Drive.
//
// Il token dura circa un'ora e nel browser non si rinnova da solo: rinnovarlo
// apre una finestra Google, che il browser permette solo dopo un tocco.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_URL = 'https://accounts.google.com/gsi/client'
const API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const CAMPI = 'id,headRevisionId,modifiedTime,trashed'
const CHIAVE_TOKEN = 'mister-drive-token'

export const NOME_FILE = 'mister-app-sync.json'
export const driveConfigurato = Boolean(CLIENT_ID)

export class ErroreDrive extends Error {
  constructor(status) {
    super(`Google Drive ha risposto con l'errore ${status}.`)
    this.status = status
  }
}

let gisPronto = null

// Va caricato prima del tocco: se la finestra Google si apre dopo un'attesa, il
// browser può considerarla un popup non richiesto e bloccarla.
export function caricaGis() {
  if (!driveConfigurato) return Promise.resolve()
  gisPronto ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_URL
    script.async = true
    script.onload = resolve
    script.onerror = () => {
      gisPronto = null
      reject(new Error('Non riesco a raggiungere Google: controlla la connessione.'))
    }
    document.head.appendChild(script)
  })
  return gisPronto
}

export function tokenValido() {
  try {
    const salvato = JSON.parse(localStorage.getItem(CHIAVE_TOKEN))
    // margine di un minuto: un token in scadenza non deve morire a metà upload
    return salvato?.scade > Date.now() + 60_000 ? salvato.token : null
  } catch {
    return null
  }
}

export function cancellaToken() {
  localStorage.removeItem(CHIAVE_TOKEN)
}

export async function chiediToken() {
  await caricaGis()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (risposta) => {
        if (risposta.error) {
          reject(new Error('Accesso a Google non riuscito.'))
          return
        }
        localStorage.setItem(CHIAVE_TOKEN, JSON.stringify({
          token: risposta.access_token,
          scade: Date.now() + Number(risposta.expires_in) * 1000,
        }))
        resolve(risposta.access_token)
      },
      error_callback: () => reject(new Error('Accesso a Google annullato o bloccato dal browser.')),
    })
    client.requestAccessToken({ prompt: '' })
  })
}

async function chiama(url, token, opzioni = {}) {
  const res = await fetch(url, {
    ...opzioni,
    headers: { ...opzioni.headers, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new ErroreDrive(res.status)
  return res
}

// Il file noto si legge per id, perché files.list può restare indietro di
// qualche istante; la ricerca per nome serve solo al primo collegamento o se il
// file è stato cancellato. null se su Drive non c'è nessun file.
export async function trovaFile(token, fileId) {
  if (fileId) {
    try {
      const res = await chiama(`${API}/${fileId}?fields=${CAMPI}`, token)
      const file = await res.json()
      if (!file.trashed) return file
    } catch (e) {
      if (e.status !== 404) throw e
    }
  }
  const q = encodeURIComponent(`name='${NOME_FILE}' and trashed=false`)
  const res = await chiama(
    `${API}?q=${q}&orderBy=modifiedTime desc&pageSize=1&fields=files(${CAMPI})`,
    token
  )
  const { files } = await res.json()
  return files?.[0] ?? null
}

export async function scaricaFile(token, fileId) {
  const res = await chiama(`${API}/${fileId}?alt=media`, token)
  return res.text()
}

// Con fileId sostituisce il contenuto, senza crea il file. Ritorna id e revisione.
export async function caricaFile(token, fileId, testo) {
  if (fileId) {
    const res = await chiama(`${UPLOAD}/${fileId}?uploadType=media&fields=${CAMPI}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: testo,
    })
    return res.json()
  }
  const confine = 'mister-app-confine'
  const corpo = [
    `--${confine}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: NOME_FILE, mimeType: 'application/json' }),
    `--${confine}`,
    'Content-Type: application/json',
    '',
    testo,
    `--${confine}--`,
  ].join('\r\n')
  const res = await chiama(`${UPLOAD}?uploadType=multipart&fields=${CAMPI}`, token, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${confine}` },
    body: corpo,
  })
  return res.json()
}
