import { Link } from 'react-router-dom'
import {
  IconEye, IconLink, IconChart, IconClipboardCheck,
  IconTarget, IconBook, IconStar, IconGear, IconGrid,
} from '../components/icons'

// Divise per categoria, in griglia: si trova la sezione a colpo d'occhio,
// senza leggere un elenco di descrizioni.
const CATEGORIE = [
  {
    titolo: 'Squadra',
    voci: [
      { to: '/osservazione', Icon: IconEye, label: 'Osservazione' },
      { to: '/presenze', Icon: IconClipboardCheck, label: 'Presenze' },
      { to: '/intese', Icon: IconLink, label: 'Intese' },
    ],
  },
  {
    titolo: 'Campionato',
    voci: [
      { to: '/storico', Icon: IconChart, label: 'Storico' },
      { to: '/girone', Icon: IconGrid, label: 'Girone' },
      { to: '/avversari', Icon: IconTarget, label: 'Avversari' },
    ],
  },
  {
    titolo: 'Mister',
    voci: [
      { to: '/capitano', Icon: IconStar, label: 'Capitano' },
      { to: '/analisi', Icon: IconBook, label: 'Quaderno', sotto: 'Analisi e manuale' },
      { to: '/impostazioni', Icon: IconGear, label: 'Impostazioni' },
    ],
  },
]

export default function AltroPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Altro</h1>
      </div>

      {CATEGORIE.map((c) => (
        <div key={c.titolo}>
          <div className="section-title">{c.titolo}</div>
          <div className="menu-griglia">
            {c.voci.map((v) => (
              <Link key={v.to} to={v.to} className="menu-tessera">
                <span className="menu-icon"><v.Icon /></span>
                <strong>{v.label}</strong>
                {v.sotto && <span className="muted menu-sotto">{v.sotto}</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
