export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  )
}
