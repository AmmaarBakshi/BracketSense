import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CompareColumns } from '../compare/CompareColumns'
import { useCompare } from '../compare/useCompare'
import { Icon } from '../Icon'
import { ColoredCode } from '../RichText'

const INPUTS = ['([)]', '{[()]}', '(]']

/** Lesson 7: the same input through Stack, Counter and Queue. */
export function ApproachesWidget() {
  const [input, setInput] = useState(INPUTS[0])
  const { columns, truth, positions } = useCompare(input)
  const [at, setAt] = useState({ input, i: -1 })
  const [playing, setPlaying] = useState(false)
  const i = at.input === input ? at.i : -1
  const last = positions.length - 1

  useEffect(() => {
    if (!playing || i >= last) return
    const id = window.setTimeout(() => {
      setAt({ input, i: i + 1 })
      if (i + 1 >= last) setPlaying(false)
    }, 1200)
    return () => window.clearTimeout(id)
  }, [playing, i, last, input])

  return (
    <div className="widget">
      <div className="row">
        <div className="btn-group" role="group" aria-label="Input">
          {INPUTS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip chip--code"
              onClick={() => {
                setInput(s)
                setPlaying(false)
              }}
              aria-pressed={input === s}
            >
              <ColoredCode text={s} className="chip__code" />
            </button>
          ))}
        </div>
        <span className="spacer" />
        <div className="btn-group">
          <button type="button" className="btn btn--sm" onClick={() => setAt({ input, i: Math.max(-1, i - 1) })} disabled={i < 0}>
            <Icon name="stepBack" /> Back
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => (i >= last ? (setAt({ input, i: -1 }), setPlaying(true)) : setPlaying((p) => !p))}>
            <Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Pause' : i >= last ? 'Replay' : 'Play'}
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setAt({ input, i: Math.min(last, i + 1) })} disabled={i >= last}>
            <Icon name="stepForward" /> Step
          </button>
        </div>
      </div>
      <CompareColumns columns={columns} pos={i < 0 ? -1 : positions[i]} truth={truth} inputLength={input.length} />
      <div className="row">
        <Link className="btn" to="/compare">
          <Icon name="columns" /> Open the full Compare page
        </Link>
        <Link className="btn" to="/playground?tab=break">
          <Icon name="bug" /> Break the Algorithm
        </Link>
      </div>
    </div>
  )
}
