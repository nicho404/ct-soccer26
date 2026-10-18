import { useState } from 'react'
import Modal from '../Modal'
import IncaricoPicker from '../IncaricoPicker'
import { IconAlert, IconStar } from '../icons'
import { nomeBreve } from '../../lib/nomi'
import { fuoriRuolo } from '../../lib/formazioni'
import { famigliaRuolo } from '../../db/constants'
import { ruoliZona, ruoliNpZona } from '../../tactics/constants'
import { compatibilitaGiocatore } from '../../tactics/engine'

const Fuori = () => (
  <span className="chip-avviso" role="img" aria-label="Fuori dalle sue posizioni" title="Fuori dalle sue posizioni">
    <IconAlert size={14} />
  </span>
)

// Posizione selezionata in "Con palla" o "Senza palla": ruolo del motore (o
// manuale), incarico del giocatore e candidati da schierare. La finestra del
// ruolo manuale si chiude da sola cambiando posizione: il pannello ha una
// key per posizione e fase.
export default function PannelloSlot({
  fase, slot, ruolo, player, incarichi, onIncarico, onTogli, onRuoloManuale, candidati, inCampo, onAssegna,
}) {
  const [scegliManuale, setScegliManuale] = useState(false)
  const scegli = (codice) => {
    onRuoloManuale(codice)
    setScegliManuale(false)
  }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <strong>
          {slot.sigla} — {ruolo.nome}
        </strong>
        {ruolo.manuale && <span className="badge badge-accent">manuale</span>}
        <span className="spacer" />
        {player && (
          <button className="btn btn-sm btn-danger" onClick={onTogli}>
            Togli {nomeBreve(player)}
          </button>
        )}
      </div>
      {ruolo.compito && (
        <p className="muted small" style={{ margin: '0 0 8px' }}>{ruolo.compito}</p>
      )}

      {player && (
        <IncaricoPicker
          label={`Incarico di ${nomeBreve(player)}`}
          value={incarichi[player.id] ?? null}
          onChange={(v) => onIncarico(player.id, v)}
        />
      )}

      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn btn-sm" onClick={() => setScegliManuale(true)}>
          Ruolo manuale
        </button>
        {ruolo.manuale && (
          <button className="btn btn-sm" onClick={() => scegli(null)}>
            Torna automatico
          </button>
        )}
      </div>
      {scegliManuale && (
        <Modal titolo={`Ruolo manuale — ${slot.sigla}`} onClose={() => setScegliManuale(false)}>
          <div className="chip-row">
            {(fase === 'possesso' ? ruoliZona(ruolo.zona) : ruoliNpZona(ruolo.zona)).map((r) => (
              <button
                key={r.codice}
                className={`chip chip-sm ${ruolo.ruoloSuggerito === r.codice ? 'selected' : ''}`}
                onClick={() => scegli(r.codice)}
              >
                {r.nome}
              </button>
            ))}
          </div>
        </Modal>
      )}

      <div className="chip-row">
        {candidati.map((p) => {
          const ok = !fuoriRuolo({ player: p, slot, ruoloNome: ruolo.nome })
          // il badge di compatibilità confronta contro ruoliTattici
          // osservati (vocabolario di possesso): in non possesso non
          // si calcola, non è una svista — vedi PitchView/engine.
          const compat = fase === 'possesso' && ok
            ? compatibilitaGiocatore({ slotRuolo: ruolo.ruoloSuggerito, player: p })
            : null
          return (
            <button
              key={p.id}
              className="chip chip-sm"
              style={inCampo.has(p.id) ? { opacity: 0.55 } : undefined}
              onClick={() => onAssegna(p.id)}
            >
              <span className={`role-dot ${famigliaRuolo(p.ruoloNaturale)}`} style={{ marginRight: 6 }} />
              {p.titolare && <span className="star-on" title="Titolare"><IconStar size={12} fill="currentColor" /> </span>}
              {nomeBreve(p)}
              {inCampo.has(p.id) ? ' (in campo)' : ''}
              {compat?.livello === 'naturale' && <span className="fit-plus"> +</span>}
              {compat?.livello === 'adattabile' && <span className="fit-plus" style={{ color: 'var(--warn)' }}> ~</span>}
              {!ok && <Fuori />}
            </button>
          )
        })}
      </div>
      <p className="muted small" style={{ margin: '8px 0 0' }}>
        {fase === 'possesso' && (
          <>
            <span className="fit-plus">+</span> = ha il ruolo tattico richiesto ·{' '}
            <span className="fit-plus" style={{ color: 'var(--warn)' }}>~</span> = ruolo adattabile ·{' '}
          </>
        )}
        <Fuori /> = fuori dalle sue posizioni. Tocca un altro slot sul campo per scambiare.
      </p>
    </div>
  )
}
