import { useEffect, type ReactNode } from 'react'

export type PageTint = 'home' | 'learn' | 'visualizer' | 'playground' | 'compare' | 'quiz' | 'challenges' | 'viva'

interface PageHeaderProps {
  tint: PageTint
  eyebrow?: ReactNode
  title: ReactNode
  intro?: ReactNode
  art?: ReactNode
  actions?: ReactNode
}

/** Coloured band at the top of each page; every section has its own tint. */
export function PageHeader({ tint, eyebrow, title, intro, art, actions }: PageHeaderProps) {
  return (
    <div className="page-band" style={{ ['--band' as string]: `var(--tint-${tint})` }}>
      <div className="page-band__inner">
        <div className="page-band__text">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
          {actions && <div className="row" style={{ marginTop: 'var(--sp-4)' }}>{actions}</div>}
        </div>
        {art && <div className="page-band__art">{art}</div>}
      </div>
    </div>
  )
}

/** Sets document.title for the current page. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · BracketSense` : 'BracketSense — Watch the Stack think'
  }, [title])
}
