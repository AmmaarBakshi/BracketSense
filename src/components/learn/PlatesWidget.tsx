import { useState } from 'react'
import { Icon } from '../Icon'
import { Glyph } from '../RichText'

const COLORS = ['round', 'square', 'curly']

/** Lesson 2: the plates analogy, then the bracket version of the same idea. */
export function PlatesWidget() {
  const [plates, setPlates] = useState<number[]>([1, 2, 3])
  const [next, setNext] = useState(4)
  const [msg, setMsg] = useState('A pile of three plates. The last one placed is on top.')
  const [answer, setAnswer] = useState<string | null>(null)

  const add = () => {
    if (plates.length >= 6) return setMsg('The shelf is full. Take a plate first.')
    setPlates((p) => [...p, next])
    setMsg(`Plate ${next} goes on top. It will be the first one taken.`)
    setNext((n) => n + 1)
  }
  const take = () => {
    if (!plates.length) return setMsg('No plates left. Taking from an empty pile is impossible (in a Stack: underflow).')
    const top = plates[plates.length - 1]
    setPlates((p) => p.slice(0, -1))
    setMsg(`You took plate ${top}, the last one added. Last In, First Out.`)
  }
  const bottom = () =>
    setMsg('You cannot slide out the bottom plate without lifting every plate above it. A Stack only lets you reach the top.')

  return (
    <div className="widget">
      <div className="widget widget--split">
        <div className="widget__controls">
          <div className="btn-group">
            <button type="button" className="btn btn--primary" onClick={add}>
              <Icon name="plus" /> Add a plate
            </button>
            <button type="button" className="btn" onClick={take}>
              <Icon name="arrowUp" /> Take the top plate
            </button>
            <button type="button" className="btn btn--ghost" onClick={bottom}>
              Take from the bottom?
            </button>
          </div>
          <p className="callout small" role="status">
            <Icon name="info" />
            <span>{msg}</span>
          </p>
        </div>
        <div className="plates" role="img" aria-label={`Pile of ${plates.length} plates, top is plate ${plates[plates.length - 1] ?? 'none'}`}>
          {[...plates].reverse().map((p, i) => (
            <div key={p} className={`plate plate--${COLORS[p % 3]} ${i === 0 ? 'is-top' : ''}`}>
              <span>plate {p}</span>
              {i === 0 && <span className="plate__top">TOP</span>}
            </div>
          ))}
          <div className="plates__shelf" />
        </div>
      </div>

      <div className="widget__q">
        <p className="widget__qtext">
          Now with brackets: you open <Glyph char="(" /> then <Glyph char="[" /> then <Glyph char="{" />. Which closing bracket must come first?
        </p>
        <div className="btn-group" role="group" aria-label="Choose the first closer">
          {[')', ']', '}'].map((c) => (
            <button
              key={c}
              type="button"
              className={`btn btn--lg qopt ${answer === c ? (c === '}' ? 'is-right' : 'is-wrong') : ''}`}
              onClick={() => setAnswer(c)}
              aria-pressed={answer === c}
            >
              <Glyph char={c} />
            </button>
          ))}
        </div>
        {answer && (
          <p className={`callout ${answer === '}' ? 'callout--success' : 'callout--warning'}`} role="status">
            <Icon name={answer === '}' ? 'checkCircle' : 'info'} />
            <span>
              {answer === '}' ? (
                <>
                  Right. <Glyph char="{" /> was opened last, so it sits on top and closes first with <Glyph char="}" />. Then <Glyph char="]" />, then{' '}
                  <Glyph char=")" />. Last opened, first closed: LIFO.
                </>
              ) : (
                <>
                  Not quite. <Glyph char={answer} /> belongs to an older bracket further down. The newest opener, <Glyph char="{" />, is on top, so{' '}
                  <Glyph char="}" /> must come first.
                </>
              )}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
