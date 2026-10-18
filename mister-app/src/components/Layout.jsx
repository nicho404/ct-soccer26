import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { IconHome, IconUsers, IconPitch, IconCalendar, IconBall, IconTrophy, IconGear } from './icons'
import ErrorBoundary from './ErrorBoundary'
import { SEZIONI, sezioneDi, sottobarraDi, elencoAccanto } from '../lib/sezioni'
import useDesktop from '../hooks/useDesktop'

const ICONE = { home: IconHome, rosa: IconUsers, calendario: IconCalendar, tattica: IconPitch }

export default function Layout() {
  const team = useLiveQuery(() => db.meta.get('team'), [])
  const location = useLocation()
  const sezione = sezioneDi(location.pathname)
  const desktop = useDesktop()
  const sottobarra = sottobarraDi(location.pathname, { desktop })
  // su desktop elenco e dettaglio affiancati sono una pagina sola: aprire un
  // giocatore non deve rimontare l'elenco (filtri e scorrimento restano)
  const chiavePagina = (desktop && elencoAccanto(location.pathname)) || location.pathname

  return (
    <>
      <div className="app-top">
        <header className="app-header">
          <Link to="/home" className="app-header-squadra">
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
          <span className="spacer" />
          <NavLink to="/girone" className="header-azione" aria-label="Girone" title="Girone">
            <IconTrophy size={20} />
          </NavLink>
          <NavLink to="/impostazioni" className="header-azione" aria-label="Impostazioni" title="Impostazioni">
            <IconGear size={20} />
          </NavLink>
        </header>
        {sottobarra && (
          <nav className="sottobarra" aria-label={sottobarra.sezione.label}>
            <div className="sottobarra-inner">
              {sottobarra.sezione.schede.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  replace
                  aria-current={s === sottobarra.attiva ? 'page' : undefined}
                  className={`sottobarra-pill ${s === sottobarra.attiva ? 'attiva' : ''}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
      {/* key sul percorso: cambiando pagina l'errore si azzera da solo,
          altrimenti una schermata rotta resterebbe rotta per sempre */}
      <ErrorBoundary key={chiavePagina}>
        <Outlet />
      </ErrorBoundary>
      <nav className="bottom-nav">
        {SEZIONI.map((sez) => {
          const Icon = ICONE[sez.id]
          const attiva = sezione?.id === sez.id
          return (
            <Link
              key={sez.id}
              to={sez.to}
              aria-current={attiva ? 'page' : undefined}
              className={attiva ? 'active' : ''}
            >
              <span className="icon"><Icon /></span>
              {sez.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
