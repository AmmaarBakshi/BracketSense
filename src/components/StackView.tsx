import { useState } from 'react'
import { closerFor, familyOf } from '../core/bracketRules'
import type { StackSnapshot } from '../core/Stack'
import type { Position, StackItem, TraceStep } from '../core/types'
import type { Direction } from '../hooks/useTracePlayer'
import { EmptyStackArt } from './art/Art'
import { AssetImage } from './AssetImage'
import { Icon } from './Icon'
import { Glyph } from './RichText'
import { VirtualList } from './VirtualList'
import './StackView.css'

interface StackViewProps {
  /** Current step; null = ready state (nothing processed, empty stack). */
  step: TraceStep | null
  direction?: Direction
  size?: 'sm' | 'md' | 'lg'
  /** Max blocks drawn before switching to the compact "N more below" view. */
  maxVisible?: number
  positionOf?: (index: number) => Position
  /** Show the "Reading: x" lane above the stack. */
  showIncoming?: boolean
  className?: string
  /** Optional explicit snapshot (e.g. a Learn widget's own Stack). */
  snapshot?: StackSnapshot<StackItem>
}

const OP_LABEL: Record<string, string> = {
  PUSH: 'PUSH',
  POP: 'POP',
  IGNORE: 'IGNORE',
  ERROR: 'ERROR',
  ACCEPT: 'BALANCED',
  REJECT: 'NOT BALANCED',
}

export function StackView({ step, direction = 'jump', size = 'md', maxVisible = 30, positionOf, showIncoming = true, className, snapshot }: StackViewProps) {
  const [expanded, setExpanded] = useState(false)
  // The popped block is a transient effect: drop it once its animation has played.
  const [ghostDone, setGhostDone] = useState<number | null>(null)
  const snap = snapshot ?? step?.after
  const total = snap ? snap.size : 0
  const animate = direction === 'forward'
  const op = step?.operation

  const compact = total > maxVisible
  const visibleCount = compact ? maxVisible - 1 : total
  const items = snap ? snap.topItems(visibleCount) : []
  const hidden = total - items.length

  const errorTop = op === 'ERROR' && step?.error?.type === 'WRONG_TYPE'
  const unclosed = op === 'REJECT'

  const blockClass = (item: StackItem, isTop: boolean) => {
    const fam = familyOf(item.char) ?? 'round'
    const cls = ['sblock', `sblock--${fam}`]
    if (isTop) cls.push('is-top')
    if (isTop && animate && op === 'PUSH' && step?.charIndex === item.index) cls.push('is-entering')
    if (isTop && errorTop) cls.push('is-mismatch', animate ? 'is-shaking' : '')
    if (unclosed) cls.push('is-unclosed')
    return cls.filter(Boolean).join(' ')
  }

  const meta = (item: StackItem) => {
    if (!positionOf) return `#${item.index}`
    const p = positionOf(item.index)
    return `L${p.line}:C${p.col}`
  }

  const describe = (item: StackItem, isTop: boolean) => {
    const p = positionOf?.(item.index)
    return `${item.char}${p ? ` from line ${p.line}, column ${p.col}` : ''}${isTop ? ', top' : ''}`
  }

  const top = items[0]

  return (
    <div className={['stackview', `stackview--${size}`, className ?? ''].filter(Boolean).join(' ')}>
      {showIncoming && (
        <div className="stackview__lane" aria-hidden="true">
          {!step ? (
            <span className="lane-chip lane-chip--idle">Waiting to start</span>
          ) : step.kind === 'end' ? (
            <span className={`lane-chip lane-chip--${op === 'ACCEPT' ? 'ok' : 'bad'}`}>
              End of input → {OP_LABEL[op!]}
            </span>
          ) : (
            <span className={`lane-chip lane-chip--${op === 'ERROR' ? 'bad' : op === 'IGNORE' ? 'idle' : 'ok'}`} key={step.step}>
              Reading <Glyph char={step.char!} /> → {OP_LABEL[op!]}
            </span>
          )}
        </div>
      )}

      <div className={`stackview__well ${op === 'ERROR' && step?.error?.type === 'UNMATCHED_CLOSING' && animate ? 'is-shaking' : ''}`}>
        {/* popped block lifts away, with a green match burst */}
        {op === 'POP' && animate && step?.top && ghostDone !== step.step && (
          <div
            className="stackview__ghost"
            key={`ghost-${step.step}`}
            aria-hidden="true"
            onAnimationEnd={(e) => {
              if (e.animationName === 'bs-burst') setGhostDone(step.step)
            }}
          >
            <div className={`sblock sblock--${familyOf(step.top.char)} is-leaving`}>
              <span className="sblock__glyph">{step.top.char}</span>
              <span className="sblock__pair">
                matched by <Glyph char={step.char!} />
              </span>
            </div>
            <span className="stackview__burst">
              <Icon name="check" /> match
            </span>
          </div>
        )}

        {/* wrong type: the incoming closer bounces off the top */}
        {errorTop && step?.top && (
          <div className="stackview__clash" key={`clash-${step.step}`} role="img" aria-label={`${step.char} does not match ${step.top.char}`}>
            <Glyph char={step.char!} />
            <span className="stackview__clash-x">
              <Icon name="x" /> ≠ <Glyph char={step.top.char} />
            </span>
            <span className="small">expected {closerFor(step.top.char)}</span>
          </div>
        )}

        {expanded && compact ? (
          <VirtualList
            className="stackview__scroll"
            focusable
            count={total}
            itemSize={size === 'lg' ? 70 : size === 'sm' ? 38 : 52}
            role="list"
            ariaLabel={`Stack contents, ${total} items, top first`}
            renderItem={(i, style) => {
              const all = snap!.toArray()
              const item = all[all.length - 1 - i]
              return (
                <div key={item.index} style={style} role="listitem" className="stackview__vrow">
                  <div className={blockClass(item, i === 0)}>
                    <span className="sr-only">{describe(item, i === 0)}</span>
                    <span className="sblock__glyph" aria-hidden="true">
                      {item.char}
                    </span>
                    <span className="sblock__meta" aria-hidden="true">
                      {meta(item)}
                    </span>
                  </div>
                </div>
              )
            }}
          />
        ) : (
          <ol className="stackview__list" aria-label={`Stack contents, ${total} item${total === 1 ? '' : 's'}, top first`}>
            {items.map((item, i) => (
              <li key={item.index} className={blockClass(item, i === 0)} aria-label={describe(item, i === 0)}>
                {i === 0 && (
                  <span className="sblock__top" aria-hidden="true">
                    TOP <Icon name="arrowRight" />
                  </span>
                )}
                <span className="sblock__glyph" aria-hidden="true">
                  {item.char}
                </span>
                <span className="sblock__meta" aria-hidden="true">
                  {meta(item)}
                </span>
              </li>
            ))}
            {hidden > 0 && (
              <li className="sblock-more">
                <span>⋮ {hidden.toLocaleString()} more below</span>
              </li>
            )}
          </ol>
        )}

        {total === 0 && (
          <div className="stackview__empty">
            <AssetImage slot="empty-stack" alt="" fallback={<EmptyStackArt />} className="stackview__empty-art" />
            {op === 'ACCEPT' ? (
              <span className="badge badge--success">
                <Icon name="check" /> Empty at the end: balanced
              </span>
            ) : op === 'ERROR' ? (
              <span className="badge badge--error">
                <Icon name="x" /> Empty: nothing to match <Glyph char={step!.char!} />
              </span>
            ) : (
              <span className="muted small">Stack is empty</span>
            )}
          </div>
        )}

        <div className="stackview__floor" aria-hidden="true">
          bottom
        </div>
      </div>

      <div className="stackview__footer">
        <span>
          Size <strong>{total}</strong>
        </span>
        <span>
          Top{' '}
          {top ? (
            <Glyph char={top.char} />
          ) : (
            <span className="muted">none</span>
          )}
        </span>
        {compact && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setExpanded((e) => !e)} aria-pressed={expanded}>
            <Icon name={expanded ? 'minimize' : 'maximize'} />
            {expanded ? 'Compact view' : `Show all ${total.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  )
}
