import { INCARICHI_FASE } from '../db/constants'

// Incarico per fase di un giocatore: ritoccare la scelta attiva la toglie,
// così "nessun incarico" non ha bisogno di un quarto bottone.
export default function IncaricoPicker({ value, onChange, label = 'Incarico in campo' }) {
  return (
    <div className="field" style={{ marginBottom: 8 }}>
      <label>{label}</label>
      <div className="chip-row">
        {INCARICHI_FASE.map((i) => (
          <button
            key={i.value}
            type="button"
            className={`chip chip-sm ${value === i.value ? 'selected' : ''}`}
            onClick={() => onChange(value === i.value ? null : i.value)}
          >
            {i.icona} {i.label}
          </button>
        ))}
      </div>
    </div>
  )
}
