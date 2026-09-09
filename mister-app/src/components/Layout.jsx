import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { IconHome, IconUsers, IconPitch, IconCalendar, IconGrid, IconBall } from './icons'
import ErrorBoundary from './ErrorBoundary'

const TABS = [
  { to: '/home', Icon: IconHome, label: 'Home' },
  { to: '/rosa', Icon: IconUsers, label: 'Rosa' },
  { to: '/modulo', Icon: IconPitch, label: 'Modulo' },
  { to: '/partite', Icon: IconCalendar, label: 'Partite' },
  { to: '/altro', Icon: IconGrid, label: 'Altro' },
]

export default function Layout() {
  const team = useLiveQuery(() => db.meta.get('team'), [])
  const location = useLocation()

  return (
    <>
      <header className="app-header">
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
          <span className="app-logo" aria-hidden="true">
            {team?.logo ? <img src={team.logo} alt="" /> : <IconBall size={18} />}
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="title">
              {team?.nome || <>Mister <span>App</span></>}
            </span>
            {team?.torneo && <span className="header-torneo">{team.torneo}</span>}
          </span>
        </Link>
      </header>
      {/* key sul percorso: cambiando pagina l'errore si azzera da solo,
          altrimenti una schermata rotta resterebbe rotta per sempre */}
      <ErrorBoundary key={location.pathname}>
        <Outlet />
      </ErrorBoundary>
      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="icon"><tab.Icon /></span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
