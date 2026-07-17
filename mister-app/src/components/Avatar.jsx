// Foto giocatore rotonda; senza foto mostra la silhouette grigia
// neutra, come i profili social senza immagine.
export default function Avatar({ src, size = 40, alt = '' }) {
  if (src) {
    return (
      <img
        className="avatar"
        src={src}
        alt={alt}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="avatar avatar-placeholder"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="9" r="4.2" />
        <path d="M3.5 22.5c0-4.2 3.8-6.8 8.5-6.8s8.5 2.6 8.5 6.8Z" />
      </svg>
    </span>
  )
}
