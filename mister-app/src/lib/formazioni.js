// Moduli calcio a 7: 7 slot con sigla posizione e coordinate campo.
// u = larghezza (0 sinistra → 1 destra), t = profondità (0 nostra porta → 1 porta avversaria).
// Regola punta: nei moduli CON COC la punta sta in mezzo all'area avversaria (t ≈ .92),
// nei moduli SENZA COC punta/punte in linea col limite dell'area (t ≈ .84).
export const MODULI = {
  '2-3-1': {
    nome: '2-3-1',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.3, t: 0.28 },
      { sigla: 'DC', u: 0.7, t: 0.28 },
      { sigla: 'ES', u: 0.12, t: 0.54 },
      { sigla: 'CC', u: 0.5, t: 0.5 },
      { sigla: 'ED', u: 0.88, t: 0.54 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '3-2-1': {
    nome: '3-2-1',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CC', u: 0.32, t: 0.56 },
      { sigla: 'CC', u: 0.68, t: 0.56 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '2-1-2-1': {
    nome: '2-1-2-1',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.3, t: 0.27 },
      { sigla: 'DC', u: 0.7, t: 0.27 },
      { sigla: 'CDC', u: 0.5, t: 0.44 },
      { sigla: 'ES', u: 0.14, t: 0.64 },
      { sigla: 'ED', u: 0.86, t: 0.64 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '2-2-2': {
    nome: '2-2-2',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.3, t: 0.28 },
      { sigla: 'DC', u: 0.7, t: 0.28 },
      { sigla: 'CC', u: 0.32, t: 0.55 },
      { sigla: 'CC', u: 0.68, t: 0.55 },
      { sigla: 'ATT', u: 0.3, t: 0.84 },
      { sigla: 'ATT', u: 0.7, t: 0.84 },
    ],
  },
  '2-2-1-1': {
    nome: '2-2-1-1',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.3, t: 0.28 },
      { sigla: 'DC', u: 0.7, t: 0.28 },
      { sigla: 'CC', u: 0.32, t: 0.5 },
      { sigla: 'CC', u: 0.68, t: 0.5 },
      { sigla: 'COC', u: 0.5, t: 0.68 },
      { sigla: 'ATT', u: 0.5, t: 0.92 },
    ],
  },
  '3-1-1-1': {
    nome: '3-1-1-1',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CDC', u: 0.5, t: 0.46 },
      { sigla: 'COC', u: 0.5, t: 0.66 },
      { sigla: 'ATT', u: 0.5, t: 0.92 },
    ],
  },
}

// Impostazioni tattiche: cambiano il ruolo tattico imposto a ogni posizione
export const IMPOSTAZIONI = [
  { value: 'possesso', label: 'Possesso palla' },
  { value: 'contropiede', label: 'Contropiede' },
  { value: 'pressing', label: 'Pressing alto' },
  { value: 'ali', label: 'Gioco sulle ali' },
  { value: 'pallalunga', label: 'Palla lunga' },
  { value: 'difesa', label: 'Difesa a oltranza' },
]

// Ruolo tattico per sigla posizione, per ogni impostazione (nomi FC26)
const RUOLI_IMPOSTAZIONE = {
  possesso: {
    POR: 'Portiere costruttore', DC: 'Difensore costruttore',
    TD: 'Terzino invertito', TS: 'Terzino invertito',
    CDC: 'Regista arretrato', CC: 'Regista', COC: 'Classico 10',
    ED: 'Regista largo', ES: 'Regista largo',
    AD: 'Attaccante interno', AS: 'Attaccante interno', ATT: 'Falso 9',
  },
  contropiede: {
    POR: 'Portiere', DC: 'Difensore',
    TD: 'Terzino', TS: 'Terzino',
    CDC: 'Mediano', CC: 'Box-to-box', COC: 'Attaccante ombra',
    ED: 'Ala', ES: 'Ala',
    AD: 'Attaccante interno', AS: 'Attaccante interno', ATT: 'Attaccante avanzato',
  },
  pressing: {
    POR: 'Portiere libero', DC: 'Stopper',
    TD: 'Tornante', TS: 'Tornante',
    CDC: 'Incursore', CC: 'Box-to-box', COC: 'Attaccante ombra',
    ED: 'Attaccante interno', ES: 'Attaccante interno',
    AD: 'Ala', AS: 'Ala', ATT: 'Attaccante avanzato',
  },
  ali: {
    POR: 'Portiere', DC: 'Difensore largo',
    TD: 'Tornante offensivo', TS: 'Tornante offensivo',
    CDC: 'Mediano laterale', CC: 'Mezzala', COC: 'Regista',
    ED: 'Ala', ES: 'Ala',
    AD: 'Ala', AS: 'Ala', ATT: 'Attaccante boa',
  },
  pallalunga: {
    POR: 'Portiere', DC: 'Difensore',
    TD: 'Terzino', TS: 'Terzino',
    CDC: 'Centromediano', CC: 'Box-to-box', COC: 'Attaccante ombra',
    ED: 'Ala', ES: 'Ala',
    AD: 'Attaccante interno', AS: 'Attaccante interno', ATT: 'Attaccante boa',
  },
  difesa: {
    POR: 'Portiere', DC: 'Difensore',
    TD: 'Terzino', TS: 'Terzino',
    CDC: 'Centromediano', CC: 'Mediano', COC: 'Mezzala',
    ED: 'Esterno di centrocampo', ES: 'Esterno di centrocampo',
    AD: 'Ala', AS: 'Ala', ATT: 'Opportunista',
  },
}

export const ruoloSlot = (sigla, impostazione) =>
  RUOLI_IMPOSTAZIONE[impostazione]?.[sigla] ?? ''

// Un giocatore è "in posizione" se la sigla è la sua naturale o una copertura
export const inPosizione = (player, sigla) =>
  player.ruoloNaturale === sigla || (player.ruoliAdattati ?? []).includes(sigla)
