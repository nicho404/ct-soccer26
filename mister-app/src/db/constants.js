// Posizioni con le sigle stile FC26.
// Colori per famiglia: giallo portiere, verde difesa, blu centrocampo, rosso attacco.
export const RUOLI = [
  { value: 'POR', label: 'Portiere', famiglia: 'por' },
  { value: 'DC', label: 'Difensore centrale', famiglia: 'dif' },
  { value: 'TD', label: 'Terzino destro', famiglia: 'dif' },
  { value: 'TS', label: 'Terzino sinistro', famiglia: 'dif' },
  { value: 'CDC', label: 'Centrocampista difensivo', famiglia: 'cen' },
  { value: 'CC', label: 'Centrocampista centrale', famiglia: 'cen' },
  { value: 'COC', label: 'Centrocampista offensivo', famiglia: 'cen' },
  { value: 'ED', label: 'Esterno destro', famiglia: 'cen' },
  { value: 'ES', label: 'Esterno sinistro', famiglia: 'cen' },
  { value: 'AD', label: 'Ala destra', famiglia: 'att' },
  { value: 'AS', label: 'Ala sinistra', famiglia: 'att' },
  { value: 'ATT', label: 'Attaccante', famiglia: 'att' },
]

export const ruoloLabel = (value) =>
  RUOLI.find((r) => r.value === value)?.label ?? value ?? '—'

export const famigliaRuolo = (value) =>
  RUOLI.find((r) => r.value === value)?.famiglia ?? ''

// Ordine di presentazione della rosa (POR → ATT)
export const ruoloOrdine = (value) => {
  const i = RUOLI.findIndex((r) => r.value === value)
  return i === -1 ? RUOLI.length : i
}

// Famiglie di reparto, per raggruppare posizioni e ruoli tattici
export const FAMIGLIE = [
  { value: 'por', label: 'Portiere' },
  { value: 'dif', label: 'Difesa' },
  { value: 'cen', label: 'Centrocampo' },
  { value: 'att', label: 'Attacco' },
]

// Ruoli tattici 1:1 con FC26 (31 ruoli, per posizione).
// `posizioni` = sigle che vedono il ruolo; `en` = nome originale nel gioco.
export const RUOLI_TATTICI = [
  // Portiere (POR)
  { value: 'Portiere', en: 'Goalkeeper', posizioni: ['POR'], descrizione: 'Portiere tradizionale: resta sulla linea di porta e si concentra sulle parate.' },
  { value: 'Portiere libero', en: 'Sweeper Keeper', posizioni: ['POR'], descrizione: 'Portiere moderno: esce a fermare gli attacchi e partecipa alla costruzione come opzione di passaggio.' },
  { value: 'Portiere costruttore', en: 'Ball-Playing Keeper', posizioni: ['POR'], descrizione: 'Sale al limite della propria trequarti quando la squadra ha palla: un uomo in più per aggirare il pressing.' },
  // Difensore centrale (DC)
  { value: 'Difensore', en: 'Defender', posizioni: ['DC'], descrizione: 'Centrale senza fronzoli: posizione, anticipo, spazzata. Eccelle nei fondamentali difensivi.' },
  { value: 'Stopper', en: 'Stopper', posizioni: ['DC'], descrizione: 'Centrale aggressivo che esce dalla linea per aggredire l\'attaccante e recuperare palla.' },
  { value: 'Difensore costruttore', en: 'Ball-Playing Defender', posizioni: ['DC'], descrizione: 'Centrale moderno, a suo agio col pallone: imposta l\'azione dal basso.' },
  { value: 'Difensore largo', en: 'Wide Back', posizioni: ['DC'], descrizione: 'Centrale che si allarga a coprire la zona dei terzini saliti o assenti. Ideale in difesa a tre.' },
  // Terzini (TD/TS)
  { value: 'Terzino', en: 'Fullback', posizioni: ['TD', 'TS'], descrizione: 'Difensore di fascia che dà priorità alla protezione della propria porta.' },
  { value: 'Falso terzino', en: 'Falseback', posizioni: ['TD', 'TS'], descrizione: 'Evoluzione moderna del terzino: in possesso stringe in mezzo al campo come mediano aggiunto.' },
  { value: 'Fluidificante', en: 'Wingback', posizioni: ['TD', 'TS'], descrizione: 'Corsa e resistenza al servizio della fascia: spinge per supportare l\'attacco e rientra a coprire.' },
  { value: 'Fluidificante offensivo', en: 'Attacking Wingback', posizioni: ['TD', 'TS'], descrizione: 'Tecnicamente un difensore, ma pensa soprattutto ad attaccare la fascia.' },
  { value: 'Terzino invertito', en: 'Inverted Wingback', posizioni: ['TD', 'TS'], descrizione: 'In possesso avanza e stringe verso il centro per dare superiorità in mezzo al campo.' },
  // Centrocampista difensivo (CDC)
  { value: 'Mediano', en: 'Holding', posizioni: ['CDC', 'CC'], descrizione: 'Centrocampista difensivo dedicato a proteggere la linea arretrata e schermare le linee di passaggio.' },
  { value: 'Centromediano', en: 'Centre-Half', posizioni: ['CDC'], descrizione: 'Mediano che in costruzione si abbassa tra i centrali, formando una difesa a tre temporanea.' },
  { value: 'Regista arretrato', en: 'Deep-Lying Playmaker', posizioni: ['CDC', 'CC'], descrizione: 'Costruisce il gioco da posizione bassa, davanti alla difesa: il primo regista della squadra.' },
  { value: 'Mediano laterale', en: 'Wide Half', posizioni: ['CDC'], descrizione: 'Mediano che copre le corsie laterali del campo in fase difensiva.' },
  { value: 'Incursore', en: 'Box Crasher', posizioni: ['CDC'], descrizione: 'Mediano che sceglie i tempi per inserirsi in area avversaria con corse in ritardo.' },
  // Centrocampista centrale (CC)
  { value: 'Box-to-box', en: 'Box-to-Box', posizioni: ['CC'], descrizione: 'Copre il campo da area ad area: recupera dietro e si inserisce davanti. Il motore della squadra.' },
  { value: 'Regista', en: 'Playmaker', posizioni: ['CC', 'COC'], descrizione: 'Il fulcro creativo: si muove tra le linee per ricevere e creare occasioni.' },
  { value: 'Mezzala', en: 'Half-Winger', posizioni: ['CC', 'COC'], descrizione: 'Centrocampista versatile che agisce nel mezzo spazio, tra centro e fascia.' },
  // Centrocampista offensivo (COC)
  { value: 'Attaccante ombra', en: 'Shadow Striker', posizioni: ['COC'], descrizione: 'Gioca alle spalle della punta e attacca l\'area come un secondo attaccante.' },
  { value: 'Classico 10', en: 'Classic 10', posizioni: ['COC'], descrizione: 'Trequartista puro, centro della creatività: pochi compiti difensivi, tutta qualità tra le linee.' },
  // Esterni di centrocampo (ED/ES) e ali (AD/AS)
  { value: 'Ala', en: 'Winger', posizioni: ['ED', 'ES', 'AD', 'AS'], descrizione: 'Resta largo col gesso sulla riga: punta l\'uomo e mette palloni in mezzo.' },
  { value: 'Esterno di centrocampo', en: 'Wide Midfielder', posizioni: ['ED', 'ES'], descrizione: 'Esterno equilibrato: dà ampiezza in possesso e rientra a coprire la fascia.' },
  { value: 'Regista largo', en: 'Wide Playmaker', posizioni: ['ED', 'ES', 'AD', 'AS'], descrizione: 'Creativo che parte largo ma converge verso il centro per cucire il gioco.' },
  { value: 'Attaccante interno', en: 'Inside Forward', posizioni: ['ED', 'ES', 'AD', 'AS'], descrizione: 'Esterno offensivo che taglia dentro sul piede forte per concludere.' },
  // Attaccante (ATT)
  { value: 'Attaccante avanzato', en: 'Advanced Forward', posizioni: ['ATT'], descrizione: 'Punta versatile che vive sull\'ultima linea, pronta ad attaccare la profondità.' },
  { value: 'Opportunista', en: 'Poacher', posizioni: ['ATT'], descrizione: 'Vive per il gol: resta alto, staziona in area e attacca ogni pallone vagante.' },
  { value: 'Falso 9', en: 'False 9', posizioni: ['ATT'], descrizione: 'Punta che si abbassa tra le linee per legare il gioco e liberare spazio agli inserimenti.' },
  { value: 'Attaccante boa', en: 'Target Forward', posizioni: ['ATT'], descrizione: 'Punta fisica che protegge palla spalle alla porta e fa salire la squadra.' },
]

export const ruoloTatticoInfo = (value) =>
  RUOLI_TATTICI.find((r) => r.value === value)

export const famigliaRuoloTattico = (value) => {
  const r = ruoloTatticoInfo(value)
  return r ? famigliaRuolo(r.posizioni[0]) : ''
}

export const PIEDI = [
  { value: 'destro', label: 'Destro' },
  { value: 'sinistro', label: 'Sinistro' },
  { value: 'ambidestro', label: 'Ambidestro' },
]

// Stato attività: rosa allargata (~28 in chat) vs rosa attiva (~13-14 reali)
export const STATI_ATTIVITA = [
  { value: 'sicuro', label: 'Sicuro', badge: 'ok' },
  { value: 'condizionale', label: 'Condizionale', badge: 'accent' },
  { value: 'tiepido', label: 'Tiepido', badge: 'warn' },
  { value: 'infortunato', label: 'Infortunato', badge: 'danger' },
  { value: 'inattivo', label: 'Inattivo', badge: '' },
]

export const statoAttivitaInfo = (value) =>
  STATI_ATTIVITA.find((s) => s.value === value) ?? STATI_ATTIVITA[0]

// "Attivo" = fa parte della rosa reale (tutti gli stati tranne inattivo)
export const isAttivo = (player) => player.statoAttivita !== 'inattivo'

export const TESSERAMENTO = [
  { value: 'ok', label: 'Tesserato', badge: 'ok' },
  { value: 'da_verificare', label: 'Da verificare', badge: 'warn' },
  { value: 'non_tesserabile', label: 'Non tesserabile', badge: 'danger' },
]

export const tesseramentoInfo = (value) =>
  TESSERAMENTO.find((t) => t.value === value) ?? TESSERAMENTO[1]

// Niente portiere fisso: serve sapere chi può coprire la porta
export const PORTA = [
  { value: 'si', label: 'Sì' },
  { value: 'emergenza', label: 'In emergenza' },
  { value: 'no', label: 'No' },
]

export const portaInfo = (value) => PORTA.find((p) => p.value === value) ?? PORTA[2]

export const CALCI_FISSI = [
  { key: 'punizioni', label: 'Punizioni' },
  { key: 'angoliDx', label: 'Angoli dx' },
  { key: 'angoliSx', label: 'Angoli sx' },
  { key: 'rigori', label: 'Rigori' },
]

// Criteri fissi di osservazione (modulo M2)
export const CRITERI_OSSERVAZIONE = [
  { key: 'lettura', label: 'Lettura del gioco', hint: 'Si smarca, legge prima di ricevere' },
  { key: 'piedeForte', label: 'Tecnica piede forte', hint: '' },
  { key: 'piedeDebole', label: 'Piede debole', hint: '' },
  { key: 'pressione', label: 'Sotto pressione', hint: 'Si nasconde o si propone' },
  { key: 'intensita', label: 'Intensità / corsa', hint: '' },
  { key: 'leadership', label: 'Leadership', hint: 'Parla, organizza, viene ascoltato' },
  { key: 'posizione', label: 'Disciplina posizionale', hint: '' },
]

export const STATI_PRESENZA = [
  { value: 'presente', label: 'Presente' },
  { value: 'assente', label: 'Assente' },
  { value: 'giustificato', label: 'Assente giustificato' },
]

// Tipi di intesa tra giocatori, con colore linea sul campo
export const TIPI_INTESA = [
  { value: 'confermata', label: 'Confermata', colore: '#4ade80' },
  { value: 'potenziale', label: 'Potenziale', colore: '#9a9aad' },
  { value: 'speciale', label: 'Speciale (catena)', colore: '#a78bfa' },
  { value: 'pattern', label: 'Pattern specifico', colore: '#ffffff' },
]

export const TIPI_COMPETIZIONE = [
  { value: 'campionato', label: 'Campionato' },
  { value: 'coppa', label: 'Coppa' },
  { value: 'amichevoli', label: 'Amichevoli' },
]

export const CATEGORIE_MANUALE = [
  { value: 'tattica', label: 'Tattica' },
  { value: 'protocollo', label: 'Protocolli' },
  { value: 'psicologia', label: 'Psicologia / gruppo' },
  { value: 'regole', label: 'Regole CSI' },
  { value: 'principi', label: 'Principi' },
]
