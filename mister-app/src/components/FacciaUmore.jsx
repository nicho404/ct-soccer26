import { umoreInfo } from '../lib/umore'

// Faccine disegnate al posto delle emoji: colore di fondo in scala (verde
// scuro → giallo → rosso scuro) e tratti volutamente diversi tra livelli
// vicini, così si distinguono anche piccole.
const TRATTI = {
  sorridente: (
    <>
      <path d="M8.5 13.5 Q16 22 23.5 13.5 Z" fill="#14141c" />
      <path d="M9.5 10 Q11 8.2 12.5 10" stroke="#14141c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M19.5 10 Q21 8.2 22.5 10" stroke="#14141c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  contento: (
    <>
      <circle cx="11.5" cy="12" r="1.8" fill="#14141c" />
      <circle cx="20.5" cy="12" r="1.8" fill="#14141c" />
      <path d="M10.5 18.5 Q16 23 21.5 18.5" stroke="#14141c" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  neutro: (
    <>
      <circle cx="11.5" cy="12.5" r="1.8" fill="#14141c" />
      <circle cx="20.5" cy="12.5" r="1.8" fill="#14141c" />
      <path d="M11 20.5 H21" stroke="#14141c" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  triste: (
    <>
      <path d="M9 10.5 L13.5 9" stroke="#14141c" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M23 10.5 L18.5 9" stroke="#14141c" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="11.5" cy="13.5" r="1.8" fill="#14141c" />
      <circle cx="20.5" cy="13.5" r="1.8" fill="#14141c" />
      <path d="M11 22 Q16 17.5 21 22" stroke="#14141c" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  arrabbiato: (
    <>
      <path d="M8.5 9 L14 12" stroke="#14141c" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M23.5 9 L18 12" stroke="#14141c" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="11.8" cy="14.3" r="1.7" fill="#14141c" />
      <circle cx="20.2" cy="14.3" r="1.7" fill="#14141c" />
      <path d="M10.5 23 Q16 17 21.5 23" stroke="#14141c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),
}

export default function FacciaUmore({ livello, size = 24 }) {
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
      <circle cx="16" cy="16" r="15" fill={info.colore} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      {TRATTI[livello]}
    </svg>
  )
}
