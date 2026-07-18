// Nome breve stile FIFA: "Cognome N." (es. "Rossi D.").
// Il soprannome, se impostato, vince su tutto: è il nome "in campo".
export function nomeBreve(p) {
  if (!p) return '?'
  if (p.soprannome) return p.soprannome
  const parti = (p.nome ?? '').trim().split(/\s+/)
  if (parti.length <= 1) return parti[0] ?? '?'
  const cognome = parti.slice(1).join(' ')
  return `${cognome} ${parti[0][0]}.`
}
