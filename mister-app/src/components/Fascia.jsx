import { FASCE } from '../lib/fascia'

// Tag della fascia: capitano o vice. Stesso aspetto ovunque compaia (Rosa,
// scheda giocatore, pagina Capitano), così il vice si riconosce a colpo d'occhio.
export default function Fascia({ tipo }) {
  const f = FASCE[tipo]
  if (!f) return null
  return (
    <span className={`badge fascia ${f.className}`} title={f.label}>
      <span className="fascia-sigla">{f.sigla}</span> {f.label}
    </span>
  )
}
