import { Link } from 'react-router-dom'

const VOCI = [
  { to: '/osservazione', icon: '🔍', label: 'Osservazione', desc: 'Voti e note da bordo campo', milestone: null },
  { to: '/intese', icon: '🔗', label: 'Intese', desc: 'Coppie e catene che si capiscono', milestone: null },
  { to: '/storico', icon: '📊', label: 'Storico', desc: 'Formazioni reali, azioni, marcatori', milestone: 'M6' },
  { to: '/presenze', icon: '🏃', label: 'Presenze e sedute', desc: 'Appello, meritocrazia, allenamenti', milestone: 'M5' },
  { to: '/avversari', icon: '🎯', label: 'Avversari', desc: 'Scouting squadre del girone', milestone: 'M7' },
  { to: '/manuale', icon: '📋', label: 'Manuale', desc: 'La tua knowledge base tattica', milestone: 'M7' },
  { to: '/capitano', icon: '⭐', label: 'Capitano', desc: 'Criteri comparati per la scelta', milestone: 'M7' },
  { to: '/impostazioni', icon: '⚙️', label: 'Impostazioni', desc: 'Backup, dati demo, info', milestone: null },
]

export default function AltroPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Altro</h1>
      </div>

      {VOCI.map((v) => (
        <Link key={v.to} to={v.to} className="card tappable">
          <div className="row">
            <span style={{ fontSize: '1.4rem' }}>{v.icon}</span>
            <div style={{ flex: 1 }}>
              <strong>{v.label}</strong>
              <div className="muted small">{v.desc}</div>
            </div>
            {v.milestone && <span className="badge">{v.milestone}</span>}
          </div>
        </Link>
      ))}
    </div>
  )
}
