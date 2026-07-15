// Ruoli per calcio a 7.
// Colori: giallo portiere, verde difesa, blu centrocampo, rosso attacco.
export const RUOLI = [
  { value: 'POR', label: 'Portiere' },
  { value: 'DIF', label: 'Difensore' },
  { value: 'EST', label: 'Esterno' },
  { value: 'CEN', label: 'Centrale' },
  { value: 'ATT', label: 'Attaccante' },
]

export const ruoloLabel = (value) =>
  RUOLI.find((r) => r.value === value)?.label ?? value ?? '—'

// Ordine di presentazione della rosa (POR → ATT)
export const ruoloOrdine = (value) => {
  const i = RUOLI.findIndex((r) => r.value === value)
  return i === -1 ? RUOLI.length : i
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
