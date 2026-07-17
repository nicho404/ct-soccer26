// Icone SVG a tratto (stile outline, 24x24, colore da currentColor).
// Sostituiscono le emoji per un look da app sportiva (Tuttocampo & simili).

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

export const IconGear = (p) => (
  <Icon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)
