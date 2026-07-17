import EmptyState from '../components/EmptyState'
import { IconBall } from '../components/icons'

export default function PlaceholderPage({ title, icon = <IconBall />, milestone }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <EmptyState
        icon={icon}
        title="In arrivo"
        text={`Questo modulo sarà disponibile con la milestone ${milestone}.`}
      />
    </div>
  )
}
