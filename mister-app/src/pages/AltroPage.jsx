import { Link } from 'react-router-dom'
import {
  IconEye, IconLink, IconChart, IconClipboardCheck, IconCheckSquare,
  IconTarget, IconBook, IconStar, IconGear,
} from '../components/icons'

const VOCI = [
  { to: '/osservazione', Icon: IconEye, label: 'Osservazione', desc: 'Voti e note da bordo campo' },
  { to: '/checklist', Icon: IconCheckSquare, label: 'Checklist ruoli', desc: 'Letture sì/no per slot, partita per partita' },
  { to: '/intese', Icon: IconLink, label: 'Intese', desc: 'Coppie e catene che si capiscono' },
  { to: '/storico', Icon: IconChart, label: 'Storico', desc: 'Referti, minutaggio, marcatori' },
  { to: '/presenze', Icon: IconClipboardCheck, label: 'Presenze e sedute', desc: 'Appello, meritocrazia, allenamenti' },
  { to: '/avversari', Icon: IconTarget, label: 'Avversari', desc: 'Scouting squadre del girone' },
  { to: '/manuale', Icon: IconBook, label: 'Manuale', desc: 'La tua knowledge base tattica' },
  { to: '/capitano', Icon: IconStar, label: 'Capitano', desc: 'Criteri comparati per la scelta' },
  { to: '/impostazioni', Icon: IconGear, label: 'Impostazioni', desc: 'Backup, dati demo, info' },
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
          </div>
        </Link>
      ))}
    </div>
  )
}
