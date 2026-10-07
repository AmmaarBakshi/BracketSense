import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import './Tour.css'

export interface TourStep {
  /** CSS selector of the element to point at, e.g. [data-tour="editor"] */
  target: string
  title: string
  body: string
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/** Lightweight coach marks: highlights one element at a time with a short note. */
export function Tour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const step = steps[i]

  const measure = useCallback(() => {
    const el = step ? document.querySelector<HTMLElement>(step.target) : null
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  useEffect(() => {
    if (!open || !step) return
    const el = document.querySelector<HTMLElement>(step.target)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const id = window.setTimeout(measure, 380)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, step, measure])

  useLayoutEffect(() => {
    if (open) card.current?.focus()
  }, [open, i])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !step) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardW = Math.min(340, vw - 24)
  let top = rect ? rect.top + rect.height + 12 : vh / 2 - 90
  if (rect && top + 200 > vh) top = Math.max(12, rect.top - 212)
  const left = rect ? Math.min(Math.max(12, rect.left), vw - cardW - 12) : (vw - cardW) / 2

  const finish = () => {
    setI(0)
    onClose()
  }

  return (
    <div className="tour" role="presentation">
      {rect && <div className="tour__ring" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} />}
      <div ref={card} className="tour__card" role="dialog" aria-modal="false" aria-labelledby="tour-title" tabIndex={-1} style={{ top, left, width: cardW }}>
        <div className="tour__count">
          {i + 1} / {steps.length}
        </div>
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <p>{step.body}</p>
        <div className="row">
          <button type="button" className="btn btn--sm btn--ghost" onClick={finish}>
            Skip tour
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn--sm" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
            <Icon name="chevronLeft" /> Back
          </button>
          {i < steps.length - 1 ? (
            <button type="button" className="btn btn--sm btn--primary" onClick={() => setI((n) => n + 1)}>
              Next <Icon name="chevronRight" />
            </button>
          ) : (
            <button type="button" className="btn btn--sm btn--primary" onClick={finish}>
              Done <Icon name="check" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
