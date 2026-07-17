import { NavLink, Outlet, Link } from 'react-router-dom'
import { IconHome, IconUsers, IconPitch, IconCalendar, IconGrid, IconBall } from './icons'

const TABS = [
  { to: '/home', Icon: IconHome, label: 'Home' },
  { to: '/rosa', Icon: IconUsers, label: 'Rosa' },
  { to: '/modulo', Icon: IconPitch, label: 'Modulo' },
  { to: '/partite', Icon: IconCalendar, label: 'Partite' },
  { to: '/altro', Icon: IconGrid, label: 'Altro' },
]

export default function Layout() {
  return (
    <>
      <header className="app-header">
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <span className="app-logo" aria-hidden="true"><IconBall size={18} /></span>
          <span className="title">Mister <span>App</span></span>
        </Link>
      </header>
      <Outlet />
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
