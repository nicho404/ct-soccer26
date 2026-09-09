import { db } from './db'
import { MODULI_FORMATO, FORMATI, MODULO_DEFAULT } from '../lib/formazioni'
import { calcolaMinuti, portiereIniziale, DURATA_DEFAULT } from '../lib/storico'

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
  { ...base, nome: 'Luca Ferrari', soprannome: 'Fera', numero: 1, ruoloNaturale: 'POR', ruoliTattici: ['Portiere di reparto'], porta: 'si', altezza: 185, carattere: 'leader', note: 'Buona uscita bassa, rilancio corto' },
  { ...base, nome: 'Marco Colombo', soprannome: 'Colo', numero: 4, ruoloNaturale: 'DC', ruoliAdattati: ['CDC'], ruoliTattici: ['Difensore costruttore'], altezza: 180, calciFissi: ['punizioni'] },
  { ...base, nome: 'Andrea Bianchi', soprannome: '', numero: 5, ruoloNaturale: 'DC', ruoliTattici: ['Stopper'], piede: 'sinistro', statoAttivita: 'infortunato', acciaccato: true, condizione: 'Fastidio al polpaccio sx, da valutare' },
  { ...base, nome: 'Davide Rossi', soprannome: 'Dado', numero: 7, ruoloNaturale: 'ED', ruoliAdattati: ['AD', 'ATT'], ruoliTattici: ['Ala', 'Attaccante interno'], altezza: 173, note: 'Il più veloce della rosa' },
  { ...base, nome: 'Simone Galli', soprannome: '', numero: 3, ruoloNaturale: 'ES', ruoliAdattati: ['TS'], ruoliTattici: ['Esterno di centrocampo'], piede: 'sinistro', tesseramento: 'da_verificare', calciFissi: ['angoliSx'], note: 'Documenti tesseramento da consegnare' },
  { ...base, nome: 'Matteo Villa', soprannome: 'Teo', numero: 8, ruoloNaturale: 'CC', ruoliAdattati: ['COC'], ruoliTattici: ['Regista', 'Mezzala'], altezza: 178, calciFissi: ['rigori'], carattere: 'leader', gestioneErrore: 'attiva', note: 'Capitano, organizza il gruppo' },
  { ...base, nome: 'Alessio Riva', soprannome: '', numero: 6, ruoloNaturale: 'CDC', ruoliAdattati: ['CC', 'DC'], ruoliTattici: ['Mediano', 'Mediano equilibratore'], piede: 'ambidestro', porta: 'emergenza', carattere: 'follower' },
  { ...base, nome: 'Federico Sala', soprannome: 'Fede', numero: 9, ruoloNaturale: 'ATT', ruoliTattici: ['Opportunista', 'Attaccante avanzato'], altezza: 182, calciFissi: ['angoliDx'], carattere: 'follower', gestioneErrore: 'passiva', note: 'Bomber, ma non rientra mai' },
  { ...base, nome: 'Giorgio Monti', soprannome: 'Gio', numero: 11, ruoloNaturale: 'AS', ruoliAdattati: ['ATT', 'ES'], ruoliTattici: ['Attaccante interno', 'Ala'], piede: 'sinistro', acciaccato: true, condizione: 'Caviglia dolorante dopo ultima partita' },
  { ...base, nome: 'Stefano Corti', soprannome: '', numero: 2, ruoloNaturale: 'DC', ruoliAdattati: ['TD'], statoAttivita: 'condizionale', note: 'Mai visto giocare, da osservare' },
  { ...base, nome: 'Paolo Greco', soprannome: '', numero: 10, ruoloNaturale: 'CC', ruoliAdattati: ['CDC'], ruoliTattici: ['Incursore in area'], tesseramento: 'non_tesserabile', note: 'Già tesserato FIGC, non tesserabile in lega' },
  { ...base, nome: 'Nicola Fontana', soprannome: 'Nico', numero: 14, ruoloNaturale: 'ED', ruoliAdattati: ['ES'], statoAttivita: 'tiepido', tesseramento: 'da_verificare', note: 'Risponde una volta su tre in chat' },
  { ...base, nome: 'Roberto Longhi', soprannome: 'Robi', numero: 12, ruoloNaturale: 'POR', ruoliAdattati: ['DC'], porta: 'si', statoAttivita: 'inattivo', note: 'Si è trasferito, forse torna a primavera' },
  { ...base, nome: 'Emanuele Riva', soprannome: 'Lele', numero: 17, ruoloNaturale: 'ATT', ruoliAdattati: ['COC'], ruoliTattici: ['Falso 9', 'Regista'], statoAttivita: 'condizionale', porta: 'emergenza', note: 'Fratello di Alessio, viene quando può' },
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

const DEMO_OPPONENTS = [
  {
    nome: 'Real Bovisa',
    moduloAbituale: '2-3-1',
    stile: 'Difesa alta e pressing sul portatore. Se salti la prima pressione hai campo aperto: il centrale copre male la profondità.',
    pericolosi: [
      { nome: 'Il 10 mancino', numero: '10', ruolo: 'COC', nota: 'Calcia da fuori e batte tutte le inattive. Non lasciarlo girare sul sinistro.' },
      { nome: 'Esterno alto biondo', numero: '7', ruolo: 'AD', nota: 'Parte largo e taglia dentro: raddoppio con il centrale di parte.' },
    ],
    note: 'Campo in sintetico corto, palla che scorre. Arbitro fischia molto sui contatti.',
  },
  {
    nome: 'Atletico Lambrate',
    moduloAbituale: '3-2-1',
    stile: 'Squadra fisica che difende bassa e riparte lunga sulla punta. Vive di palle inattive.',
    pericolosi: [
      { nome: 'Punta boa', numero: '9', ruolo: 'ATT', nota: 'Domina di testa: sui rinvii serve il raddoppio, mai duello singolo.' },
    ],
    note: '',
  },
  { nome: 'Sporting Niguarda' },
]

// Partite demo: date relative a oggi (giorni di scarto) così il calendario
// ha sempre una prossima partita e uno storico, qualsiasi giorno sia oggi.
// oppIdx/compIdx = indici in DEMO_OPPONENTS / DEMO_COMPETITIONS.
const DEMO_MATCHES = [
  { giorni: -14, oppIdx: 1, compIdx: 0, campo: 'trasferta', ora: '20:30', luogo: 'CS Lambrate, campo 1', golFatti: 1, golSubiti: 3, note: 'Presi due gol da palla inattiva' },
  { giorni: -7, oppIdx: 2, compIdx: 0, campo: 'casa', ora: '19:00', luogo: 'CS Bonola, campo 2', golFatti: 2, golSubiti: 2, convocatiIdx: [0, 1, 3, 5, 6, 7, 8, 10], referto: true },
  { giorni: 3, oppIdx: 0, compIdx: 0, campo: 'casa', ora: '19:00', luogo: 'CS Bonola, campo 2', convocatiIdx: [0, 1, 3, 4, 5, 6, 7, 11, 13], note: 'Loro giocano a 3 dietro, occhio al 10 mancino' },
  { giorni: 10, oppIdx: 1, compIdx: 0, campo: 'trasferta', ora: '21:00', luogo: 'CS Lambrate, campo 1' },
]

// Riempie gli slot del modulo coi convocati: prima chi ha quel ruolo naturale,
// poi chi lo ha tra gli adattati, infine il primo rimasto. Indipendente dal
// formato: il demo funziona sia in calcio a 7 sia a 8.
function schieraDemo(modulo, convocatiIdx) {
  const liberi = [...convocatiIdx]
  const scegli = (predicato) => {
    const k = liberi.findIndex(predicato)
    return k === -1 ? null : liberi.splice(k, 1)[0]
  }
  return modulo.slots.map((slot) =>
    scegli((i) => DEMO_PLAYERS[i].ruoloNaturale === slot.sigla) ??
    scegli((i) => (DEMO_PLAYERS[i].ruoliAdattati ?? []).includes(slot.sigla)) ??
    scegli((i) => slot.sigla === 'POR' || DEMO_PLAYERS[i].ruoloNaturale !== 'POR')
  )
}

// Referto demo della partita finita 2-2: un gol per tempo, un cambio che
// manda in gol il subentrato — così il minutaggio non è tutto uguale.
function refertoDemo(modulo, schieratiIdx, panchinaIdx) {
  const slotIdx = (sigla) => modulo.slots.findIndex((s) => s.sigla === sigla)
  const attaccante = schieratiIdx[slotIdx('ATT')] ?? schieratiIdx[modulo.slots.length - 1]
  const centrocampista = schieratiIdx[slotIdx('CC')] ?? schieratiIdx[Math.floor(modulo.slots.length / 2)]
  const difensore = schieratiIdx[slotIdx('DC')] ?? schieratiIdx[1]
  const subentrato = panchinaIdx[0] ?? null

  const eventi = [
    { id: 1, tipo: 'gol', minuto: 12, playerId: attaccante, assistId: centrocampista },
    { id: 2, tipo: 'golSubito', minuto: 25 },
    { id: 3, tipo: 'giallo', minuto: 33, playerId: difensore },
  ]
  if (subentrato != null) {
    eventi.push({ id: 4, tipo: 'cambio', minuto: 45, outId: attaccante, inId: subentrato })
    eventi.push({ id: 5, tipo: 'gol', minuto: 52, playerId: subentrato })
  } else {
    eventi.push({ id: 5, tipo: 'gol', minuto: 52, playerId: centrocampista })
  }
  eventi.push({ id: 6, tipo: 'golSubito', minuto: 57 })
  return eventi
}

// Modello di seduta demo: quello che un mister riusa ogni infrasettimanale.
const DEMO_PIANO = {
  nome: 'Infrasettimanale tipo',
  obiettivo: 'Ritmo e possesso corto sotto pressione',
  blocchi: [
    { titolo: 'Attivazione + mobilità', minuti: 15, note: 'Corsa blanda, andature, allunghi' },
    { titolo: 'Torello 5v2', minuti: 15, note: 'Due tocchi, chi sbaglia va in mezzo' },
    { titolo: 'Possesso 6v6 + 2 jolly', minuti: 20, note: 'Campo stretto, jolly sempre con chi ha palla' },
    { titolo: 'Partitella a tema', minuti: 25, note: 'Gol valido solo dopo 5 passaggi consecutivi' },
  ],
}

// Appello demo: indici di DEMO_PLAYERS → stato. Federico (7) si allena poco
// ma gioca sempre, Paolo (10) non manca un allenamento e non scende in campo:
// sono i due casi che il confronto campo/allenamento deve far emergere.
const DEMO_TRAININGS = [
  {
    giorni: -12, ora: '21:00', tema: 'Uscita dal pressing', luogo: 'CS Bonola, campo 2',
    presenze: { 0: 'presente', 1: 'presente', 3: 'presente', 4: 'presente', 5: 'presente', 6: 'presente', 7: 'assente', 8: 'presente', 9: 'giustificato', 10: 'presente', 11: 'assente' },
    conPiano: true,
  },
  {
    giorni: -9, ora: '21:00', tema: 'Palle inattive', luogo: 'CS Bonola, campo 2',
    presenze: { 0: 'presente', 1: 'presente', 3: 'assente', 4: 'presente', 5: 'presente', 6: 'presente', 7: 'presente', 8: 'giustificato', 9: 'presente', 10: 'presente', 11: 'assente' },
  },
  {
    giorni: -5, ora: '21:00', tema: 'Ripartenze', luogo: 'CS Bonola, campo 2',
    presenze: { 0: 'presente', 1: 'presente', 3: 'presente', 4: 'giustificato', 5: 'presente', 6: 'presente', 7: 'assente', 8: 'presente', 9: 'presente', 10: 'presente', 11: 'presente' },
    conPiano: true,
  },
  {
    giorni: -2, ora: '21:00', tema: 'Prova formazione', luogo: 'CS Bonola, campo 2',
    presenze: { 0: 'presente', 1: 'presente', 3: 'presente', 4: 'presente', 5: 'presente', 6: 'assente', 7: 'presente', 8: 'presente', 9: 'assente', 10: 'presente', 11: 'giustificato' },
    note: 'Provata la difesa a tre: serve un altro passaggio, i centrali si guardano ancora troppo',
  },
]

const dataRelativa = (giorni) => {
  const d = new Date()
  d.setDate(d.getDate() + giorni)
  return d.toISOString().slice(0, 10)
}

// Voci di manuale demo: il tipo di cose che un mister si dimentica di aver
// deciso tre settimane dopo averle decise.
const DEMO_MANUALE = [
  {
    categoria: 'principi',
    titolo: 'Come usciamo dal pressing alto',
    testo: `Primo passaggio sempre sul difensore libero, mai sul centrale marcato.
Se ci pressano in due, il portiere diventa il terzo uomo: si allarga e riceve.
Quando non c'è la giocata corta, palla lunga sul lato debole — non in mezzo.`,
  },
  {
    categoria: 'protocollo',
    titolo: 'Protocollo pre-partita',
    testo: `Ritrovo 45 minuti prima. Chi arriva a meno di 20 minuti non parte titolare.
Formazione comunicata in spogliatoio, mai in chat.
Riscaldamento: 10 attivazione, 5 possesso, 5 conclusioni, 5 palle inattive.`,
  },
  {
    categoria: 'psicologia',
    titolo: 'Chi va incoraggiato e chi va ripreso',
    testo: `Gestione errore passiva: si spegne dopo lo sbaglio, va ripreso a fine partita e mai davanti al gruppo.
Gestione errore attiva: regge la ripresa immediata, anzi la usa per rientrare in partita.
È segnato sulla scheda di ogni giocatore.`,
  },
  {
    categoria: 'regole',
    titolo: 'Regole del torneo da non dimenticare',
    testo: `Cambi liberi ma solo a gioco fermo e dal centrocampo.
Due ammonizioni pesano sulla giornata dopo: la seconda ammonizione squalifica.
Senza cartellino di tesseramento non si scende in campo, nemmeno con il documento.`,
  },
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
  const competitionIds = await db.competitions.bulkAdd(
    DEMO_COMPETITIONS.map((c) => ({ ...c, demo: true })),
    { allKeys: true }
  )
  const opponentIds = await db.opponents.bulkAdd(
    DEMO_OPPONENTS.map((o) => ({ ...o, demo: true })),
    { allKeys: true }
  )
  // Il formato lo decide la squadra (onboarding): il modulo demo lo segue.
  const team = await db.meta.get('team')
  const formato = FORMATI.includes(team?.formato) ? team.formato : 7
  const moduloKey = MODULO_DEFAULT[formato]
  const modulo = MODULI_FORMATO[formato][moduloKey]

  await db.matches.bulkAdd(
    DEMO_MATCHES.map(({ giorni, oppIdx, compIdx, convocatiIdx, referto, ...m }) => {
      const convocati = convocatiIdx ?? []
      const riga = {
        ...m,
        data: dataRelativa(giorni),
        opponentId: opponentIds[oppIdx],
        competitionId: competitionIds[compIdx],
        convocati: convocati.map((n) => playerIds[n]),
        golFatti: m.golFatti ?? null,
        golSubiti: m.golSubiti ?? null,
        demo: true,
      }
      if (!referto) return riga

      const schieratiIdx = schieraDemo(modulo, convocati)
      const panchinaIdx = convocati.filter((i) => !schieratiIdx.includes(i))
      const eventiIdx = refertoDemo(modulo, schieratiIdx, panchinaIdx)
      // gli eventi nascono con gli indici demo: qui diventano id veri
      const conId = (i) => (i == null ? null : playerIds[i])
      const eventi = eventiIdx.map((ev) => ({
        ...ev,
        playerId: conId(ev.playerId),
        assistId: conId(ev.assistId),
        outId: conId(ev.outId),
        inId: conId(ev.inId),
      }))
      const slots = schieratiIdx.map(conId)
      const { minuti, portaMinuti } = calcolaMinuti({
        titolari: slots.filter(Boolean),
        eventi,
        durata: DURATA_DEFAULT,
        portiereIniziale: portiereIniziale({ slots }, modulo.slots.map((sl) => sl.sigla)),
      })
      return {
        ...riga,
        formazione: {
          formato,
          modulo: moduloKey,
          slots,
          impostazione: 'possesso',
          costruzione: 'equilibrata',
          linea: 'normale',
        },
        durata: DURATA_DEFAULT,
        eventi,
        minuti,
        portaMinuti,
      }
    })
  )
  await db.sessionPlans.add({ ...DEMO_PIANO, isTemplate: true, demo: true })
  await db.manualEntries.bulkAdd(DEMO_MANUALE.map((v) => ({ ...v, demo: true })))
  // Capitano designato: Matteo Villa, quello segnato come leader del gruppo
  await db.meta.put({ key: 'capitano', value: playerIds[5] })
  await db.trainings.bulkAdd(
    DEMO_TRAININGS.map(({ giorni, presenze, conPiano, ...t }) => ({
      ...t,
      data: dataRelativa(giorni),
      presenze: Object.fromEntries(
        Object.entries(presenze).map(([idx, stato]) => [playerIds[Number(idx)], stato])
      ),
      piano: conPiano
        ? { obiettivo: DEMO_PIANO.obiettivo, blocchi: DEMO_PIANO.blocchi }
        : { obiettivo: '', blocchi: [] },
      demo: true,
    }))
  )

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

  // Il capitano vive in `meta`, che non ha il flag demo: se puntava a un
  // giocatore appena cancellato, la fascia va tolta insieme a lui.
  const capitano = await db.meta.get('capitano')
  if (capitano?.value != null && !(await db.players.get(capitano.value))) {
    await db.meta.delete('capitano')
  }
}
