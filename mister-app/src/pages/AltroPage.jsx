import { Link } from 'react-router-dom'
import {
  IconEye, IconLink, IconChart, IconClipboardCheck,
  IconTarget, IconBook, IconStar, IconGear,
} from '../components/icons'

const VOCI = [
  { to: '/osservazione', Icon: IconEye, label: 'Osservazione', desc: 'Voti e note da bordo campo', milestone: null },
  { to: '/intese', Icon: IconLink, label: 'Intese', desc: 'Coppie e catene che si capiscono', milestone: null },
  { to: '/storico', Icon: IconChart, label: 'Storico', desc: 'Formazioni reali, azioni, marcatori', milestone: 'M6' },
  { to: '/presenze', Icon: IconClipboardCheck, label: 'Presenze e sedute', desc: 'Appello, meritocrazia, allenamenti', milestone: 'M5' },
  { to: '/avversari', Icon: IconTarget, label: 'Avversari', desc: 'Scouting squadre del girone', milestone: 'M7' },
  { to: '/manuale', Icon: IconBook, label: 'Manuale', desc: 'La tua knowledge base tattica', milestone: 'M7' },
  { to: '/capitano', Icon: IconStar, label: 'Capitano', desc: 'Criteri comparati per la scelta', milestone: 'M7' },
  { to: '/impostazioni', Icon: IconGear, label: 'Impostazioni', desc: 'Backup, dati demo, info', milestone: null },
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
            <span className="menu-icon"><v.Icon /></span>
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
