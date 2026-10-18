// Dal valore di dominio alla sua resa grafica: colori (sempre token CSS) e,
// più avanti, icone. Le costanti in db/ e lib/ restano solo valori ed
// etichette.

// Linee delle intese sul campo e pallini nelle liste, per tipo
export const COLORE_INTESA = {
  confermata: 'var(--ruolo-dif)',
  potenziale: 'var(--muted)',
  speciale: 'var(--accent-strong)',
  pattern: 'var(--text)',
}

export const coloreIntesa = (tipo) => COLORE_INTESA[tipo] ?? 'var(--text)'

// Colore del reparto (por, dif, cen, att)
export const coloreFamiglia = (famiglia) => (famiglia ? `var(--ruolo-${famiglia})` : 'var(--muted)')
