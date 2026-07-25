// Dominio del motore tattico (vedi docs/mappa-tattica.md — fonte di verità).
// Solo dati puri: nessuna dipendenza da Dexie, React o DOM.
//
// Ogni ruolo ha quattro campi. `codice` è uso interno (motore, persistenza,
// migration): non deve MAI comparire in UI. `posizione` è la sigla di campo
// mostrata in grande sullo slot. `nome` è l'etichetta leggibile (stile FC26,
// riusata da src/db/constants.js dove il concetto coincide). `compito` è la
// frase che il mister dice al giocatore, mostrata al tap.

// Zone di campo (competenza degli assi costruzione/impostazione)
export const ZONE = {
  PORTIERE: 'portiere',
  DIFENSORE_CENTRALE: 'difensore-centrale',
  TERZINO: 'terzino',
  MEDIANO: 'mediano',
  CENTROCAMPISTA_CENTRALE: 'centrocampista-centrale',
  ESTERNO_OFFENSIVO: 'esterno-offensivo',
  PUNTA: 'punta',
}

// Sigla di posizione mostrata sullo slot, per zona (usata anche per il
// mapping generico sigla→zona qui sotto)
const POSIZIONE_PER_ZONA = {
  [ZONE.PORTIERE]: ['POR'],
  [ZONE.DIFENSORE_CENTRALE]: ['DC'],
  [ZONE.TERZINO]: ['TD', 'TS'],
  [ZONE.MEDIANO]: ['MED'],
  [ZONE.CENTROCAMPISTA_CENTRALE]: ['CC'],
  [ZONE.ESTERNO_OFFENSIVO]: ['ED', 'ES'],
  [ZONE.PUNTA]: ['ATT'],
}

// Mapping generico sigla-slot (quelle già usate in src/lib/formazioni.js
// dentro MODULI_FORMATO) → zona. Sostituisce una tabella statica
// slotIndex→zona per ciascun modulo: i moduli restano un'unica fonte di
// verità in formazioni.js, qui si interpreta solo la sigla che espongono.
export const SIGLA_ZONA = {
  POR: ZONE.PORTIERE,
  DC: ZONE.DIFENSORE_CENTRALE,
  TD: ZONE.TERZINO,
  TS: ZONE.TERZINO,
  CDC: ZONE.MEDIANO,
  MED: ZONE.MEDIANO,
  CC: ZONE.CENTROCAMPISTA_CENTRALE,
  COC: ZONE.CENTROCAMPISTA_CENTRALE,
  ED: ZONE.ESTERNO_OFFENSIVO,
  ES: ZONE.ESTERNO_OFFENSIVO,
  AD: ZONE.ESTERNO_OFFENSIVO,
  AS: ZONE.ESTERNO_OFFENSIVO,
  ATT: ZONE.PUNTA,
}

export const zonaSigla = (sigla) => SIGLA_ZONA[sigla]

// Vocabolario ruoli — set chiuso, 27 codici (vedi mappa-tattica.md §1).
export const RUOLI = [
  // Portiere
  { codice: 'POR-C', zona: ZONE.PORTIERE, posizione: POSIZIONE_PER_ZONA[ZONE.PORTIERE], nome: 'Portiere costruttore', compito: 'Gioca coi piedi, si alza a bordo area: sei la prima linea di passaggio.' },
  { codice: 'POR-E', zona: ZONE.PORTIERE, posizione: POSIZIONE_PER_ZONA[ZONE.PORTIERE], nome: 'Portiere di reparto', compito: 'Scegli tu: corto se sei libero, lungo se sei pressato.' },
  { codice: 'POR-L', zona: ZONE.PORTIERE, posizione: POSIZIONE_PER_ZONA[ZONE.PORTIERE], nome: 'Portiere di rilancio', compito: 'Rinvio diretto, zero rischio: non cercare l\'uscita dal basso.' },
  // Difensori centrali
  { codice: 'DC-C', zona: ZONE.DIFENSORE_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.DIFENSORE_CENTRALE], nome: 'Difensore costruttore', compito: 'Esci palla al piede, rompi la prima linea avversaria con un passaggio in verticale.' },
  { codice: 'DC-A', zona: ZONE.DIFENSORE_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.DIFENSORE_CENTRALE], nome: 'Difensore largo', compito: 'Allargati in costruzione per creare superiorità numerica sul lato.' },
  { codice: 'DC-P', zona: ZONE.DIFENSORE_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.DIFENSORE_CENTRALE], nome: 'Difensore', compito: 'Tieni la linea, gioca semplice: niente rischi in impostazione.' },
  { codice: 'DC-M', zona: ZONE.DIFENSORE_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.DIFENSORE_CENTRALE], nome: 'Stopper', compito: 'Sei aggressivo sul tuo diretto: anticipa, non pensare a costruire.' },
  { codice: 'DC-B', zona: ZONE.DIFENSORE_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.DIFENSORE_CENTRALE], nome: 'Centrale bloccato', compito: 'Non superare mai la linea della palla: resta sempre coperto.' },
  // Terzini / esterni bassi
  { codice: 'T-S', zona: ZONE.TERZINO, posizione: POSIZIONE_PER_ZONA[ZONE.TERZINO], nome: 'Terzino di spinta', compito: 'Sali sempre: dai ampiezza alta per tutta la partita.' },
  { codice: 'T-E', zona: ZONE.TERZINO, posizione: POSIZIONE_PER_ZONA[ZONE.TERZINO], nome: 'Tornante', compito: 'Sali a turno col tuo gemello: mai insieme in proiezione offensiva.' },
  { codice: 'T-B', zona: ZONE.TERZINO, posizione: POSIZIONE_PER_ZONA[ZONE.TERZINO], nome: 'Terzino', compito: 'Resta basso: sei parte di una difesa a tre permanente.' },
  // Mediani
  { codice: 'M-R', zona: ZONE.MEDIANO, posizione: POSIZIONE_PER_ZONA[ZONE.MEDIANO], nome: 'Regista arretrato', compito: 'Abbassati tra i centrali: sei sempre la linea di passaggio pulita.' },
  { codice: 'M-F', zona: ZONE.MEDIANO, posizione: POSIZIONE_PER_ZONA[ZONE.MEDIANO], nome: 'Mediano', compito: 'Fai schermo davanti alla difesa: prima tocco di ripartenza, poi verticalizza.' },
  { codice: 'M-E', zona: ZONE.MEDIANO, posizione: POSIZIONE_PER_ZONA[ZONE.MEDIANO], nome: 'Mediano equilibratore', compito: 'Resta centrale quando salgono gli esterni, scala in copertura quando la difesa si accorcia.' },
  // Centrocampisti centrali
  { codice: 'CC-C', zona: ZONE.CENTROCAMPISTA_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.CENTROCAMPISTA_CENTRALE], nome: 'Regista', compito: 'Ricevi tra le linee e gira il gioco da un lato all\'altro.' },
  { codice: 'CC-M', zona: ZONE.CENTROCAMPISTA_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.CENTROCAMPISTA_CENTRALE], nome: 'Mezzala', compito: 'Attacca lo spazio in avanti: inseriti quando parte l\'azione.' },
  { codice: 'CC-I', zona: ZONE.CENTROCAMPISTA_CENTRALE, posizione: POSIZIONE_PER_ZONA[ZONE.CENTROCAMPISTA_CENTRALE], nome: 'Incursore in area', compito: 'Entra in area sul cross o sulla seconda palla: il tuo momento è lì.' },
  // Esterni offensivi
  { codice: 'E-A', zona: ZONE.ESTERNO_OFFENSIVO, posizione: POSIZIONE_PER_ZONA[ZONE.ESTERNO_OFFENSIVO], nome: 'Esterno di ampiezza', compito: 'Resta largo e alto: allunghi la difesa avversaria anche senza toccare palla.' },
  { codice: 'E-X', zona: ZONE.ESTERNO_OFFENSIVO, posizione: POSIZIONE_PER_ZONA[ZONE.ESTERNO_OFFENSIVO], nome: 'Ala', compito: 'Punta il fondo e mette dentro: cross basso o teso in mezzo.' },
  { codice: 'E-I', zona: ZONE.ESTERNO_OFFENSIVO, posizione: POSIZIONE_PER_ZONA[ZONE.ESTERNO_OFFENSIVO], nome: 'Attaccante interno', compito: 'Converge dentro sul piede forte: liberi la fascia per l\'inserimento del terzino.' },
  { codice: 'E-S', zona: ZONE.ESTERNO_OFFENSIVO, posizione: POSIZIONE_PER_ZONA[ZONE.ESTERNO_OFFENSIVO], nome: 'Esterno di strappo', compito: 'Ricevi e vai in campo aperto: il tuo strappo è l\'arma, non il possesso.' },
  { codice: 'E-T', zona: ZONE.ESTERNO_OFFENSIVO, posizione: POSIZIONE_PER_ZONA[ZONE.ESTERNO_OFFENSIVO], nome: 'Esterno di centrocampo', compito: 'Basso quando difendi, alto in ripartenza: due fasi, stessa corsia.' },
  // Punta
  { codice: 'P-9', zona: ZONE.PUNTA, posizione: POSIZIONE_PER_ZONA[ZONE.PUNTA], nome: 'Falso 9', compito: 'Abbassati tra le linee per legare il gioco, poi scatta in area sul pallone giusto.' },
  { codice: 'P-A', zona: ZONE.PUNTA, posizione: POSIZIONE_PER_ZONA[ZONE.PUNTA], nome: 'Opportunista', compito: 'Vivi in area: raccogli ogni pallone vagante e finalizza.' },
  { codice: 'P-T', zona: ZONE.PUNTA, posizione: POSIZIONE_PER_ZONA[ZONE.PUNTA], nome: 'Attaccante boa', compito: 'Fai sponda sulla palla lunga: gioca di corpo, fai salire la squadra.' },
  { codice: 'P-P', zona: ZONE.PUNTA, posizione: POSIZIONE_PER_ZONA[ZONE.PUNTA], nome: 'Attaccante avanzato', compito: 'Attacca lo spazio alle spalle della difesa: la tua profondità è il vantaggio.' },
  { codice: 'P-1', zona: ZONE.PUNTA, posizione: POSIZIONE_PER_ZONA[ZONE.PUNTA], nome: 'Punta di prima pressione', compito: 'Guida il pressing sui difensori avversari: ti sacrifichi per orientare la squadra.' },
]

export const ruoloInfo = (codice) => RUOLI.find((r) => r.codice === codice)
export const ruoloPerNome = (nome) => RUOLI.find((r) => r.nome === nome)
export const ruoliZona = (zona) => RUOLI.filter((r) => r.zona === zona)

// Vocabolario ruoli di NON possesso — namespace separato (`N-*`), mai
// mescolato con RUOLI. Niente `posizione`: la sigla mostrata sullo slot
// resta quella del modulo, cambia solo il compito (mappa-tattica.md §1-bis).
export const RUOLI_NP = [
  // Portiere
  { codice: 'N-POR-S', zona: ZONE.PORTIERE, nome: 'Portiere libero', compito: 'Esci alto fuori area: lo spazio dietro la linea lo copri tu.' },
  { codice: 'N-POR-E', zona: ZONE.PORTIERE, nome: 'Portiere di reparto', compito: 'Leggi la profondità, esci solo sulla palla che puoi prendere.' },
  { codice: 'N-POR-A', zona: ZONE.PORTIERE, nome: 'Portiere d\'area', compito: 'Resta in area, non uscire mai in anticipo.' },
  // Difensori centrali
  { codice: 'N-DC-A', zona: ZONE.DIFENSORE_CENTRALE, nome: 'Difensore d\'anticipo', compito: 'Esci sul tuo diretto prima che riceva, difendi in avanti.' },
  { codice: 'N-DC-L', zona: ZONE.DIFENSORE_CENTRALE, nome: 'Difensore di linea', compito: 'Tieni la linea col reparto, sali e scala insieme agli altri.' },
  { codice: 'N-DC-C', zona: ZONE.DIFENSORE_CENTRALE, nome: 'Difensore di copertura', compito: 'Ultimo uomo: non uscire mai, copri chi esce.' },
  // Terzini / esterni bassi
  { codice: 'N-T-P', zona: ZONE.TERZINO, nome: 'Terzino in pressione', compito: 'Sali sull\'esterno avversario appena la palla va sul tuo lato.' },
  { codice: 'N-T-S', zona: ZONE.TERZINO, nome: 'Terzino che stringe', compito: 'Accorciati dentro sul lato debole, fai il terzo centrale.' },
  { codice: 'N-T-B', zona: ZONE.TERZINO, nome: 'Terzino bloccato', compito: 'Resta basso in linea, non seguire mai fuori zona.' },
  // Mediano
  { codice: 'N-M-A', zona: ZONE.MEDIANO, nome: 'Mediano aggressore', compito: 'Esci sul portatore in mezzo, vai a raddoppiare.' },
  { codice: 'N-M-S', zona: ZONE.MEDIANO, nome: 'Mediano schermo', compito: 'Stai davanti alla difesa e chiudi il centro, non inseguire.' },
  { codice: 'N-M-C', zona: ZONE.MEDIANO, nome: 'Mediano di copertura', compito: 'Scala tra i centrali quando uno esce, tappa il buco.' },
  // Centrocampisti centrali
  { codice: 'N-CC-P', zona: ZONE.CENTROCAMPISTA_CENTRALE, nome: 'Primo pressore centrale', compito: 'Aggredisci chi riceve in mezzo, non dargli il tempo di girarsi.' },
  { codice: 'N-CC-R', zona: ZONE.CENTROCAMPISTA_CENTRALE, nome: 'Riferimento sul regista', compito: 'Il loro uomo di regia è tuo: stagli addosso ovunque vada.' },
  { codice: 'N-CC-B', zona: ZONE.CENTROCAMPISTA_CENTRALE, nome: 'Rientro basso', compito: 'Torna dentro la linea di centrocampo, fai densità.' },
  // Esterni
  { codice: 'N-E-P', zona: ZONE.ESTERNO_OFFENSIVO, nome: 'Esterno in pressione', compito: 'Vai sul portatore sulla tua fascia, indirizzalo verso il fondo.' },
  { codice: 'N-E-T', zona: ZONE.ESTERNO_OFFENSIVO, nome: 'Tornante difensivo', compito: 'Rientra a fare il quarto/quinto di linea, sempre.' },
  { codice: 'N-E-I', zona: ZONE.ESTERNO_OFFENSIVO, nome: 'Esterno che stringe', compito: 'Chiuditi dentro sul centro, il cross esterno glielo concedi.' },
  // Punta
  { codice: 'N-P-1', zona: ZONE.PUNTA, nome: 'Prima pressione', compito: 'Attacca il portatore e indirizzalo su un solo lato, sempre lo stesso.' },
  { codice: 'N-P-S', zona: ZONE.PUNTA, nome: 'Punta schermo', compito: 'Non inseguire: resta sul loro uomo di regia e chiudi la linea centrale.' },
  { codice: 'N-P-R', zona: ZONE.PUNTA, nome: 'Punta di riferimento', compito: 'Resta alta, non rientrare: sei tu la palla d\'uscita.' },
]

export const ruoloNpInfo = (codice) => RUOLI_NP.find((r) => r.codice === codice)
export const ruoliNpZona = (zona) => RUOLI_NP.filter((r) => r.zona === zona)

// Famiglia di reparto (por/dif/cen/att, vedi src/db/constants.js FAMIGLIE)
// per un ruolo tattico del motore, individuato per nome — usata per i badge
// colorati nelle schede giocatore.
const FAMIGLIA_PER_ZONA = {
  [ZONE.PORTIERE]: 'por',
  [ZONE.DIFENSORE_CENTRALE]: 'dif',
  [ZONE.TERZINO]: 'dif',
  [ZONE.MEDIANO]: 'cen',
  [ZONE.CENTROCAMPISTA_CENTRALE]: 'cen',
  [ZONE.ESTERNO_OFFENSIVO]: 'cen',
  [ZONE.PUNTA]: 'att',
}
export const famigliaRuoloTattico = (nome) => FAMIGLIA_PER_ZONA[ruoloPerNome(nome)?.zona] ?? ''

// Impostazione tattica (ultimo terzo — come attacchi)
export const IMPOSTAZIONI = [
  { value: 'possesso', label: 'Possesso palla' },
  { value: 'ali', label: 'Gioco sulle ali' },
  { value: 'lunga', label: 'Palla lunga' },
  { value: 'contropiede', label: 'Contropiede' },
  { value: 'oltranza', label: 'Difesa a oltranza' },
]

// Costruzione (primo terzo — come esci)
export const COSTRUZIONI = [
  { value: 'corti', label: 'Passaggi corti' },
  { value: 'equilibrata', label: 'Equilibrata' },
  { value: 'diretta', label: 'Contropiede (diretta)' },
]

// Altezza della linea difensiva (fase di non possesso)
export const LINEE = [
  { value: 'alta', label: 'Alta' },
  { value: 'normale', label: 'Normale' },
  { value: 'bassa', label: 'Bassa' },
]

// Matrice A — costruzione → primo terzo (mappa-tattica.md §2).
// dcLaterale copre lo slot DC non centrale in difesa a tre; terzino copre
// lo slot TD/TS in difesa a quattro — stesso principio della costruzione,
// espresso con i codici propri della zona (T-S/T-E/T-B rispecchiano
// 1:1 la logica di DC-A/DC-P/DC-B).
export const MATRICE_COSTRUZIONE = {
  corti: { portiere: 'POR-C', dcCentrale: 'DC-C', dcLaterale: 'DC-A', terzino: 'T-S', mediano: 'M-R' },
  equilibrata: { portiere: 'POR-E', dcCentrale: 'DC-P', dcLaterale: 'DC-P', terzino: 'T-E', mediano: 'M-E' },
  diretta: { portiere: 'POR-L', dcCentrale: 'DC-M', dcLaterale: 'DC-B', terzino: 'T-B', mediano: 'M-F' },
}

// Matrice B — impostazione → ultimo terzo (mappa-tattica.md §3).
export const MATRICE_IMPOSTAZIONE = {
  possesso: { esterno: 'E-A', ccOffensivo: 'CC-C', punta: 'P-9', ampiezza: 'Alta', uominiArea: '2-3' },
  ali: { esterno: 'E-X', ccOffensivo: 'CC-I', punta: 'P-A', ampiezza: 'Massima', uominiArea: '3-4' },
  lunga: { esterno: 'E-T', ccOffensivo: 'CC-I', punta: 'P-T', ampiezza: 'Media', uominiArea: '2-3 sulla seconda palla' },
  contropiede: { esterno: 'E-S', ccOffensivo: 'CC-M', punta: 'P-P', ampiezza: 'Bassa → esplode', uominiArea: '2' },
  oltranza: { esterno: 'E-T', ccOffensivo: 'CC-C', punta: 'P-1', ampiezza: 'Minima', uominiArea: '1', nota: 'CC-C giocato basso, non da rifinitore' },
}

// Matrice di coerenza — impostazione × costruzione → livello + messaggio
// (mappa-tattica.md §4). Le tre incoerenze critiche del documento: due sono
// qui (possesso+diretta, oltranza+corti), la terza (contropiede+lineaAlta)
// è in LINEA_COERENTE perché coinvolge la linea, non la costruzione.
export const MATRICE_COERENZA = {
  possesso: {
    corti: { livello: 'ok', messaggio: 'Coerente: superiorità numerica dietro per costruire con calma.' },
    equilibrata: { livello: 'warn', messaggio: 'Tiepido: il possesso nasce solo se la squadra sceglie sempre il corto.' },
    diretta: { livello: 'rotto', messaggio: 'Si annulla: chiedi alla squadra di far girare palla ma la butti via appena esce. Il possesso non nasce mai.' },
  },
  ali: {
    corti: { livello: 'ok', messaggio: 'Coerente: costruzione paziente per innescare gli esterni con qualità.' },
    equilibrata: { livello: 'ok', messaggio: 'Coerente: uscita flessibile, gli esterni ricevono comunque in ampiezza.' },
    diretta: { livello: 'warn', messaggio: 'Solo su strappo: gli esterni ricevono per vie brevi, non con superiorità costruita.' },
  },
  lunga: {
    corti: { livello: 'rotto', messaggio: 'Contraddittorio: costruisci corto sotto pressione per poi buttare tutto lungo. Rischio massimo, beneficio nullo.' },
    equilibrata: { livello: 'warn', messaggio: 'Ibrido: funziona solo se la squadra riconosce subito quando rinunciare al corto.' },
    diretta: { livello: 'ok', messaggio: 'Coerente: il campo lo attacchi col lancio, la costruzione è già orientata a saltare le linee.' },
  },
  contropiede: {
    corti: { livello: 'rotto', messaggio: 'Contraddittorio: costruire palleggiando è l\'opposto della ripartenza rapida che stai chiedendo.' },
    equilibrata: { livello: 'warn', messaggio: 'Ibrido: la squadra deve leggere bene il momento per non perdere lo spazio della ripartenza.' },
    diretta: { livello: 'ok', messaggio: 'Coerente: prima palla verticale, zero rischio, subito in ripartenza.' },
  },
  oltranza: {
    corti: { livello: 'rotto', messaggio: 'Suicida: costruire corto sotto pressione dentro la propria area è il modo più veloce di regalare un gol.' },
    equilibrata: { livello: 'warn', messaggio: 'Rischioso: un solo errore in uscita, dentro la propria area, può costare la partita.' },
    diretta: { livello: 'ok', messaggio: 'Coerente: zero rischio in uscita, tutti sotto la linea della palla.' },
  },
}

// Linea difensiva coerente per impostazione (mappa-tattica.md §4).
// `raccomandate` → livello "ok"; l'unica incoerenza critica documentata
// (contropiede + linea alta) è "rotto"; ogni altra combinazione è "warn".
export const LINEA_COERENTE = {
  possesso: { raccomandate: ['alta'], messaggio: 'Squadra corta, contropressing immediato.' },
  ali: { raccomandate: ['normale', 'alta'], messaggio: 'Serve campo per i cross, ma non scoprirsi dietro.' },
  lunga: { raccomandate: ['normale'], messaggio: 'Il campo lo attacchi col lancio, non col blocco.' },
  contropiede: { raccomandate: ['normale', 'bassa'], critica: 'alta', messaggio: 'Serve spazio davanti da attaccare.' },
  oltranza: { raccomandate: ['bassa'], messaggio: 'Nessuno spazio alle spalle da concedere.' },
}

// Requisiti strutturali minimi per impostazione: quali zone il modulo DEVE
// possedere perché l'impostazione abbia degli slot su cui scrivere
// (mappa-tattica.md §5). Se mancano, l'impostazione gira a vuoto → "rotto".
// "difensivi" è una chiave composita: DIFENSORE_CENTRALE + TERZINO sommati.
// Nota: solo le impossibilità vere stanno qui. Le fragilità (che dipendono
// dal singolo modulo, non dalla struttura) stanno in ECCEZIONI_MODULO.
export const REQUISITI_IMPOSTAZIONE = {
  ali: { [ZONE.ESTERNO_OFFENSIVO]: 2 },
  oltranza: { difensivi: 3 },
  // possesso / lunga / contropiede: nessun requisito strutturale duro,
  // scrivono su zone che ogni modulo possiede.
}

// Fragilità note modulo × impostazione (mappa-tattica.md §5).
// Chiave = chiave del modulo in MODULI_FORMATO. Livello "warn": il sistema
// segnala, non impedisce. Un modulo assente dalla tabella è "ok" ovunque
// tranne dove i requisiti strutturali lo bocciano. I moduli del calcio a 7
// non hanno eccezioni per ora: la copertura strutturale basta.
export const ECCEZIONI_MODULO = {
  '3-3-1': {
    oltranza: { livello: 'warn', messaggio: 'Un solo mediano e due esterni che devono coprire tutta la fascia: il blocco basso regge solo se gli esterni rientrano ogni volta, senza eccezioni.' },
  },
  '3-1-2-1': {
    lunga: { livello: 'warn', messaggio: 'Nessun esterno che attacca la seconda palla in ampiezza: il lancio ricade sempre sugli stessi due centrali, l\'avversario lo legge dopo dieci minuti.' },
  },
  '2-3-2': {
    possesso: { livello: 'warn', messaggio: 'Due punte tolgono un uomo alla catena del palleggio: il giro palla passa da soli tre centrocampisti, con pressing avversario si spezza.' },
    ali: { livello: 'warn', messaggio: 'Gli esterni escono dai tre di mezzo: se salgono a mettere cross, davanti alla difesa a due non resta nessuno.' },
  },
  '2-4-1': {
    lunga: { livello: 'warn', messaggio: 'La punta è sola sulla sponda e la difesa a due è lontanissima dalla seconda palla: ogni rimbalzo è una ripartenza avversaria.' },
    contropiede: { livello: 'warn', messaggio: 'Quattro centrocampisti in ripartenza sono un vantaggio, ma la difesa a due resta in parità numerica su ogni recupero fallito.' },
  },
}

// Matrice C — linea difensiva → fase di non possesso (mappa-tattica.md §3-bis).
// Stessa forma di MATRICE_COSTRUZIONE / MATRICE_IMPOSTAZIONE: chiavi per zona
// (dcCentrale/dcLaterale distinti per coerenza con le altre matrici, anche
// se qui coincidono).
export const MATRICE_LINEA = {
  alta: {
    portiere: 'N-POR-S', dcCentrale: 'N-DC-A', dcLaterale: 'N-DC-A', terzino: 'N-T-P',
    mediano: 'N-M-A', ccOffensivo: 'N-CC-P', esterno: 'N-E-P', punta: 'N-P-1',
  },
  normale: {
    portiere: 'N-POR-E', dcCentrale: 'N-DC-L', dcLaterale: 'N-DC-L', terzino: 'N-T-S',
    mediano: 'N-M-S', ccOffensivo: 'N-CC-R', esterno: 'N-E-T', punta: 'N-P-S',
  },
  bassa: {
    portiere: 'N-POR-A', dcCentrale: 'N-DC-C', dcLaterale: 'N-DC-C', terzino: 'N-T-B',
    mediano: 'N-M-C', ccOffensivo: 'N-CC-B', esterno: 'N-E-I', punta: 'N-P-R',
  },
}

// Modificatore di transizione — l'impostazione (con palla) determina cosa
// succede nei secondi dopo la perdita. Sovrascrive MATRICE_LINEA per le sole
// zone elencate; se una zona non è qui, vince la linea. `nota` è il
// principio di squadra sulla transizione, non un ruolo di slot.
export const TRANSIZIONE = {
  possesso: {
    punta: 'N-P-1', ccOffensivo: 'N-CC-P',
    nota: 'Contropressing: riaggredisci subito dov\'è persa, i primi cinque secondi sono nostri.',
  },
  ali: {
    nota: 'Riaggredisci sulla fascia dove hai perso, dentro copre chi è rientrato.',
  },
  lunga: {
    punta: 'N-P-R',
    nota: 'Non riaggredire: ricompattati e aspetta la seconda palla.',
  },
  contropiede: {
    punta: 'N-P-R', ccOffensivo: 'N-CC-B', esterno: 'N-E-T',
    nota: 'Ripiega subito dietro la palla: l\'uomo alto resta, gli altri tornano tutti.',
  },
  oltranza: {
    punta: 'N-P-S', ccOffensivo: 'N-CC-B', esterno: 'N-E-I',
    nota: 'Tutti sotto la linea della palla, nessuno esce dal blocco.',
  },
}

// Compressione geometrica in fase di non possesso: la squadra si accorcia
// verso la propria porta (fattoreT) e si stringe verso il centro (fattoreU).
// `ancora` è il t minimo di partenza del blocco. Derivata da {u, t} del
// modulo, non un secondo set di coordinate scritte a mano (mappa-tattica.md §5).
export const COMPRESSIONE = {
  alta: { ancora: 0.26, fattoreT: 0.78, fattoreU: 0.86 },
  normale: { ancora: 0.18, fattoreT: 0.64, fattoreU: 0.80 },
  bassa: { ancora: 0.11, fattoreT: 0.48, fattoreU: 0.72 },
}
