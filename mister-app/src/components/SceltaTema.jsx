import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import Scelta from './Scelta'
import { PALETTE, MODI } from '../theme/palette'
import { normalizzaTema, temaLocale, versioneDi, sistemaScuro } from '../theme/tema'
import { salvaTema } from '../hooks/useTema'

// Aspetto: modo (chiaro, scuro, come il sistema) e palette. Ogni tessera è
// un'anteprima in miniatura nella versione che si vedrebbe adesso. Il cambio
// è immediato: si salva in db.meta e useTema lo applica.
export default function SceltaTema() {
  const riga = useLiveQuery(() => db.meta.get('tema').then((t) => t ?? null), [])
  if (riga === undefined) return null
  const tema = normalizzaTema(riga?.value ?? temaLocale())
  const versione = versioneDi(tema.modo, sistemaScuro())

  return (
    <>
      <div className="field">
        <label>Modo</label>
        <Scelta
          titolo="Modo"
          value={tema.modo}
          onChange={(e) => salvaTema({ ...tema, modo: e.target.value })}
        >
          {MODI.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Scelta>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Colori</label>
        <div className="tema-griglia">
          {PALETTE.map((p) => {
            const t = p[versione]
            const scelta = p.id === tema.palette
            return (
              <button
                key={p.id}
                type="button"
                className={`tema-tessera ${scelta ? 'tema-tessera-scelta' : ''}`}
                aria-pressed={scelta}
                onClick={() => salvaTema({ ...tema, palette: p.id })}
              >
                <span className="tema-anteprima" style={{ background: t.bg, borderColor: t.border }} aria-hidden="true">
                  <span className="tema-anteprima-card" style={{ background: t.surface, borderColor: t.border }}>
                    <span className="tema-anteprima-riga" style={{ background: t.text }} />
                    <span className="tema-anteprima-riga corta" style={{ background: t.muted }} />
                  </span>
                  <span className="tema-anteprima-pulsante" style={{ background: t.accent }} />
                  <span className="tema-anteprima-punto" style={{ background: t['accent-strong'] }} />
                </span>
                <span className="tema-nome">{p.nome}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
