import { PALETTE, CAMPO, MODI, TEMA_DEFAULT } from './palette'

// Copia della scelta per il primo frame: main.jsx la applica prima del
// render, quando Dexie non ha ancora risposto (niente lampo di colori).
const CHIAVE_LOCALE = 'mister-tema'
const QUERY_SCURO = '(prefers-color-scheme: dark)'

export const paletteDi = (id) => PALETTE.find((p) => p.id === id) ?? PALETTE[0]

// Scelta salvata → scelta valida (palette o modo sconosciuti tornano ai default)
export function normalizzaTema(t) {
  return {
    palette: PALETTE.some((p) => p.id === t?.palette) ? t.palette : TEMA_DEFAULT.palette,
    modo: MODI.some((m) => m.value === t?.modo) ? t.modo : TEMA_DEFAULT.modo,
  }
}

export const sistemaScuro = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY_SCURO).matches : true

// 'chiaro' | 'scuro' | 'sistema' → versione della palette da usare
export const versioneDi = (modo, scuroDiSistema) =>
  modo === 'chiaro' ? 'light' : modo === 'scuro' ? 'dark' : scuroDiSistema ? 'dark' : 'light'

// Tutti i token della palette, campo compreso, per la versione scelta
export function tokenDi(tema, scuroDiSistema) {
  const { palette, modo } = normalizzaTema(tema)
  const versione = versioneDi(modo, scuroDiSistema)
  return { versione, token: { ...paletteDi(palette)[versione], ...CAMPO } }
}

// Scrive i token su <html>, il color-scheme e il colore della barra del
// browser; ricorda la scelta per il prossimo avvio.
export function applicaTema(tema, scuroDiSistema = sistemaScuro()) {
  const { versione, token } = tokenDi(tema, scuroDiSistema)
  const root = document.documentElement
  for (const [nome, valore] of Object.entries(token)) root.style.setProperty(`--${nome}`, valore)
  root.style.colorScheme = versione === 'dark' ? 'dark' : 'light'
  root.dataset.tema = versione
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', token.bg)
  try {
    localStorage.setItem(CHIAVE_LOCALE, JSON.stringify(normalizzaTema(tema)))
  } catch {
    // storage non disponibile (navigazione privata): si riparte dai default
  }
}

export function temaLocale() {
  try {
    return normalizzaTema(JSON.parse(localStorage.getItem(CHIAVE_LOCALE)))
  } catch {
    return { ...TEMA_DEFAULT }
  }
}

export { QUERY_SCURO }
