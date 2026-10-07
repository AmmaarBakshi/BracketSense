import { useEffect, useMemo, useRef, useState } from 'react'
import { familyOf } from '../../core/bracketRules'
import { buildTrace } from '../../core/traceEngine'
import { Icon } from '../Icon'
import { RichText } from '../RichText'
import { StackView } from '../StackView'
import { OpBadge } from '../trace/OpBadge'

/** A small looping demo driven by the real trace engine (never a canned animation). */
export function HeroLiveStack({ input = '{[()]}' }: { input?: string }) {
  const trace = useMemo(() => buildTrace(input), [input])
  const [index, setIndex] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const last = trace.steps.length - 1

  // Only animate while on screen.
  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (paused || !visible) return
    const delay = index >= last ? 2600 : index < 0 ? 900 : 1150
    const id = window.setTimeout(() => setIndex((i) => (i >= last ? -1 : i + 1)), delay)
    return () => window.clearTimeout(id)
  }, [index, paused, visible, last])

  const step = index >= 0 ? trace.steps[index] : null

  return (
    <div ref={box} className="herolive" aria-label="Live demo: the Stack checking {[()]}" role="group">
      <div className="herolive__head">
        <span className="herolive__live">
          <span className="herolive__dot" aria-hidden="true" /> Live engine
        </span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          <Icon name={paused ? 'play' : 'pause'} />
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
      <div className="herolive__input" aria-hidden="true">
        {[...input].map((c, i) => (
          <span
            key={i}
            className={[
              'herolive__ch',
              `ctext--${familyOf(c)}`,
              step && step.charIndex === i ? 'is-current' : '',
              step && i < step.charIndex ? 'is-done' : '',
            ].join(' ')}
          >
            {c}
          </span>
        ))}
      </div>
      <StackView step={step} direction={index <= 0 ? 'jump' : 'forward'} size="sm" showIncoming={false} maxVisible={8} />
      <p className="herolive__caption" aria-live="off">
        {step ? (
          <>
            <OpBadge op={step.operation} /> <RichText text={step.decision} />
          </>
        ) : (
          <span className="muted">Scanning {input} from left to right…</span>
        )}
      </p>
    </div>
  )
}
