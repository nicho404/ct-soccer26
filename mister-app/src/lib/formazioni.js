// Moduli per formato (calcio a 7 e calcio a 8): N slot con sigla posizione e coordinate campo.
// u = larghezza (0 sinistra → 1 destra), t = profondità (0 nostra porta → 1 porta avversaria).
// Regola punta: nei moduli CON COC la punta sta in mezzo all'area avversaria (t ≈ .92),
// nei moduli SENZA COC punta/punte in linea col limite dell'area (t ≈ .84).
const MODULI_7 = {
  '2-3-1': {
    nome: '2-3-1',
    descrizione: 'Il più usato nel calcio a 7: superiorità numerica nelle zone centrali, tanto in difesa quanto a centrocampo. Gli esterni in proiezione offensiva portano notevoli benefici all\'attacco; il mediano deve unire interdizione e costruzione.',
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
    descrizione: 'Formazione estremamente difensiva: ottima occupazione degli spazi centrali, l\'avversario è costretto a spingersi sugli esterni. I difensori possono allargarsi e avanzare sulla fascia, ma il reparto deve saper scalare. In attacco la punta fa da sponda per la conclusione dei centrocampisti.',
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
  '3-1-2': {
    nome: '3-1-2',
    descrizione: 'Variante più offensiva del 3-2-1, con gli stessi pregi e difetti della difesa a tre. Ideale una punta di peso e una di movimento, che rientri in non possesso e riparta veloce. Il centrocampista deve essere regista ma anche "rubapalloni" per agevolare le ripartenze.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CDC', u: 0.5, t: 0.5 },
      { sigla: 'ATT', u: 0.3, t: 0.84 },
      { sigla: 'ATT', u: 0.7, t: 0.84 },
    ],
  },
  '1-2-2-1': {
    nome: '1-2-2-1',
    descrizione: 'Sfrutta appieno le vie centrali: la punta riceve il sostegno combinato dei due centrocampisti, spesso con superiorità in fase offensiva. Senza esterni puri può essere difficile allargare il gioco. I terzini diventano difensori aggiunti in un terzetto arretrato; i centrocampisti si alternano a coprire il buco del centrocampo.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.5, t: 0.24 },
      { sigla: 'TS', u: 0.25, t: 0.42 },
      { sigla: 'TD', u: 0.75, t: 0.42 },
      { sigla: 'CC', u: 0.35, t: 0.62 },
      { sigla: 'CC', u: 0.65, t: 0.62 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '1-3-2': {
    nome: '1-3-2',
    descrizione: 'Modulo spregiudicato: porta cinque giocatori in fase d\'attacco e permette numerose combinazioni. Il difensore unico va spesso 1 contro 1: serve veloce, attento e senza paura dello scontro. Per l\'equilibrio i centrocampisti devono sia costruire sia difendere.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'ES', u: 0.14, t: 0.54 },
      { sigla: 'CC', u: 0.5, t: 0.5 },
      { sigla: 'ED', u: 0.86, t: 0.54 },
      { sigla: 'ATT', u: 0.32, t: 0.84 },
      { sigla: 'ATT', u: 0.68, t: 0.84 },
    ],
  },
  '1-4-1': {
    nome: '1-4-1',
    descrizione: 'Quattro centrocampisti in linea che in attacco danno imprevedibilità; la punta riceve sostegno alternato, altrimenti resta isolata. La squadra deve restare corta per coprire la zona centrale. Gli esterni devono avere grandi polmoni: su e giù tra copertura, appoggio e conclusione.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'ES', u: 0.1, t: 0.54 },
      { sigla: 'CC', u: 0.37, t: 0.54 },
      { sigla: 'CC', u: 0.63, t: 0.54 },
      { sigla: 'ED', u: 0.9, t: 0.54 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '1-1-2-1-1': {
    nome: '1-1-2-1-1',
    descrizione: 'Come il 1-4-1 ma con centrocampo a rombo, meno lineare e più dinamico: più difficile da assimilare, ma con numerosi benefici. Servono mobilità e smarcamento continui per creare triangoli; i due centrali scaglionati evitano di farsi superare entrambi da un filtrante e danno due soluzioni in ripartenza.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'CDC', u: 0.5, t: 0.44 },
      { sigla: 'ES', u: 0.12, t: 0.58 },
      { sigla: 'ED', u: 0.88, t: 0.58 },
      { sigla: 'COC', u: 0.5, t: 0.68 },
      { sigla: 'ATT', u: 0.5, t: 0.92 },
    ],
  },
}

const MODULI_8 = {
  '3-3-1': {
    nome: '3-3-1',
    descrizione: 'Il modulo di riferimento del calcio a 8: tre linee equilibrate e distanze corte tra i reparti. Gli esterni di centrocampo devono coprire tutta la fascia, su e giù; la punta lavora di sponda e attacca la profondità. Semplice da assimilare, resta solido anche nelle giornate storte.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'ES', u: 0.12, t: 0.56 },
      { sigla: 'CC', u: 0.5, t: 0.5 },
      { sigla: 'ED', u: 0.88, t: 0.56 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '2-3-2': {
    nome: '2-3-2',
    descrizione: 'Modulo offensivo con due punte servite da un centrocampo largo. La coppia difensiva resta spesso in 2 contro 2: servono centrali rapidi e sempre ben posizionati. Gli esterni fanno il doppio lavoro, raddoppiando in copertura e accompagnando l\'azione offensiva.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.3, t: 0.28 },
      { sigla: 'DC', u: 0.7, t: 0.28 },
      { sigla: 'ES', u: 0.12, t: 0.54 },
      { sigla: 'CC', u: 0.5, t: 0.5 },
      { sigla: 'ED', u: 0.88, t: 0.54 },
      { sigla: 'ATT', u: 0.32, t: 0.84 },
      { sigla: 'ATT', u: 0.68, t: 0.84 },
    ],
  },
  '3-2-2': {
    nome: '3-2-2',
    descrizione: 'Solidità dietro e due punte davanti: la difesa a tre copre l\'ampiezza mentre i due centrali di centrocampo fanno da diga e da rifornimento. Le punte devono muoversi molto in orizzontale per dare ampiezza a un modulo senza esterni puri; i difensori laterali possono spingere a turno.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CC', u: 0.32, t: 0.54 },
      { sigla: 'CC', u: 0.68, t: 0.54 },
      { sigla: 'ATT', u: 0.32, t: 0.84 },
      { sigla: 'ATT', u: 0.68, t: 0.84 },
    ],
  },
  '3-1-2-1': {
    nome: '3-1-2-1',
    descrizione: 'Rombo di centrocampo appoggiato alla difesa a tre: il mediano fa da schermo e libera le due mezzale tra le linee. Molto equilibrato ma dispendioso per le mezzale, che devono unire inserimenti e ripiegamenti; la punta apre gli spazi con i movimenti incontro.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CDC', u: 0.5, t: 0.44 },
      { sigla: 'CC', u: 0.28, t: 0.62 },
      { sigla: 'CC', u: 0.72, t: 0.62 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '2-4-1': {
    nome: '2-4-1',
    descrizione: 'Dominio del centrocampo: quattro in linea per vincere la battaglia in mezzo e allargare il gioco. I due difensori restano spesso in parità numerica, quindi la linea mediana deve ripiegare in fretta; in fase offensiva gli esterni diventano ali aggiunte a sostegno della punta.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.3, t: 0.28 },
      { sigla: 'DC', u: 0.7, t: 0.28 },
      { sigla: 'ES', u: 0.1, t: 0.56 },
      { sigla: 'CC', u: 0.37, t: 0.52 },
      { sigla: 'CC', u: 0.63, t: 0.52 },
      { sigla: 'ED', u: 0.9, t: 0.56 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
    ],
  },
  '3-2-1-1': {
    nome: '3-2-1-1',
    descrizione: 'Il trequartista tra le linee è la chiave: collega centrocampo e attacco e libera la punta in area. Struttura solida con difesa a tre e doppio centrale di centrocampo; serve un trequartista di qualità e generoso, altrimenti la squadra si spezza in due.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CC', u: 0.32, t: 0.5 },
      { sigla: 'CC', u: 0.68, t: 0.5 },
      { sigla: 'COC', u: 0.5, t: 0.68 },
      { sigla: 'ATT', u: 0.5, t: 0.92 },
    ],
  },
  '3-1-3': {
    nome: '3-1-3',
    descrizione: 'Modulo spregiudicato con tridente offensivo: le ali attaccano l\'uno contro uno e la punta finalizza. Il centrocampista unico rischia l\'isolamento, quindi le ali devono rientrare in non possesso. Ottimo per squadre tecniche che vogliono comandare la partita.',
    slots: [
      { sigla: 'POR', u: 0.5, t: 0.07 },
      { sigla: 'DC', u: 0.18, t: 0.3 },
      { sigla: 'DC', u: 0.5, t: 0.26 },
      { sigla: 'DC', u: 0.82, t: 0.3 },
      { sigla: 'CC', u: 0.5, t: 0.5 },
      { sigla: 'AS', u: 0.15, t: 0.78 },
      { sigla: 'ATT', u: 0.5, t: 0.84 },
      { sigla: 'AD', u: 0.85, t: 0.78 },
    ],
  },
}

// Formati disponibili: numero di giocatori in campo → set di moduli
export const FORMATI = [7, 8]
export const MODULI_FORMATO = { 7: MODULI_7, 8: MODULI_8 }
export const MODULO_DEFAULT = { 7: '2-3-1', 8: '3-3-1' }

// Impostazioni tattiche: cambiano il ruolo tattico imposto a ogni posizione
export const IMPOSTAZIONI = [
  { value: 'possesso', label: 'Possesso palla', icona: '⚽' },
  { value: 'contropiede', label: 'Contropiede', icona: '⚡' },
  { value: 'pressing', label: 'Pressing alto', icona: '🔥' },
  { value: 'ali', label: 'Gioco sulle ali', icona: '🦅' },
  { value: 'pallalunga', label: 'Palla lunga', icona: '🚀' },
  { value: 'difesa', label: 'Difesa a oltranza', icona: '🛡️' },
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
