import { useState } from 'react'
import { db } from '../../db/db'
import Modal from '../Modal'
import { IconSwap } from '../icons'
import { nomeBreve } from '../../lib/nomi'
import { IMPOSTAZIONI, costruzioneInfo, lineaDifesaInfo } from '../../lib/formazioni'
import { incaricoInfo } from '../../db/constants'
import { TRIGGER_CAMBIO } from './stato'

// Assetti salvati come righe (nome, modulo, cambi previsti); il dettaglio si
// apre in finestra con "Carica in campo" ed "Elimina".
// `assetti` sono quelli del formato in uso, `tutti` l'intero record salvato.
export default function AssettiSalvati({ assetti, tutti, moduli, players, onNuovo, onCarica }) {
  const [apertoId, setApertoId] = useState(null)

  const elimina = async (a) => {
    if (!window.confirm(`Eliminare la formazione "${a.nome}"?`)) return
    await db.meta.put({ key: 'moduliSalvati', value: tutti.filter((x) => x.id !== a.id) })
    setApertoId(null)
  }
  const aperto = assetti.find((x) => x.id === apertoId)
  const nomeDi = (pid) => nomeBreve(players.find((p) => p.id === pid))

  return (
    <>
      <div className="section-title row">
        <span style={{ flex: 1 }}>Assetti salvati ({assetti.length})</span>
        <button className="btn btn-sm" onClick={onNuovo}>+ Salva assetto</button>
      </div>

      {assetti.length === 0 ? (
        <div className="card muted small">
          Salva l'assetto attuale (modulo, undici, tattica, costruzione e linea) con un nome:
          potrai richiamarlo con un tocco.
        </div>
      ) : (
        <div className="card referto-cronologia">
          {assetti.map((a) => (
            <button
              type="button"
              key={a.id}
              className="incarico-riga"
              aria-label={`Assetto ${a.nome}`}
              onClick={() => setApertoId(a.id)}
            >
              <strong className="incarico-nome">{a.nome}</strong>
              <span className="badge badge-accent">{a.modulo}</span>
              {(a.cambiPrevisti ?? []).length > 0 && (
                <span className="badge" title="Cambi previsti">
                  <IconSwap size={13} /> {a.cambiPrevisti.length}
                </span>
              )}
              <span className="muted">›</span>
            </button>
          ))}
        </div>
      )}

      {aperto && (
        <Modal titolo={aperto.nome} onClose={() => setApertoId(null)}>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="badge badge-accent">{aperto.modulo}</span>
            <span className="muted small">
              {[
                IMPOSTAZIONI.find((i) => i.value === aperto.impostazione)?.label,
                costruzioneInfo(aperto.costruzione).label,
                `Linea ${lineaDifesaInfo(aperto.linea).label.toLowerCase()}`,
                `${aperto.slots.filter(Boolean).length}/${aperto.formato} schierati`,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
          {Object.keys(aperto.incarichi ?? {}).length > 0 && (
            <p className="small muted" style={{ margin: '0 0 10px' }}>
              {Object.entries(aperto.incarichi)
                .map(([pid, v]) => {
                  const info = incaricoInfo(v)
                  const pl = players.find((p) => p.id === Number(pid))
                  return pl && info ? `${info.icona} ${nomeBreve(pl)}` : null
                })
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {(aperto.cambiPrevisti ?? []).length > 0 && (
            <>
              <div className="oss-sezione"><span>Cambi previsti</span></div>
              {aperto.cambiPrevisti.map((r) => (
                <div className="evento-riga" key={r.id}>
                  <span className="evento-icona muted"><IconSwap size={16} /></span>
                  <span className="evento-testo">
                    {r.escePlayerId != null ? nomeDi(r.escePlayerId) : '?'} → {nomeDi(r.entraPlayerId)}
                    {r.slotIndex != null && moduli[aperto.modulo]?.slots[r.slotIndex]
                      ? ` (${moduli[aperto.modulo].slots[r.slotIndex].sigla})`
                      : ''}
                    <span className="muted small" style={{ display: 'block' }}>
                      {TRIGGER_CAMBIO.find((t) => t.value === r.trigger)?.label}
                      {r.dettaglio ? ` · ${r.dettaglio}` : ''}
                    </span>
                  </span>
                </div>
              ))}
            </>
          )}
          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => { onCarica(aperto); setApertoId(null) }}
            >
              Carica in campo
            </button>
            <button
              className="btn btn-danger"
              aria-label={`Elimina assetto ${aperto.nome}`}
              onClick={() => elimina(aperto)}
            >
              Elimina
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
