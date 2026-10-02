import { useRef, useState } from 'react'
import { db } from '../db/db'
import { importBackup } from '../db/backup'
import { FORMATI } from '../lib/formazioni'
import { IconBall } from '../components/icons'

// Primo accesso: si sceglie se partire da zero (form squadra) o da un
// backup esportato su un altro dispositivo. In entrambi i casi è setupDone
// sul record team a sbloccare il router (gate in App.jsx).
export default function OnboardingPage({ team }) {
  // 'scelta' → 'nuova'; un team già iniziato (es. setup interrotto) va dritto al form
  const [passo, setPasso] = useState(team ? 'nuova' : 'scelta')
  const [errore, setErrore] = useState(null)
  const [caricando, setCaricando] = useState(false)
  const fileRef = useRef(null)
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

  // Un backup porta con sé squadra, rosa e tutto il resto: se la squadra
  // c'è, l'app parte subito. Un backup di una versione che non segnava
  // setupDone ma ha il nome squadra vale come configurato.
  const caricaBackup = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrore(null)
    setCaricando(true)
    try {
      await importBackup(file)
      const importato = await db.meta.get('team')
      if (!importato?.nome?.trim()) {
        setErrore('Il backup non contiene i dati della squadra: compila la squadra a mano.')
        setPasso('nuova')
        return
      }
      if (!importato.setupDone) await db.meta.put({ ...importato, setupDone: true })
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricando(false)
    }
  }

  if (passo === 'scelta') {
    return (
      <div className="page onboarding">
        <div className="onboarding-hero">
          <span className="onboarding-logo"><IconBall size={34} /></span>
          <h1>Benvenuto, mister</h1>
          <p className="muted">Come vuoi iniziare?</p>
        </div>

        <button type="button" className="card tappable onboarding-scelta" onClick={() => setPasso('nuova')}>
          <span className="onboarding-scelta-icona">✨</span>
          <span>
            <strong>Nuova squadra</strong>
            <span className="muted small">Parti da zero: due domande veloci e sei in campo.</span>
          </span>
        </button>

        <button
          type="button"
          className="card tappable onboarding-scelta"
          disabled={caricando}
          onClick={() => fileRef.current?.click()}
        >
          <span className="onboarding-scelta-icona">📂</span>
          <span>
            <strong>{caricando ? 'Caricamento…' : 'Carica un backup'}</strong>
            <span className="muted small">
              Hai già usato l'app su un altro telefono o PC? Scegli il file di backup (.json)
              esportato da Impostazioni e ritrovi tutto.
            </span>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          aria-label="File di backup"
          onChange={caricaBackup}
        />

        {errore && (
          <p className="small" style={{ color: 'var(--danger)' }}>{errore}</p>
        )}
      </div>
    )
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

      {errore && <p className="small" style={{ color: 'var(--warn)' }}>{errore}</p>}

      <button className="btn btn-primary btn-block" onClick={save}>
        Iniziamo
      </button>
      {!team && (
        <button className="btn btn-block" style={{ marginTop: 10 }} onClick={() => { setErrore(null); setPasso('scelta') }}>
          ‹ Indietro
        </button>
      )}
    </div>
  )
}
