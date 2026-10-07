import { useMemo, useState, type ReactNode } from 'react'
import { closerFor, familyOf, OPENING, type OpenBracket } from '../../core/bracketRules'
import { buildPairMap } from '../../core/matcher'
import { buildTrace } from '../../core/traceEngine'
import { Icon } from '../Icon'
import { Glyph } from '../RichText'
import { StackView } from '../StackView'

const CELL = 44

function makeRound(seed: number): string {
  // deterministic but varied: 3-5 openers, never the same type twice in a row
  let s = ''
  let x = seed * 9301 + 49297
  const len = 3 + (seed % 3)
  let prev = ''
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280
    let o: OpenBracket = OPENING[x % 3]
    if (o === prev) o = OPENING[(x + 1) % 3]
    s += o
    prev = o
  }
  return s
}

/** Lesson 4: close the brackets in the only order a Stack allows. */
export function WhoClosesWidget() {
  const [round, setRound] = useState(1)
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: ReactNode } | null>(null)
  const [solved, setSolved] = useState(0)
  const opens = useMemo(() => makeRound(round), [round])
  const current = opens + typed
  const trace = useMemo(() => buildTrace(current), [current])
  const complete = typed.length === opens.length
  const step = complete ? trace.steps[trace.steps.length - 1] : trace.steps[trace.steps.length - 2] ?? null
  const pairs = useMemo(() => buildPairMap(current).pairs, [current])
  const expected = complete ? null : closerFor(opens[opens.length - 1 - typed.length] as OpenBracket)

  const choose = (c: string) => {
    if (!expected) return
    if (c === expected) {
      const next = typed + c
      setTyped(next)
      if (next.length === opens.length) {
        setSolved((n) => n + 1)
        setMsg({ ok: true, text: 'All closed in reverse order, and the Stack is empty: balanced. That is LIFO.' })
      } else setMsg({ ok: true, text: <>Correct: it matched the top of the Stack, which is now popped.</> })
    } else {
      const top = opens[opens.length - 1 - typed.length]
      setMsg({
        ok: false,
        text: (
          <>
            Not quite. The top of the Stack is <Glyph char={top} />, the most recently opened bracket, so it must close first with <Glyph char={expected} />.
          </>
        ),
      })
    }
  }

  const width = current.length * CELL

  return (
    <div className="widget widget--split">
      <div className="widget__controls">
        <p className="widget__qtext">Close every bracket. Which closer is allowed next?</p>
        <div className="arcs" style={{ width }}>
          <svg width={width} height={70} aria-hidden="true" className="arcs__svg">
            {pairs.map(([a, b]) => {
              const x1 = a * CELL + CELL / 2
              const x2 = b * CELL + CELL / 2
              const h = Math.min(62, 18 + (b - a) * 9)
              return <path key={`${a}-${b}`} d={`M${x1} 70 C ${x1} ${70 - h}, ${x2} ${70 - h}, ${x2} 70`} className={`arc arc--${familyOf(current[a])}`} />
            })}
          </svg>
          <div className="arcs__chars" aria-label={`Current input ${current}`}>
            {[...current].map((c, i) => (
              <span key={i} className={`arcs__ch ctext--${familyOf(c)}`} style={{ width: CELL }}>
                {c}
              </span>
            ))}
            {!complete && <span className="arcs__cursor" aria-hidden="true" />}
          </div>
        </div>
        <div className="btn-group" role="group" aria-label="Closing brackets">
          {[')', ']', '}'].map((c) => (
            <button key={c} type="button" className="btn btn--lg qopt" onClick={() => choose(c)} disabled={complete}>
              <Glyph char={c} />
            </button>
          ))}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setRound((r) => r + 1)
              setTyped('')
              setMsg(null)
            }}
          >
            <Icon name="shuffle" /> {complete ? 'Next round' : 'New round'}
          </button>
        </div>
        {msg && (
          <p className={`callout ${msg.ok ? 'callout--success' : 'callout--warning'}`} role="status">
            <Icon name={msg.ok ? 'checkCircle' : 'info'} />
            <span>{msg.text}</span>
          </p>
        )}
        <p className="small muted">Rounds solved: {solved}</p>
      </div>
      <StackView step={step} direction="forward" size="sm" showIncoming={false} />
    </div>
  )
}
