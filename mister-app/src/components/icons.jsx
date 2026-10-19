// Icone SVG a tratto (stile outline, 24x24, colore da currentColor).
// Sostituiscono le emoji per un look da app sportiva (Tuttocampo & simili).
import { TRACCIATI } from './tracciati'

function Icon({ children, size = 22, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

const Tracciato = ({ nome, ...p }) => (
  <Icon {...p}>
    {TRACCIATI[nome].map((d) => <path key={d} d={d} />)}
  </Icon>
)

export const IconHome = (p) => (
  <Icon {...p}>
    <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <path d="M9 22v-8h6v8" />
  </Icon>
)

export const IconUsers = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="7.5" r="3.5" />
    <path d="M2.5 20.5v-1.5a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1.5" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 6.9" />
    <path d="M21.5 20.5v-1.5a5 5 0 0 0-3.5-4.77" />
  </Icon>
)

export const IconPitch = (p) => (
  <Icon {...p}>
    <rect x="4" y="2.5" width="16" height="19" rx="2" />
    <path d="M4 12h16" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M8.5 2.5v2.2a3.5 2.6 0 0 0 7 0V2.5M8.5 21.5v-2.2a3.5 2.6 0 0 1 7 0v2.2" />
  </Icon>
)

export const IconCalendar = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="2" />
    <path d="M8 2.5v4M16 2.5v4M3 10h18" />
  </Icon>
)

export const IconGrid = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Icon>
)

export const IconBall = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8.2 8.39 10.83l1.38 4.24h4.46l1.38-4.24Z" />
    <path d="M12 8.2V3M8.39 10.83 3.44 9.22M9.77 15.07 6.71 19.28M14.23 15.07l3.06 4.21M15.61 10.83l4.95-1.61" />
  </Icon>
)

export const IconBolt = (p) => (
  <Icon {...p}>
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
  </Icon>
)

export const IconEye = (p) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const IconLink = (p) => (
  <Icon {...p}>
    <path d="M10 13.5a5 5 0 0 0 7.54.54l2.5-2.5a5 5 0 0 0-7.07-7.07L11.5 5.9" />
    <path d="M14 10.5a5 5 0 0 0-7.54-.54l-2.5 2.5a5 5 0 0 0 7.07 7.07l1.46-1.43" />
  </Icon>
)

export const IconChart = (p) => (
  <Icon {...p}>
    <path d="M3.5 3.5v17h17" />
    <path d="M8 16.5v-5M12.5 16.5v-9M17 16.5v-3" />
  </Icon>
)

export const IconClipboardCheck = (p) => (
  <Icon {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4.5" />
  </Icon>
)

export const IconCheckSquare = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <path d="m8 12.5 2.5 2.5 5.5-6" />
  </Icon>
)

export const IconTarget = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5.3" />
    <circle cx="12" cy="12" r="1.7" />
  </Icon>
)

export const IconBook = (p) => (
  <Icon {...p}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </Icon>
)

export const IconStar = (p) => (
  <Icon {...p}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z" />
  </Icon>
)

export const IconLinkBroken = (p) => (
  <Icon {...p}>
    <path d="M10 13.5a5 5 0 0 0 7.54.54l2.5-2.5a5 5 0 0 0-7.07-7.07l-1.46 1.43" />
    <path d="M14 10.5a5 5 0 0 0-7.54-.54l-2.5 2.5a5 5 0 0 0 7.07 7.07l1.46-1.43" />
    <path d="m5 5 14 14" />
  </Icon>
)

export const IconGear = (p) => (
  <Icon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const IconTrophy = (p) => (
  <Icon {...p}>
    <path d="M8 3.5h8v6a4 4 0 0 1-8 0Z" />
    <path d="M8 5.5H4.5v1.5A3.5 3.5 0 0 0 8 10.5M16 5.5h3.5v1.5a3.5 3.5 0 0 1-3.5 3.5" />
    <path d="M12 13.5v4M8.5 21h7M9.5 21v-3.5h5V21" />
  </Icon>
)

export const IconCamera = (p) => (
  <Icon {...p}>
    <path d="M4 7.5h3l1.8-2.5h6.4L17 7.5h3a1.5 1.5 0 0 1 1.5 1.5v9.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 4 7.5Z" />
    <circle cx="12" cy="13.5" r="3.7" />
  </Icon>
)

export const IconShield = (p) => <Tracciato nome="scudo" {...p} />

export const IconSwap = (p) => <Tracciato nome="scambio" {...p} />

export const IconPencil = (p) => (
  <Icon {...p}>
    <path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4Z" />
    <path d="m13 7 4 4" />
  </Icon>
)

export const IconAlert = (p) => <Tracciato nome="avviso" {...p} />

export const IconSword = (p) => <Tracciato nome="spada" {...p} />
export const IconCycle = (p) => <Tracciato nome="ciclo" {...p} />

export const IconCheck = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const IconClose = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const IconChevronDown = (p) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
)

export const IconGlove = (p) => (
  <Icon {...p}>
    <path d="M8 21v-3.5L5.2 13a2 2 0 0 1 .6-2.7l.4-.2V5.5a1.5 1.5 0 0 1 3 0V10" />
    <path d="M9.2 9.5v-6a1.5 1.5 0 0 1 3 0v6M12.2 9.5V4.5a1.5 1.5 0 0 1 3 0v5M15.2 10V6.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-2.2 4.6V21" />
    <path d="M8 18h8" />
  </Icon>
)

export const IconBandage = (p) => (
  <Icon {...p}>
    <rect x="2.6" y="8.2" width="18.8" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
    <path d="M10 10h.01M14 14h.01M10 14h.01M14 10h.01" />
  </Icon>
)

export const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M10 2.5h4" />
  </Icon>
)

export const IconClipboard = (p) => (
  <Icon {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M8.5 11h7M8.5 15h5" />
  </Icon>
)

export const IconMegaphone = (p) => (
  <Icon {...p}>
    <path d="M3.5 10v4a1 1 0 0 0 1 1H7l7 4.5v-15L7 9H4.5a1 1 0 0 0-1 1Z" />
    <path d="M7 15l1.2 5h2.3L10 16.5M18 9a4 4 0 0 1 0 6" />
  </Icon>
)

export const IconBulb = (p) => (
  <Icon {...p}>
    <path d="M9 18h6M10 21.5h4" />
    <path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7V16h6v-.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5Z" />
  </Icon>
)

export const IconGoal = (p) => (
  <Icon {...p}>
    <path d="M2.5 19.5V6h19v13.5" />
    <path d="M6 6v13.5M10 6v13.5M14 6v13.5M18 6v13.5M2.5 10h19M2.5 14.5h19" opacity="0.5" />
  </Icon>
)

export const IconMove = (p) => (
  <Icon {...p}>
    <path d="M12 3v18M3 12h18" />
    <path d="m9 5.5 3-3 3 3M9 18.5l3 3 3-3M5.5 9l-3 3 3 3M18.5 9l3 3-3 3" />
  </Icon>
)

export const IconAssist = (p) => (
  <Icon {...p}>
    <circle cx="18" cy="6" r="2.6" />
    <path d="M3 19c3-7 7-10.5 12-11.6" />
    <path d="m12 5.5 3.2 1.9-1.9 3.2" />
  </Icon>
)

export const IconWing = (p) => (
  <Icon {...p}>
    <path d="M21 4.5C14 4.5 7 7 3.5 14.5c3-1 5.5-1.5 8-1.5-2.5 1.5-4 3.5-5 6.5 5-1.5 9.5-5 11.5-9.5" />
    <path d="M21 4.5c-.5 3-1.5 5-3 6.5" />
  </Icon>
)

export const IconLongBall = (p) => (
  <Icon {...p}>
    <circle cx="5.5" cy="18" r="2.5" />
    <path d="M8 16C10 8 15.5 5 21 5.5" strokeDasharray="2 2.5" />
    <path d="m17.5 3 3.5 2.5-3 3" />
  </Icon>
)

export const IconThumb = (p) => (
  <Icon {...p}>
    <path d="M7 10.5v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Z" />
    <path d="M7 10.5 11 3a2.3 2.3 0 0 1 3 2.5L13.4 9h5.4a2 2 0 0 1 2 2.4l-1.4 7.2a2.3 2.3 0 0 1-2.3 1.9H7" />
  </Icon>
)

export const IconScale = (p) => (
  <Icon {...p}>
    <path d="M12 3.5v17M7 20.5h10M4.5 7.5h15M12 5.5l-7.5 2M12 5.5l7.5 2" />
    <path d="M4.5 7.5 2 13.5a3 3 0 0 0 5 0ZM19.5 7.5 17 13.5a3 3 0 0 0 5 0Z" />
  </Icon>
)

export const IconFolder = (p) => (
  <Icon {...p}>
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.5h8.8A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5Z" />
  </Icon>
)

export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)


export const IconChevronLeft = (p) => (
  <Icon {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
)

export const IconChevronRight = (p) => (
  <Icon {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
)
