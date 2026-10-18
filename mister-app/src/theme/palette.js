// Palette dell'app. Ognuna ha una versione chiara e una scura con tutti i
// token di TOKEN (src/theme/palette.test.js lo controlla, insieme al
// contrasto AA). Aggiungere una palette = aggiungere un oggetto a PALETTE:
// Impostazioni la mostra da sola.
//
// - accent: riempimento (pulsanti, scheda attiva), con on-accent sopra
// - accent-strong: accento per testo e icone su bg e surface
// - accent-soft: fondo tenue degli elementi selezionati
// - ok / warn / danger: stati, usati come testo sulle superfici
// - l'accento non coincide con --danger (in Rosso è cremisi): un elemento
//   scelto non deve sembrare un allarme
// - ruolo-*: reparti; restano accesi anche nel chiaro perché si vedono sul
//   campo (scuro) e nei pallini. Come testo il CSS li mescola con --text.

export const TOKEN = [
  'bg', 'surface', 'surface-2', 'border', 'text', 'muted',
  'accent', 'accent-strong', 'accent-soft', 'on-accent',
  'ok', 'warn', 'danger',
  'ruolo-por', 'ruolo-dif', 'ruolo-cen', 'ruolo-att',
  'ombra',
]

// Il campo resta verde e scuro con qualsiasi palette e modo
export const CAMPO = {
  campo: '#0e3a26',
  'campo-linee': '#ffffff',
  'campo-fondo': 'radial-gradient(ellipse at 50% 0%, #101623 0%, #07070b 70%)',
  'campo-pedina': '#14141c',
}

// Stati e reparti uguali per tutte le palette, diversi tra chiaro e scuro
const STATI_SCURO = {
  ok: '#34d399', warn: '#fbbf24', danger: '#f87171',
  'ruolo-por': '#facc15', 'ruolo-dif': '#4ade80', 'ruolo-cen': '#60a5fa', 'ruolo-att': '#f87171',
  ombra: '#000000',
}
const STATI_CHIARO = {
  ok: '#047857', warn: '#b45309', danger: '#b91c1c',
  'ruolo-por': '#eab308', 'ruolo-dif': '#22c55e', 'ruolo-cen': '#3b82f6', 'ruolo-att': '#ef4444',
  ombra: '#0f172a',
}

const tenue = (colore, pc) => `color-mix(in srgb, ${colore} ${pc}%, transparent)`

export const PALETTE = [
  {
    id: 'viola',
    nome: 'Viola',
    dark: {
      bg: '#0a0a0e', surface: '#14141c', 'surface-2': '#1e1e2a', border: '#2b2b3c',
      text: '#ececf1', muted: '#9a9aad',
      accent: '#7c3aed', 'accent-strong': '#a78bfa', 'accent-soft': tenue('#a78bfa', 15), 'on-accent': '#ffffff',
      ...STATI_SCURO,
    },
    light: {
      bg: '#f5f4fa', surface: '#ffffff', 'surface-2': '#efedf7', border: '#dcd8ea',
      text: '#17151f', muted: '#5f5a72',
      accent: '#6d28d9', 'accent-strong': '#6d28d9', 'accent-soft': tenue('#6d28d9', 12), 'on-accent': '#ffffff',
      ...STATI_CHIARO,
    },
  },
  {
    id: 'blu',
    nome: 'Blu',
    dark: {
      bg: '#090c12', surface: '#111723', 'surface-2': '#1a2232', border: '#263247',
      text: '#e8edf5', muted: '#93a0b5',
      accent: '#2563eb', 'accent-strong': '#60a5fa', 'accent-soft': tenue('#60a5fa', 15), 'on-accent': '#ffffff',
      ...STATI_SCURO,
    },
    light: {
      bg: '#f3f6fb', surface: '#ffffff', 'surface-2': '#eaf0f8', border: '#d3dceb',
      text: '#111827', muted: '#4b5768',
      accent: '#1d4ed8', 'accent-strong': '#1d4ed8', 'accent-soft': tenue('#1d4ed8', 12), 'on-accent': '#ffffff',
      ...STATI_CHIARO,
    },
  },
  {
    id: 'verde',
    nome: 'Verde campo',
    dark: {
      bg: '#08100c', surface: '#0f1a14', 'surface-2': '#17261d', border: '#23382b',
      text: '#e6f0ea', muted: '#8fa69a',
      accent: '#15803d', 'accent-strong': '#4ade80', 'accent-soft': tenue('#4ade80', 14), 'on-accent': '#ffffff',
      ...STATI_SCURO,
    },
    light: {
      bg: '#f2f7f4', surface: '#ffffff', 'surface-2': '#e7f0ea', border: '#cfe0d5',
      text: '#0f1a14', muted: '#4a5f53',
      accent: '#15803d', 'accent-strong': '#166534', 'accent-soft': tenue('#15803d', 12), 'on-accent': '#ffffff',
      ...STATI_CHIARO,
    },
  },
  {
    id: 'rosso',
    nome: 'Rosso',
    dark: {
      bg: '#110a0a', surface: '#1b1111', 'surface-2': '#261818', border: '#3a2424',
      text: '#f3e9e9', muted: '#ab9696',
      accent: '#be123c', 'accent-strong': '#fb7185', 'accent-soft': tenue('#fb7185', 15), 'on-accent': '#ffffff',
      ...STATI_SCURO,
    },
    light: {
      bg: '#fbf4f4', surface: '#ffffff', 'surface-2': '#f6eaea', border: '#ead3d3',
      text: '#1f1111', muted: '#6b5555',
      accent: '#be123c', 'accent-strong': '#be123c', 'accent-soft': tenue('#be123c', 12), 'on-accent': '#ffffff',
      ...STATI_CHIARO,
    },
  },
]

export const MODI = [
  { value: 'chiaro', label: 'Chiaro' },
  { value: 'scuro', label: 'Scuro' },
  { value: 'sistema', label: 'Come il sistema' },
]

// Senza una scelta salvata l'app resta com'era: viola scuro
export const TEMA_DEFAULT = { palette: 'viola', modo: 'scuro' }
