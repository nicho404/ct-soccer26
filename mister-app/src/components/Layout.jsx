import { NavLink, Outlet, Link } from 'react-router-dom'

const TABS = [
  { to: '/home', icon: '⚡', label: 'Home' },
  { to: '/rosa', icon: '👥', label: 'Rosa' },
  { to: '/modulo', icon: '⚽', label: 'Modulo' },
  { to: '/partite', icon: '📅', label: 'Partite' },
  { to: '/altro', icon: '☰', label: 'Altro' },
]

export default function Layout() {
  return (
    <>
      <header className="app-header">
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <span className="app-logo" aria-hidden="true">⚽</span>
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
            <span className="icon">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
