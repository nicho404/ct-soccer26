import { useId } from 'react'
import { umoreInfo } from '../lib/umore'

// Faccine disegnate al posto delle emoji: colore di fondo in scala (verde →
// giallo → rosso) e tratti volutamente diversi tra livelli vicini, così si
// distinguono anche piccole. Il volume lo danno due sfumature sopra il colore
// pieno (luce in alto, ombra in basso): il colore resta quello di lib/umore.
const INCHIOSTRO = '#1c1917'

const Occhi = ({ y }) => (
  <>
    <ellipse cx="11.4" cy={y} rx="1.75" ry="2.3" fill={INCHIOSTRO} />
    <ellipse cx="20.6" cy={y} rx="1.75" ry="2.3" fill={INCHIOSTRO} />
    <circle cx="10.8" cy={y - 0.9} r="0.6" fill="#fff" opacity="0.85" />
    <circle cx="20" cy={y - 0.9} r="0.6" fill="#fff" opacity="0.85" />
  </>
)

const tratto = { stroke: INCHIOSTRO, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

const TRATTI = {
  sorridente: (
    <>
      <path d="M8.6 12.8 Q11.2 9.2 13.8 12.8" {...tratto} strokeWidth="2" />
      <path d="M18.2 12.8 Q20.8 9.2 23.4 12.8" {...tratto} strokeWidth="2" />
      <path d="M8.4 16.4 H23.6 Q22.6 25.4 16 25.4 Q9.4 25.4 8.4 16.4 Z" fill={INCHIOSTRO} />
      <path d="M10 16.4 H22 Q21.4 19.3 16 19.3 Q10.6 19.3 10 16.4 Z" fill="#fff" />
      <path d="M12.4 23.6 Q16 21.4 19.6 23.6 Q18 25.4 16 25.4 Q14 25.4 12.4 23.6 Z" fill="#f87171" />
    </>
  ),
  contento: (
    <>
      <Occhi y={12.6} />
      <path d="M10.2 18.6 Q16 24 21.8 18.6" {...tratto} strokeWidth="2" />
    </>
  ),
  neutro: (
    <>
      <Occhi y={13} />
      <path d="M11 20.6 H21" {...tratto} strokeWidth="2" />
    </>
  ),
  triste: (
    <>
      <path d="M8.4 11.2 Q11 9.6 13.6 9" {...tratto} strokeWidth="1.6" />
      <path d="M23.6 11.2 Q21 9.6 18.4 9" {...tratto} strokeWidth="1.6" />
      <Occhi y={14.2} />
      <path d="M11 23 Q16 18.6 21 23" {...tratto} strokeWidth="2" />
      <path d="M22.6 17.2 Q25 20.6 22.6 21.6 Q20.2 20.6 22.6 17.2 Z" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.5" />
    </>
  ),
  arrabbiato: (
    <>
      <path d="M7.8 9.4 L14 12.4" {...tratto} strokeWidth="2.4" />
      <path d="M24.2 9.4 L18 12.4" {...tratto} strokeWidth="2.4" />
      <Occhi y={15.2} />
      <path d="M10.8 23.4 Q16 18.8 21.2 23.4" {...tratto} strokeWidth="2.3" />
    </>
  ),
}

export default function FacciaUmore({ livello, size = 24 }) {
  const id = useId()
  const info = umoreInfo(livello)
  if (!info) return null
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={info.label}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`${id}-luce`} cx="35%" cy="26%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ombra`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={info.colore} />
      <circle cx="16" cy="16" r="15" fill={`url(#${id}-ombra)`} />
      <circle cx="16" cy="16" r="15" fill={`url(#${id}-luce)`} />
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      {TRATTI[livello]}
    </svg>
  )
}
