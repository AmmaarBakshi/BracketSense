import { useId } from 'react'
import { familyOf } from '../../core/bracketRules'
import type { Trace } from '../../core/types'
import { Icon } from '../Icon'
import { VirtualList } from '../VirtualList'
import { OP_ICON } from './OpBadge'

const OP_WORD: Record<string, string> = { PUSH: 'push', POP: 'pop', IGNORE: 'ignore', ERROR: 'error', ACCEPT: 'balanced', REJECT: 'not balanced' }

/** Clickable step chips (virtualized) plus a scrubber. */
export function Timeline({ trace, index, onJump }: { trace: Trace; index: number; onJump: (i: number) => void }) {
  const id = useId()
  const last = trace.steps.length - 1
  return (
    <div className="timeline">
      <div className="timeline__bar">
        <label htmlFor={id} className="small" style={{ fontWeight: 700 }}>
          Scrub
        </label>
        <input
          id={id}
          type="range"
          min={-1}
          max={last}
          value={index}
          onChange={(e) => onJump(Number(e.target.value))}
          aria-valuetext={index < 0 ? 'Not started' : `Step ${index + 1} of ${last + 1}`}
          className="timeline__range"
        />
        <output htmlFor={id} className="timeline__out">
          {index < 0 ? 'Start' : `Step ${index + 1} / ${last + 1}`}
        </output>
      </div>
      <ul className="timeline__legend" aria-label="Legend">
        <li>
          <Icon name="arrowDown" /> push
        </li>
        <li>
          <Icon name="arrowUp" /> pop
        </li>
        <li>
          <Icon name="minus" /> ignore
        </li>
        <li>
          <Icon name="xCircle" /> error
        </li>
        <li>
          <Icon name="checkCircle" /> balanced
        </li>
      </ul>
      <VirtualList
        horizontal
        className="timeline__track"
        count={trace.steps.length}
        itemSize={48}
        scrollToIndex={index}
        role="list"
        ariaLabel="Steps"
        renderItem={(i, style) => {
          const s = trace.steps[i]
          const fam = s.char ? familyOf(s.char) : null
          const tone = s.operation === 'ERROR' || s.operation === 'REJECT' ? 'bad' : s.operation === 'ACCEPT' ? 'ok' : fam ?? 'ignored'
          const isCurrent = i === index
          return (
            <div key={i} style={style} role="listitem" className="timeline__cell">
              <button
                type="button"
                className={`tchip tchip--${tone} ${isCurrent ? 'is-current' : ''} ${i < index ? 'is-done' : ''}`}
                onClick={() => onJump(i)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${s.step}: ${s.char === null ? 'end of input' : s.char === ' ' ? 'space' : s.char === '\n' ? 'newline' : s.char}, ${OP_WORD[s.operation]}`}
              >
                {isCurrent && <span className="tchip__now">Current</span>}
                <span className="tchip__glyph">{s.char === null ? 'END' : s.char === ' ' ? '␠' : s.char === '\n' ? '↵' : s.char}</span>
                <Icon name={OP_ICON[s.operation]} className="tchip__op" />
              </button>
            </div>
          )
        }}
      />
    </div>
  )
}
