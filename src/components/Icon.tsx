import type { ReactNode, SVGProps } from 'react'

/** Small hand-tuned 24px stroke icon set (no icon library needed). */
const PATHS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9v11h4.5v-6h4v6h4.5V9" />
    </>
  ),
  book: (
    <>
      <path d="M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h14v-4" />
      <path d="M9 7h6" />
    </>
  ),
  layers: (
    <>
      <rect x="5" y="15" width="14" height="5" rx="1.5" />
      <rect x="5" y="9.5" width="14" height="5" rx="1.5" />
      <rect x="5" y="4" width="14" height="5" rx="1.5" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9V3" />
      <path d="M7.2 15h9.6" />
    </>
  ),
  columns: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="16" rx="1.5" />
      <rect x="16" y="4" width="5" height="16" rx="1.5" />
    </>
  ),
  quiz: (
    <>
      <path d="m3.5 6.5 2 2 3.5-3.5" />
      <path d="m3.5 13.5 2 2 3.5-3.5" />
      <path d="M12.5 7H21M12.5 14H21M4 20h17" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 16.5V21M7 3.5h10V9a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H4v1.5a3 3 0 0 0 3 3M17 5.5h3V7a3 3 0 0 1-3 3" />
    </>
  ),
  cap: (
    <>
      <path d="m2 9 10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6" />
    </>
  ),
  play: <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z" fill="currentColor" />,
  pause: (
    <>
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
    </>
  ),
  stepForward: (
    <>
      <path d="M5 5.5v13l9.5-6.5z" fill="currentColor" />
      <path d="M18.5 5v14" />
    </>
  ),
  stepBack: (
    <>
      <path d="M19 5.5v13L9.5 12z" fill="currentColor" />
      <path d="M5.5 5v14" />
    </>
  ),
  restart: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3L3.5 8.2" />
      <path d="M3.5 3.5v4.7h4.7" />
    </>
  ),
  rotate: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.8-6.3l2.8 2.5" />
      <path d="M20.5 3.5v4.7h-4.7" />
    </>
  ),
  eraser: (
    <>
      <path d="m7.5 20.5-4.3-4.3a1.2 1.2 0 0 1 0-1.7l10-10a1.2 1.2 0 0 1 1.7 0l5.6 5.6a1.2 1.2 0 0 1 0 1.7l-8.7 8.7z" />
      <path d="M21 20.5H7.5M5.5 10.8l8.7 8.7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.5-2.8 4.2" />
      <path d="M12 17.6h.01" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />,
  monitor: (
    <>
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M8 21h8M12 16.5V21" />
      <path d="m10 7.3 4.6 2.7-4.6 2.7z" fill="currentColor" />
    </>
  ),
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.5 3 3 5.5-6" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5M12 17.4h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m18 15-6-6-6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  upload: (
    <>
      <path d="M12 15V3.5M7 8.5l5-5 5 5" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5V15M7 10l5 5 5-5" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12.5" height="12.5" rx="2" />
      <path d="M15.5 8.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h3.5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21.5h4" />
      <path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.3 1 2.1v.8h6v-.8c0-.8.4-1.6 1-2.1a6.5 6.5 0 0 0-4-11.6z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  flame: <path d="M12 22c4 0 7-2.7 7-6.8 0-3.8-2.6-6.3-4.3-8.2-.4 2.1-1.4 3.4-2.7 4-.3-3.3-2-6.4-4.5-8.5.3 3.5-2.5 5.9-3.4 8.4A7 7 0 0 0 12 22z" />,
  star: <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />,
  starFilled: <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 6.5V12l3.5 2" />
    </>
  ),
  zap: <path d="M13 2.5 4 13.5h7l-1 8 9-11h-7z" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.5-4.5" />
    </>
  ),
  shuffle: (
    <path d="M3 6h3.5c4 0 6.5 12 11 12H21M18 15l3 3-3 3M3 18h3.5c1.6 0 2.8-1.6 3.9-3.8M13.6 9.8C14.7 7.6 15.9 6 17.5 6H21M18 3l3 3-3 3" />
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  fold: (
    <>
      <path d="M4 4h16M4 20h16" />
      <path d="m9 8.5 3 3 3-3M9 15.5l3-3 3 3" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
  bug: (
    <>
      <rect x="7" y="7" width="10" height="14" rx="5" />
      <path d="M12 11v10M7 13H3M21 13h-4M7 17l-3 2M17 17l3 2M7 9.5 4 7.5M17 9.5l3-2M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="m7.5 15 4-4 3 3 5.5-6.5" />
    </>
  ),
  bars: <path d="M5 20v-8M11 20V5M17 20v-11M3 20h18" />,
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M3 14.8h18M9 9.5V20" />
    </>
  ),
  grip: (
    <g fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </g>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.6 13.8-1.6 7.7 5-3 5 3-1.6-7.7" />
    </>
  ),
  maximize: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />,
  minimize: <path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" />,
  file: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </>
  ),
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />,
  braces: (
    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
  ),
  flow: (
    <>
      <rect x="3" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="15" width="8" height="6" rx="1.5" />
      <path d="M7 9v3.5a2 2 0 0 0 2 2h4" />
      <path d="m15.5 4 3 2-3 2" />
    </>
  ),
  message: <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />,
  timeline: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12h6M15 12h6" />
    </>
  ),
  pencil: <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  skip: <path d="m5 5 7 7-7 7zM13 5l7 7-7 7z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  map: (
    <>
      <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  flag: (
    <>
      <path d="M4 22V4" />
      <path d="M4 4h12l-2 4 2 4H4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  queue: (
    <>
      <rect x="2.5" y="8" width="5" height="8" rx="1.2" />
      <rect x="9.5" y="8" width="5" height="8" rx="1.2" />
      <rect x="16.5" y="8" width="5" height="8" rx="1.2" />
    </>
  ),
  hash: <path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  label?: string
  size?: number | string
}

export function Icon({ name, label, size, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
