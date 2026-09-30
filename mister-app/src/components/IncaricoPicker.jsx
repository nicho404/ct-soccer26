import { INCARICHI_FASE } from '../db/constants'

// Incarico per fase di un giocatore: ritoccare la scelta attiva la toglie,
// così "nessun incarico" non ha bisogno di un quarto bottone.
// `comeAssegnato`: se passato, aggiunge la scorciatoia per l'incarico svolto
// uguale a quello assegnato — il caso più frequente a fine partita.
export default function IncaricoPicker({ value, onChange, label = 'Incarico in campo', comeAssegnato }) {
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
        {comeAssegnato && value !== comeAssegnato && (
          <button type="button" className="chip chip-sm" onClick={() => onChange(comeAssegnato)}>
            ✓ Come assegnato
          </button>
        )}
      </div>
    </div>
  )
}
