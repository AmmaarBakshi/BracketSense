import type { ReactNode } from 'react'
import { formatPosition } from '../../core/position'
import type { TraceStep } from '../../core/types'
import { Icon } from '../Icon'
import { Glyph, RichText } from '../RichText'
import { OpBadge } from './OpBadge'

/** "Why did this happen?" — the plain-English reasoning behind the current step. */
export function ExplainPanel({ step, total }: { step: TraceStep | null; total: number }) {
  if (!step) {
    return (
      <div className="explain explain--idle">
        <p>
          <strong>Nothing has happened yet.</strong> Press <kbd>Run Trace ▶</kbd> to watch every step, or <kbd>Step ▶</kbd> to go one character at a
          time.
        </p>
        <p className="muted small">
          For each character this panel answers: what did the algorithm see, what must it do, what is on top of the Stack, and why the Stack changed.
        </p>
      </div>
    )
  }

  const top = step.top ?? step.stackBefore[step.stackBefore.length - 1]
  const rows: Array<[string, ReactNode]> = [
    [
      'Character',
      step.char !== null ? (
        <span className="row" style={{ gap: 8 }}>
          <Glyph char={step.char} /> <span className="muted small">{formatPosition(step.position)}</span>
        </span>
      ) : (
        <span>End of input</span>
      ),
    ],
    ['What did the algorithm see?', <RichText text={step.seen} />],
    ['What must it do?', <RichText text={step.mustDo} />],
    ['Stack top', top ? <Glyph char={top.char} /> : <span className="muted">empty</span>],
    ['Expected', step.expected ? <Glyph char={step.expected} /> : <span className="muted">—</span>],
    ['Found', step.found ? <Glyph char={step.found} /> : step.char && step.kind !== 'end' ? <Glyph char={step.char} /> : <span className="muted">—</span>],
  ]

  const tone = step.operation === 'ERROR' || step.operation === 'REJECT' ? 'error' : step.operation === 'ACCEPT' ? 'success' : 'info'

  return (
    <div className="explain">
      <div className="explain__head">
        <span className="explain__step">
          Step {step.step} of {total}
        </span>
        <OpBadge op={step.operation} />
      </div>
      <dl className="explain__grid">
        {rows.map(([k, v]) => (
          <div key={k} className="explain__row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className={`callout callout--${tone === 'info' ? '' : tone} explain__why`}>
        <Icon name={tone === 'error' ? 'alert' : tone === 'success' ? 'checkCircle' : 'bulb'} />
        <p>
          <RichText text={step.explanation} />
        </p>
      </div>
      {step.error && (
        <p className="explain__error" role="note">
          <strong>Error:</strong> <RichText text={step.error.message} />
        </p>
      )}
    </div>
  )
}
