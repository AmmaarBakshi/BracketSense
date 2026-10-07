import { useRef, useState } from 'react'
import { Stack, StackUnderflowError } from '../../core/Stack'
import { Icon } from '../Icon'
import { LetterStack, type LetterItem } from './LetterStack'

type Op = { kind: 'push'; value: string } | { kind: 'pop' } | { kind: 'peek' } | { kind: 'isEmpty' }

const SCRIPT: Op[] = [
  { kind: 'push', value: '(' },
  { kind: 'push', value: '[' },
  { kind: 'peek' },
  { kind: 'pop' },
  { kind: 'isEmpty' },
  { kind: 'pop' },
  { kind: 'isEmpty' },
  { kind: 'pop' },
]

const label = (op: Op) => (op.kind === 'push' ? `push(${op.value})` : `${op.kind}()`)

/** Lesson 3: run push / pop / peek / isEmpty one at a time on a real Stack. */
export function OperationsWidget() {
  const stack = useRef(new Stack<LetterItem>())
  const id = useRef(1)
  const [done, setDone] = useState<Array<{ result: string; warn?: boolean }>>([])
  const [items, setItems] = useState<LetterItem[]>([])
  const [popped, setPopped] = useState<LetterItem | null>(null)
  const [peeking, setPeeking] = useState(false)
  const [pushed, setPushed] = useState<number | null>(null)

  const runNext = () => {
    const op = SCRIPT[done.length]
    if (!op) return
    setPopped(null)
    setPeeking(false)
    setPushed(null)
    let result = ''
    let warn = false
    if (op.kind === 'push') {
      const item = { id: id.current++, label: op.value }
      stack.current.push(item)
      setPushed(item.id)
      result = `${op.value} is placed on top`
    } else if (op.kind === 'pop') {
      try {
        const item = stack.current.pop()
        setPopped(item)
        result = `returns ${item.label}`
      } catch (e) {
        if (!(e instanceof StackUnderflowError)) throw e
        result = 'underflow! The stack is empty. The checker calls isEmpty() first to avoid this.'
        warn = true
      }
    } else if (op.kind === 'peek') {
      const top = stack.current.peek()
      setPeeking(true)
      result = `returns ${top?.label ?? 'nothing'} (not removed)`
    } else {
      result = `returns ${stack.current.isEmpty()}`
    }
    setItems(stack.current.toArray())
    setDone((d) => [...d, { result, warn }])
  }

  const reset = () => {
    stack.current.clear()
    setItems([])
    setDone([])
    setPopped(null)
    setPeeking(false)
  }

  return (
    <div className="widget widget--split">
      <div className="widget__controls">
        <ol className="opscript">
          {SCRIPT.map((op, i) => {
            const r = done[i]
            const isNext = i === done.length
            return (
              <li key={i} className={`opscript__row ${r ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`} aria-current={isNext ? 'step' : undefined}>
                <code>{label(op)}</code>
                <span className={`opscript__res ${r?.warn ? 'is-warn' : ''}`}>{r ? r.result : isNext ? 'next' : ''}</span>
                <span className="badge">O(1)</span>
              </li>
            )
          })}
        </ol>
        <div className="btn-group">
          <button type="button" className="btn btn--primary" onClick={runNext} disabled={done.length >= SCRIPT.length}>
            <Icon name="stepForward" /> Run {done.length < SCRIPT.length ? label(SCRIPT[done.length]) : 'next'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            <Icon name="restart" /> Reset
          </button>
        </div>
        <p className="small muted">Before each click, predict what the operation returns. Every one of them takes constant time.</p>
      </div>
      <LetterStack items={items} popped={popped} peeking={peeking} justPushed={pushed} />
    </div>
  )
}
