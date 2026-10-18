import IncaricoPicker from '../IncaricoPicker'
import { nomeBreve } from '../../lib/nomi'
import { famigliaRuolo } from '../../db/constants'
import { IconStar, IconClose } from '../icons'

// Scheda "Cambi": con una posizione selezionata si sceglie chi entra dalla
// panchina; senza, l'elenco dei cambi pianificati.
export default function PannelloCambi({
  slot, player, cambio, panchina, cambi, slots, players, modulo, incarichi,
  onIncarico, onAssegnaCambio, onRimuoviCambio, onAnnullaCambio,
}) {
  if (slot) {
    return (
      <div className="card" style={{ marginTop: 10 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>
            {slot.sigla} — {player ? nomeBreve(player) : 'vuoto'}
          </strong>
          <span className="spacer" />
          {cambio && (
            <button className="btn btn-sm btn-danger" onClick={onRimuoviCambio}>
              Annulla cambio
            </button>
          )}
        </div>
        {!player ? (
          <p className="muted small" style={{ margin: 0 }}>
            Schiera prima un titolare in questa posizione (fase "Con palla") per pianificarne la sostituzione.
          </p>
        ) : (
          <>
            <p className="muted small" style={{ margin: '0 0 8px' }}>
              {cambio
                ? `${nomeBreve(cambio)} entra al posto di ${nomeBreve(player)}.`
                : `Tocca un giocatore dalla panchina per farlo entrare al posto di ${nomeBreve(player)}.`}
            </p>
            {cambio && (
              <IncaricoPicker
                label={`Incarico di ${nomeBreve(cambio)}`}
                value={incarichi[cambio.id] ?? null}
                onChange={(v) => onIncarico(cambio.id, v)}
              />
            )}
            <div className="chip-row">
              {panchina.length === 0 ? (
                <span className="muted small">Nessun giocatore disponibile in panchina.</span>
              ) : (
                panchina.map((p) => (
                  <button
                    key={p.id}
                    className={`chip chip-sm ${cambio?.id === p.id ? 'selected' : ''}`}
                    onClick={() => onAssegnaCambio(p.id)}
                  >
                    <span className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`} style={{ marginRight: 6 }} />
                    {p.titolare && <span className="star-on" title="Titolare"><IconStar size={12} fill="currentColor" /> </span>}
                    {nomeBreve(p)}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      {Object.keys(cambi).length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>
          Nessun cambio pianificato. Tocca un titolare sul campo per pianificarne la sostituzione.
          {panchina.length > 0 && ` In panchina: ${panchina.map(nomeBreve).join(', ')}.`}
        </p>
      ) : (
        Object.entries(cambi).map(([slotIndex, playerId]) => {
          const uscente = players.find((p) => p.id === slots[Number(slotIndex)])
          const entrante = players.find((p) => p.id === playerId)
          if (!entrante) return null
          return (
            <div className="row" key={slotIndex} style={{ marginBottom: 6 }}>
              <span>
                {uscente ? nomeBreve(uscente) : modulo.slots[Number(slotIndex)].sigla} → {nomeBreve(entrante)}
              </span>
              <span className="spacer" />
              <button
                className="btn btn-sm btn-danger"
                aria-label={`Annulla cambio ${nomeBreve(entrante)}`}
                onClick={() => onAnnullaCambio(slotIndex, entrante)}
              >
                <IconClose size={16} />
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
