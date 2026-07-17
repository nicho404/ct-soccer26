import { db } from './db'

// Dati finti per provare l'app. Tutte le righe hanno demo: true
// così lo svuotamento tocca solo i dati demo, mai quelli reali.
const base = {
  ruoliAdattati: [],
  ruoliTattici: [],
  piede: 'destro',
  altezza: '',
  statoAttivita: 'sicuro',
  acciaccato: false,
  condizione: '',
  tesseramento: 'ok',
  porta: 'no',
  calciFissi: [],
  note: '',
}

const DEMO_PLAYERS = [
  { ...base, nome: 'Luca Ferrari', soprannome: 'Fera', numero: 1, ruoloNaturale: 'POR', ruoliTattici: ['Portiere libero'], porta: 'si', altezza: 185, note: 'Buona uscita bassa, rilancio corto' },
  { ...base, nome: 'Marco Colombo', soprannome: 'Colo', numero: 4, ruoloNaturale: 'DC', ruoliAdattati: ['CDC'], ruoliTattici: ['Difensore costruttore'], altezza: 180, calciFissi: ['punizioni'] },
  { ...base, nome: 'Andrea Bianchi', soprannome: '', numero: 5, ruoloNaturale: 'DC', ruoliTattici: ['Stopper'], piede: 'sinistro', statoAttivita: 'infortunato', acciaccato: true, condizione: 'Fastidio al polpaccio sx, da valutare' },
  { ...base, nome: 'Davide Rossi', soprannome: 'Dado', numero: 7, ruoloNaturale: 'ED', ruoliAdattati: ['AD', 'ATT'], ruoliTattici: ['Ala', 'Attaccante interno'], altezza: 173, note: 'Il più veloce della rosa' },
  { ...base, nome: 'Simone Galli', soprannome: '', numero: 3, ruoloNaturale: 'ES', ruoliAdattati: ['TS'], ruoliTattici: ['Esterno di centrocampo'], piede: 'sinistro', tesseramento: 'da_verificare', calciFissi: ['angoliSx'], note: 'Documenti tesseramento da consegnare' },
  { ...base, nome: 'Matteo Villa', soprannome: 'Teo', numero: 8, ruoloNaturale: 'CC', ruoliAdattati: ['COC'], ruoliTattici: ['Regista', 'Mezzala'], altezza: 178, calciFissi: ['rigori'], note: 'Capitano, organizza il gruppo' },
  { ...base, nome: 'Alessio Riva', soprannome: '', numero: 6, ruoloNaturale: 'CDC', ruoliAdattati: ['CC', 'DC'], ruoliTattici: ['Mediano', 'Centromediano'], piede: 'ambidestro', porta: 'emergenza' },
  { ...base, nome: 'Federico Sala', soprannome: 'Fede', numero: 9, ruoloNaturale: 'ATT', ruoliTattici: ['Opportunista', 'Attaccante avanzato'], altezza: 182, calciFissi: ['angoliDx'], note: 'Bomber, ma non rientra mai' },
  { ...base, nome: 'Giorgio Monti', soprannome: 'Gio', numero: 11, ruoloNaturale: 'AS', ruoliAdattati: ['ATT', 'ES'], ruoliTattici: ['Attaccante interno', 'Ala'], piede: 'sinistro', acciaccato: true, condizione: 'Caviglia dolorante dopo ultima partita' },
  { ...base, nome: 'Stefano Corti', soprannome: '', numero: 2, ruoloNaturale: 'DC', ruoliAdattati: ['TD'], statoAttivita: 'condizionale', note: 'Mai visto giocare, da osservare' },
  { ...base, nome: 'Paolo Greco', soprannome: '', numero: 10, ruoloNaturale: 'CC', ruoliAdattati: ['CDC'], ruoliTattici: ['Box-to-box'], tesseramento: 'non_tesserabile', note: 'Già tesserato FIGC, non tesserabile in lega' },
  { ...base, nome: 'Nicola Fontana', soprannome: 'Nico', numero: 14, ruoloNaturale: 'ED', ruoliAdattati: ['ES'], statoAttivita: 'tiepido', tesseramento: 'da_verificare', note: 'Risponde una volta su tre in chat' },
  { ...base, nome: 'Roberto Longhi', soprannome: 'Robi', numero: 12, ruoloNaturale: 'POR', ruoliAdattati: ['DC'], porta: 'si', statoAttivita: 'inattivo', note: 'Si è trasferito, forse torna a primavera' },
  { ...base, nome: 'Emanuele Riva', soprannome: 'Lele', numero: 17, ruoloNaturale: 'ATT', ruoliAdattati: ['COC'], ruoliTattici: ['Falso 9', 'Classico 10'], statoAttivita: 'condizionale', porta: 'emergenza', note: 'Fratello di Alessio, viene quando può' },
]

// Intese demo: indici riferiti a DEMO_PLAYERS (risolti in id al seed)
const DEMO_INTESE = [
  { idx: [3, 7], tipo: 'confermata', descrizione: 'Dado attacca la profondità sui lanci di Fede spalle alla porta', fonte: 'storica' },
  { idx: [5, 6], tipo: 'confermata', descrizione: 'Doppio centrale: Teo verticalizza, Alessio copre', fonte: 'allenamento' },
  { idx: [1, 5, 3, 7], tipo: 'speciale', descrizione: 'Quad ripartenza: Colo recupera → Teo smista → Dado corre → Fede conclude', fonte: 'storica' },
  { idx: [4, 8], tipo: 'potenziale', descrizione: 'Entrambi mancini sulla stessa fascia, da provare in partitella', fonte: 'osservazione' },
]

// Osservazioni demo: una sessione di partitella con data = oggi,
// così la tabella comparativa è subito piena. idx come sopra.
const DEMO_OBSERVATIONS = [
  { idx: 0, voti: { lettura: 4, pressione: 4, leadership: 3, posizione: 4 }, notaGenerale: 'Sicuro tra i pali, comanda la difesa' },
  { idx: 1, voti: { lettura: 4, piedeForte: 4, piedeDebole: 2, pressione: 3, intensita: 3, leadership: 3, posizione: 5 }, noteCriteri: { piedeDebole: 'Evita sempre il sinistro' }, notaGenerale: 'Ordinato, mai in affanno' },
  { idx: 3, voti: { lettura: 3, piedeForte: 4, piedeDebole: 3, pressione: 4, intensita: 5, leadership: 2, posizione: 2 }, noteCriteri: { posizione: 'Si accentra troppo, lascia la fascia scoperta' }, notaGenerale: 'Devastante in campo aperto' },
  { idx: 4, voti: { lettura: 3, piedeForte: 3, piedeDebole: 2, pressione: 3, intensita: 4, posizione: 3 }, notaGenerale: '' },
  { idx: 5, voti: { lettura: 5, piedeForte: 4, piedeDebole: 4, pressione: 5, intensita: 3, leadership: 5, posizione: 4 }, notaGenerale: 'Il faro: quando ha palla lui la squadra respira' },
  { idx: 6, voti: { lettura: 4, piedeForte: 3, piedeDebole: 3, pressione: 4, intensita: 4, leadership: 3, posizione: 5 }, notaGenerale: 'Equilibratore silenzioso' },
  { idx: 7, voti: { lettura: 3, piedeForte: 5, piedeDebole: 2, pressione: 3, intensita: 2, leadership: 2, posizione: 3 }, noteCriteri: { intensita: 'Non rientra mai in copertura' }, notaGenerale: 'Se la palla arriva in area, la butta dentro' },
  { idx: 9, voti: { lettura: 2, piedeForte: 3, piedeDebole: 2, pressione: 2, intensita: 4, posizione: 3 }, notaGenerale: 'Prima volta che lo vedo: generoso ma confusionario' },
]

const DEMO_COMPETITIONS = [
  { nome: 'LC8 Milano Serie C 2026/27', tipo: 'campionato', inizio: '2026-10-01', fine: '2027-03-31' },
  { nome: 'Amichevoli estive 2026', tipo: 'amichevoli', inizio: '2026-07-01', fine: '2026-09-15' },
]

export async function hasDemoData() {
  const n = await db.players.filter((p) => p.demo === true).count()
  return n > 0
}

export async function seedDemoData() {
  const playerIds = await db.players.bulkAdd(
    DEMO_PLAYERS.map((p) => ({ ...p, demo: true })),
    { allKeys: true }
  )
  await db.intese.bulkAdd(
    DEMO_INTESE.map(({ idx, ...i }) => ({
      ...i,
      playerIds: idx.map((n) => playerIds[n]),
      demo: true,
    }))
  )
  await db.competitions.bulkAdd(DEMO_COMPETITIONS.map((c) => ({ ...c, demo: true })))
  const oggi = new Date().toISOString().slice(0, 10)
  await db.observations.bulkAdd(
    DEMO_OBSERVATIONS.map(({ idx, ...o }) => ({
      ...o,
      noteCriteri: o.noteCriteri ?? {},
      playerId: playerIds[idx],
      data: oggi,
      contesto: 'partitella',
      demo: true,
    }))
  )
}

export async function clearDemoData() {
  const tables = [
    db.players, db.intese, db.competitions, db.observations, db.trainings,
    db.matches, db.sessionPlans, db.tactics, db.opponents, db.manualEntries,
  ]
  for (const table of tables) {
    const ids = await table.filter((r) => r.demo === true).primaryKeys()
    await table.bulkDelete(ids)
  }
}
