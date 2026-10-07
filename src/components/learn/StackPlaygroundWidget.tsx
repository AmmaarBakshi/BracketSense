import { useRef, useState } from 'react'
import { useAnnounce } from '../../app/announcer'
import { Stack, StackOverflowError, StackUnderflowError } from '../../core/Stack'
import { Icon } from '../Icon'
import { LetterStack, type LetterItem } from './LetterStack'

const CAPACITY = 6

interface LogEntry {
  id: number
  op: string
  result: string
  tone: 'ok' | 'info' | 'warn'
}

/** Lesson 1: a real Stack (linked list, capacity 6) you can push, pop, peek and clear. */
export function StackPlaygroundWidget() {
  const stack = useRef(new Stack<LetterItem>(CAPACITY))
  const nextId = useRef(1)
  const [items, setItems] = useState<LetterItem[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [popped, setPopped] = useState<LetterItem | null>(null)
  const [peeking, setPeeking] = useState(false)
  const [justPushed, setJustPushed] = useState<number | null>(null)
  const announce = useAnnounce()

  const record = (op: string, result: string, tone: LogEntry['tone'] = 'ok') => {
    setLog((l) => [{ id: Date.now() + Math.random(), op, result, tone }, ...l].slice(0, 12))
    announce(`${op}: ${result}`)
  }
  const sync = () => setItems(stack.current.toArray())

  const push = (label: string) => {
    setPopped(null)
    setPeeking(false)
    try {
      const item = { id: nextId.current++, label }
      stack.current.push(item)
      setJustPushed(item.id)
      sync()
      record(`push(${label})`, `${label} is now the TOP. Size ${stack.current.size()}.`)
    } catch (e) {
      if (e instanceof StackOverflowError) record(`push(${label})`, `The stack is full (capacity ${CAPACITY}). Adding more is called overflow.`, 'warn')
      else throw e
    }
  }

  const pop = () => {
    setPeeking(false)
    setJustPushed(null)
    try {
      const item = stack.current.pop()
      setPopped(item)
      sync()
      const top = stack.current.peek()
      record('pop()', `returned ${item.label}. ${top ? `${top.label} is the new TOP.` : 'The stack is now empty.'}`)
    } catch (e) {
      if (e instanceof StackUnderflowError) record('pop()', 'Nothing to remove: the stack is empty. This is called underflow; check isEmpty() first.', 'warn')
      else throw e
    }
  }

  const peek = () => {
    setPopped(null)
    setJustPushed(null)
    const top = stack.current.peek()
    setPeeking(!!top)
    record('peek()', top ? `returned ${top.label}. It stays on the stack.` : 'Nothing to see: the stack is empty.', top ? 'info' : 'warn')
  }

  const isEmpty = () => {
    record('isEmpty()', `returned ${stack.current.isEmpty()}.`, 'info')
  }

  const clear = () => {
    stack.current.clear()
    setPopped(null)
    setPeeking(false)
    sync()
    record('clear()', 'The stack is empty again.', 'info')
  }

  return (
    <div className="widget widget--split">
      <div className="widget__controls">
        <div className="btn-group" role="group" aria-label="Push">
          {['A', 'B', 'C'].map((l) => (
            <button key={l} type="button" className="btn btn--primary" onClick={() => push(l)}>
              <Icon name="arrowDown" /> Push {l}
            </button>
          ))}
        </div>
        <div className="btn-group" role="group" aria-label="Other operations">
          <button type="button" className="btn" onClick={pop}>
            <Icon name="arrowUp" /> Pop
          </button>
          <button type="button" className="btn" onClick={peek}>
            <Icon name="eye" /> Peek
          </button>
          <button type="button" className="btn" onClick={isEmpty}>
            <Icon name="help" /> isEmpty()
          </button>
          <button type="button" className="btn btn--ghost" onClick={clear}>
            <Icon name="eraser" /> Clear
          </button>
        </div>
        <div className="oplog">
          <h4 className="oplog__title">Operation log</h4>
          {log.length === 0 ? (
            <p className="small muted">Push a few letters, then pop them. Which comes out first?</p>
          ) : (
            <ol className="oplog__list">
              {log.map((e, i) => (
                <li key={e.id} className={`oplog__item oplog__item--${e.tone} ${i === 0 ? 'is-latest' : ''}`}>
                  <code>{e.op}</code>
                  <span>
                    {e.tone === 'warn' && <Icon name="alert" />} {e.result}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <LetterStack items={items} capacity={CAPACITY} popped={popped} peeking={peeking} justPushed={justPushed} />
    </div>
  )
}
