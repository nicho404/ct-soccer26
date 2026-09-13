// Domande di lettura per slot di modulo (M9): sì/no legato ai doveri di
// ruolo della nostra strategia, non un giudizio generico come i criteri di
// osservazione. Le sigle sono quelle degli slot del modulo (lib/formazioni.js
// — POR, DC, ES/ED, CC, ATT…), non i 27 ruoli tattici individuali di
// tactics/constants.js: quello è un altro livello (stile di gioco del
// singolo, non la posizione sul campo).
//
// Fonte: db.manualEntries, categoria 'tattica', voce "Legenda ruoli — cosa
// osservare per ogni posizione". Qui diventano dati strutturati per poter
// generare la checklist automaticamente invece di restare solo in prosa.

const DOMANDE_ESTERNO = [
  { id: 'e_ampiezza', testo: 'Tiene l\'ampiezza quando il compagno dietro si accentra o sale?' },
  { id: 'e_si_stringe', testo: 'Si stringe per aiutare il centrocampista centrale quando l\'avversario affolla il centro?' },
]

export const DOMANDE_PER_SLOT = {
  POR: [
    { id: 'por_esplosivo', testo: 'Si prepara in modo esplosivo prima del tiro (non resta fermo)?' },
    { id: 'por_comando', testo: 'Comanda la difesa a voce?' },
    { id: 'por_rilancio', testo: 'Il rilancio trova un compagno?' },
  ],
  DC: [
    { id: 'dc_lunga_pressato', testo: 'Se pressato gioca lungo subito, senza rischiare in uscita?' },
    { id: 'dc_avanza_libero', testo: 'Se libero avanza palla al piede invece di scaricare di lato?' },
    { id: 'dc_linea', testo: 'Tiene la linea entro la metà campo?' },
    { id: 'dc_uno_esce', testo: 'Su seconda palla larga sulla propria trequarti, esce lui solo se è il suo turno (mai con un altro DC insieme)?' },
  ],
  ES: DOMANDE_ESTERNO,
  ED: DOMANDE_ESTERNO,
  CC: [
    { id: 'cc_inferiorita', testo: 'Gestisce bene i momenti di inferiorità numerica in attesa dell\'aiuto dell\'esterno?' },
    { id: 'cc_schermo', testo: 'Fa da schermo prima di impostare?' },
  ],
  ATT: [
    { id: 'att_posizione', testo: 'Tiene la posizione sull\'ultimo difensore invece di scendere a rincorrere?' },
    { id: 'att_primo_contatto', testo: 'Vince/protegge il primo contatto sul lancio lungo?' },
    { id: 'att_seconda_palla', testo: 'Scende solo sulla seconda palla a centrocampo, poi risale?' },
    { id: 'att_falso9', testo: 'Se ha fatto da falso 9, era su richiesta esplicita del mister e non di iniziativa?' },
  ],
}

// Sigle di modulo senza un set dedicato (TD/TS terzini, CDC/COC mezzeali,
// AD/AS ali) prendono le domande dello slot più vicino per funzione — largo
// o centrale — non per famiglia: un terzino condivide l'ampiezza con
// l'esterno molto più di quanto condivida la lettura in area con un DC.
const ALIAS_SLOT = {
  TD: 'ED', TS: 'ES',
  AD: 'ED', AS: 'ES',
  CDC: 'CC', COC: 'CC',
}

export function domandePerSlot(sigla) {
  return DOMANDE_PER_SLOT[sigla] ?? DOMANDE_PER_SLOT[ALIAS_SLOT[sigla]] ?? []
}

// Criteri di osservazione derivati dalle domande di ruolo (M10): stessa
// domanda, stesso id — solo nella forma { key, label, tipo } che il resto
// del sistema di osservazione già usa, per non duplicare il testo altrove.
export function criteriPerSlot(sigla) {
  return domandePerSlot(sigla).map((d) => ({
    key: d.id,
    label: d.testo,
    short: d.id.split('_').pop().slice(0, 5).toUpperCase(),
    tipo: 'si_no_altro',
  }))
}
