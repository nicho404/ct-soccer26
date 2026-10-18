import { useState } from 'react'
import Modal from '../Modal'
import Scelta from '../Scelta'
import IncaricoPicker from '../IncaricoPicker'
import { nomeBreve } from '../../lib/nomi'
import { TRIGGER_CAMBIO, nuovoIdRiga } from './stato'
import { IconClose } from '../icons'

// "Salva assetto": nome e cambi previsti (chi esce, chi entra, quando o
// perché). Le righe partono dai cambi già pianificati sul campo.
export default function FinestraSalvaAssetto({
  righeIniziali, slots, panchina, players, modulo, incarichi, onIncarico, onSalva, onClose,
}) {
  const [nome, setNome] = useState('')
  const [righe, setRighe] = useState(righeIniziali)

  const aggiungi = () =>
    setRighe((rs) => [
      ...rs,
      { id: nuovoIdRiga(), escePlayerId: null, entraPlayerId: null, trigger: 'minuto', dettaglio: '', slotIndex: null },
    ])

  const modifica = (rid, patch) => setRighe((rs) => rs.map((r) => (r.id === rid ? { ...r, ...patch } : r)))

  const rimuovi = (rid) => {
    if (!window.confirm('Togliere questo cambio previsto?')) return
    setRighe((rs) => rs.filter((r) => r.id !== rid))
  }

  const nomeDi = (pid) => nomeBreve(players.find((p) => p.id === pid))
  const salva = () => {
    if (!nome.trim()) return
    onSalva(nome.trim(), righe)
  }

  return (
    <Modal titolo="Salva assetto" onClose={onClose}>
      <div className="field">
        <label>Nome assetto</label>
        <input
          className="input"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Es. Titolari, Anti-pressing"
        />
      </div>

      <div className="section-title row" style={{ padding: 0 }}>
        <span style={{ flex: 1 }}>Cambi previsti</span>
        <button className="btn btn-sm" onClick={aggiungi}>+ Aggiungi cambio</button>
      </div>
      {righe.length === 0 && (
        <p className="muted small" style={{ margin: '0 0 8px' }}>
          Facoltativo: chi esce, chi entra e quando o perché.
        </p>
      )}
      {righe.map((r) => {
        // Cambi volanti: può uscire anche chi è entrato in un'altra
        // riga, e può entrare anche chi è uscito in un'altra riga.
        const altre = righe.filter((x) => x.id !== r.id)
        const esceIds = [...new Set([
          ...slots.filter(Boolean),
          ...altre.map((x) => x.entraPlayerId).filter((pid) => pid != null),
        ])]
        const entraIds = [...new Set([
          ...panchina.map((p) => p.id),
          ...altre.map((x) => x.escePlayerId).filter((pid) => pid != null),
        ])].filter((pid) => pid !== r.escePlayerId)
        return (
          <div className="card" key={r.id} style={{ marginBottom: 8 }}>
            <div className="row" style={{ gap: 8 }}>
              <Scelta
                titolo="Chi esce"
                className="select"
                style={{ flex: 1 }}
                value={r.escePlayerId ?? ''}
                onChange={(e) => modifica(r.id, { escePlayerId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Esce — chi?</option>
                {esceIds.map((pid) => (
                  <option key={pid} value={pid}>{nomeDi(pid)}</option>
                ))}
              </Scelta>
              <Scelta
                titolo="Chi entra"
                className="select"
                style={{ flex: 1 }}
                value={r.entraPlayerId ?? ''}
                onChange={(e) => modifica(r.id, { entraPlayerId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Entra — chi?</option>
                {entraIds.map((pid) => (
                  <option key={pid} value={pid}>{nomeDi(pid)}</option>
                ))}
              </Scelta>
              <button className="btn btn-sm" aria-label="Rimuovi cambio" onClick={() => rimuovi(r.id)}>
                <IconClose size={16} />
              </button>
            </div>
            <div className="chip-row" style={{ marginTop: 8 }}>
              {TRIGGER_CAMBIO.map((t) => (
                <button
                  key={t.value}
                  className={`chip chip-sm ${r.trigger === t.value ? 'selected' : ''}`}
                  onClick={() => modifica(r.id, { trigger: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              className="input"
              style={{ marginTop: 8 }}
              value={r.dettaglio}
              onChange={(e) => modifica(r.id, { dettaglio: e.target.value })}
              placeholder="Es. inizio ripresa, se in vantaggio, se prestazione non convince…"
            />
            <Scelta
              titolo="Posizione di chi entra"
              className="select"
              style={{ marginTop: 8 }}
              value={r.slotIndex ?? ''}
              onChange={(e) => modifica(r.id, { slotIndex: e.target.value !== '' ? Number(e.target.value) : null })}
            >
              <option value="">Posizione: al posto di chi esce</option>
              {modulo.slots.map((sl, i) => (
                <option key={i} value={i}>
                  Posizione: {sl.sigla}{slots[i] != null ? ` (oggi ${nomeDi(slots[i])})` : ''}
                </option>
              ))}
            </Scelta>
            {r.entraPlayerId != null && (
              <div style={{ marginTop: 8 }}>
                <IncaricoPicker
                  label={`Incarico di ${nomeDi(r.entraPlayerId)}`}
                  value={incarichi[r.entraPlayerId] ?? null}
                  onChange={(v) => onIncarico(r.entraPlayerId, v)}
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={salva}>
          Salva
        </button>
        <button className="btn" onClick={onClose}>Annulla</button>
      </div>
    </Modal>
  )
}
