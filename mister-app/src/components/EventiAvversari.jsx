import { useId, useState } from 'react'
import { TIPI_EVENTO_AVVERSARI, pulisciNome } from '../lib/girone'
import { chiaveEvento } from '../db/girone'

const iconaDi = (tipo) => TIPI_EVENTO_AVVERSARI.find((t) => t.value === tipo)?.icona ?? ''

// Gol e cartellini degli avversari, per una squadra (le nostre partite) o per
// due (il girone). `lati`: [{ key, nome, opponentId }], opponentId null se la
// squadra non esiste ancora. Il nome del giocatore si sceglie dalla rosa
// della squadra; se non c'è, verrà creato al salvataggio del form.
export default function EventiAvversari({ eventi, onChange, lati, giocatori }) {
  const idBase = useId()
  const [tipo, setTipo] = useState('gol')
  const [latoScelto, setLatoScelto] = useState(lati[0].key)
  const [nome, setNome] = useState('')

  const lato = lati.find((l) => l.key === latoScelto) ?? lati[0]
  const senzaSquadra = !pulisciNome(lato.nome)
  const rosa = lato.opponentId == null
    ? []
    : giocatori
      .filter((g) => g.opponentId === lato.opponentId)
      .sort((a, b) => a.nome.localeCompare(b.nome))
  const idLista = `${idBase}-rosa-${lato.key}`
  const nomeLato = (key) => pulisciNome(lati.find((l) => l.key === key)?.nome) || '—'

  const aggiungi = () => {
    if (senzaSquadra || !pulisciNome(nome)) return
    onChange([...eventi, { key: chiaveEvento(), tipo, lato: lato.key, nome: pulisciNome(nome) }])
    setNome('')
  }

  return (
    <div className="card">
      {eventi.length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>Nessun marcatore o cartellino inserito.</p>
      ) : (
        eventi.map((e) => (
          <div className="row" key={e.key} style={{ gap: 8, padding: '3px 0' }}>
            <span aria-hidden="true">{iconaDi(e.tipo)}</span>
            <span className="small" style={{ flex: 1, minWidth: 0 }}>
              {e.nome}
              {lati.length > 1 && <span className="muted"> · {nomeLato(e.lato)}</span>}
            </span>
            <button
              className="btn btn-sm"
              aria-label={`Togli ${e.nome}`}
              onClick={() => onChange(eventi.filter((x) => x.key !== e.key))}
            >
              ✕
            </button>
          </div>
        ))
      )}

      <div className="chip-row" style={{ marginTop: 12 }}>
        {TIPI_EVENTO_AVVERSARI.map((t) => (
          <button
            key={t.value}
            className={`chip chip-sm ${tipo === t.value ? 'selected' : ''}`}
            onClick={() => setTipo(t.value)}
          >
            {t.icona} {t.label}
          </button>
        ))}
      </div>

      {lati.length > 1 && (
        <div className="chip-row" style={{ marginTop: 8 }}>
          {lati.map((l) => (
            <button
              key={l.key}
              className={`chip chip-sm ${lato.key === l.key ? 'selected' : ''}`}
              onClick={() => setLatoScelto(l.key)}
            >
              {nomeLato(l.key)}
            </button>
          ))}
        </div>
      )}

      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 0 }}
          list={idLista}
          value={nome}
          disabled={senzaSquadra}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') aggiungi() }}
          placeholder="Cognome Nome"
        />
        <datalist id={idLista}>
          {rosa.map((g) => <option key={g.id} value={g.nome} />)}
        </datalist>
        <button className="btn btn-sm" disabled={senzaSquadra || !pulisciNome(nome)} onClick={aggiungi}>
          Aggiungi
        </button>
      </div>
      {senzaSquadra && (
        <p className="muted small" style={{ margin: '6px 0 0' }}>Scegli prima la squadra.</p>
      )}
    </div>
  )
}
