import { useState } from 'react'
import { db } from '../db/db'
import { FORMATI } from '../lib/formazioni'
import { IconBall } from '../components/icons'

// Configurazione al primo accesso: senza questi dati l'app non parte.
// Al salvataggio setupDone sblocca il router (gate in App.jsx).
export default function OnboardingPage({ team }) {
  const [mister, setMister] = useState(team?.mister ?? '')
  const [nome, setNome] = useState(team?.nome ?? '')
  const [formato, setFormato] = useState(FORMATI.includes(team?.formato) ? team.formato : 8)
  const [torneo, setTorneo] = useState(team?.torneo ?? '')

  const save = async () => {
    if (!nome.trim()) {
      alert('Il nome della squadra è obbligatorio')
      return
    }
    await db.meta.put({
      key: 'team',
      logo: '',
      ...team,
      mister: mister.trim(),
      nome: nome.trim(),
      torneo: torneo.trim(),
      formato,
      setupDone: true,
    })
  }

  return (
    <div className="page onboarding">
      <div className="onboarding-hero">
        <span className="onboarding-logo"><IconBall size={34} /></span>
        <h1>Benvenuto, mister</h1>
        <p className="muted">
          Due domande veloci per preparare la tua panchina. Potrai cambiare tutto in Impostazioni.
        </p>
      </div>

      <div className="field">
        <label>Come ti chiami?</label>
        <input
          className="input"
          value={mister}
          onChange={(e) => setMister(e.target.value)}
          placeholder="Nome del mister"
        />
      </div>

      <div className="field">
        <label>Nome squadra *</label>
        <input
          className="input"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Es. Vecchia Guardia FC"
        />
      </div>

      <div className="field">
        <label>A quanti giocate?</label>
        <div className="chip-row">
          {FORMATI.map((f) => (
            <button
              key={f}
              className={`chip ${formato === f ? 'selected' : ''}`}
              style={{ fontWeight: 700 }}
              onClick={() => setFormato(f)}
            >
              Calcio a {f}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Determina i moduli disponibili nel builder tattico.
        </p>
      </div>

      <div className="field">
        <label>Campionato / torneo</label>
        <input
          className="input"
          value={torneo}
          onChange={(e) => setTorneo(e.target.value)}
          placeholder="Es. LC8 Milano – Serie C"
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={save}>
        Iniziamo
      </button>
    </div>
  )
}
