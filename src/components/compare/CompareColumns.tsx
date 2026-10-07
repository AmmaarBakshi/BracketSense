import { familyOf } from '../../core/bracketRules'
import type { AltResult, AltStep } from '../../core/alternatives'
import { Icon } from '../Icon'
import { Glyph, RichText } from '../RichText'
import './compare.css'

export interface ColumnSpec {
  result: AltResult
  title: string
  badge?: { label: string; tone: 'success' | 'warning' | 'error' }
}

/** Latest step of a run at scrubber position `pos` (a character index; input.length = end). */
export function stepAt(result: AltResult, pos: number): AltStep | null {
  let cur: AltStep | null = null
  for (const s of result.steps) {
    if (s.index <= pos) cur = s
    else break
  }
  return cur
}

/** Character positions where any run does something (brackets + end of input). */
export function scrubPositions(input: string, results: readonly AltResult[]): number[] {
  const set = new Set<number>()
  for (const r of results) for (const s of r.steps) set.add(s.index)
  set.add(input.length)
  return [...set].sort((a, b) => a - b)
}

export function CompareColumns({ columns, pos, truth, inputLength }: { columns: ColumnSpec[]; pos: number; truth: boolean; inputLength: number }) {
  return (
    <div className="ccols">
      {columns.map((col) => {
        const r = col.result
        const s = stepAt(r, pos)
        const finished = s?.final === true
        const stoppedEarly = finished && s!.index < pos && s!.index < inputLength
        const atEnd = pos >= inputLength || finished
        const right = r.balanced === truth
        return (
          <section key={r.strategy} className={`ccol ccol--${r.kind}`} aria-label={col.title}>
            <header className="ccol__head">
              <h3 className="ccol__title">
                <Icon name={r.kind === 'stack' ? 'layers' : r.kind === 'queue' ? 'queue' : 'hash'} />
                {col.title}
              </h3>
              {col.badge && <span className={`badge badge--${col.badge.tone}`}>{col.badge.label}</span>}
            </header>

            <div className="ccol__viz">
              {r.kind === 'counter' ? <CounterViz result={r} step={s} /> : r.kind === 'queue' ? <QueueViz step={s} /> : <StackViz step={s} />}
            </div>

            <div className={`ccol__note ${s && !s.ok ? 'is-bad' : ''}`}>
              {s ? (
                <>
                  <span className="ccol__action">
                    {s.char !== null ? <Glyph char={s.char} /> : <span className="badge">end</span>} {s.action}
                  </span>
                  <p>
                    <RichText text={s.note} />
                  </p>
                </>
              ) : (
                <p className="muted">Not started.</p>
              )}
              {stoppedEarly && <p className="small muted">Stopped here: this implementation already gave its answer.</p>}
            </div>

            <footer className={`ccol__verdict ${atEnd ? (right ? 'is-right' : 'is-wrong') : ''}`} aria-live="polite">
              {atEnd ? (
                <>
                  <Icon name={right ? 'checkCircle' : 'xCircle'} />
                  <span>
                    Says <strong>{r.balanced ? 'Balanced' : 'Not balanced'}</strong> — {right ? 'correct' : 'wrong'}
                  </span>
                </>
              ) : (
                <span className="muted small">Verdict at the end…</span>
              )}
            </footer>
          </section>
        )
      })}
    </div>
  )
}

function StackViz({ step }: { step: AltStep | null }) {
  const items = step?.structure ?? []
  const shown = items.slice(-8)
  return (
    <div className="mstack" role="img" aria-label={`Stack, bottom to top: ${items.join(' ') || 'empty'}`}>
      {items.length > shown.length && <span className="mstack__more">+{items.length - shown.length} below</span>}
      <div className="mstack__col">
        {[...shown].reverse().map((c, i) => (
          <span key={i} className={`mstack__blk mblk--${familyOf(c)} ${i === 0 ? 'is-top' : ''}`}>
            {i === 0 && <span className="mstack__label">TOP</span>}
            {c}
          </span>
        ))}
        {items.length === 0 && <span className="mstack__empty">empty</span>}
      </div>
    </div>
  )
}

function QueueViz({ step }: { step: AltStep | null }) {
  const items = step?.structure ?? []
  return (
    <div className="mqueue" role="img" aria-label={`Queue, front to back: ${items.join(' ') || 'empty'}`}>
      <span className="mqueue__end">FRONT</span>
      <div className="mqueue__row">
        {items.slice(0, 8).map((c, i) => (
          <span key={i} className={`mqueue__blk mblk--${familyOf(c)} ${i === 0 ? 'is-front' : ''}`}>
            {c}
          </span>
        ))}
        {items.length > 8 && <span className="small muted">+{items.length - 8}</span>}
        {items.length === 0 && <span className="mstack__empty">empty</span>}
      </div>
      <span className="mqueue__end">BACK</span>
    </div>
  )
}

function CounterViz({ result, step }: { result: AltResult; step: AltStep | null }) {
  const upto = step ? result.steps.slice(0, result.steps.indexOf(step) + 1).filter((s) => s.char !== null) : []
  return (
    <div className="mcounter">
      <span className="mcounter__value">
        <span className="sr-only">Counter value </span>
        {step?.counter ?? 0}
      </span>
      <span className="mcounter__hist">
        {upto.slice(-8).map((s, i) => (
          <span key={i} className="mcounter__h">
            <Glyph char={s.char!} /> →{s.counter}
          </span>
        ))}
      </span>
    </div>
  )
}
