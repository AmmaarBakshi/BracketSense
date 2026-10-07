import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { runStrategy } from '../core/alternatives'
import { describeChar } from '../core/bracketRules'
import { buildTrace } from '../core/traceEngine'
import { CompareColumns, scrubPositions, type ColumnSpec } from '../components/compare/CompareColumns'
import { Icon } from '../components/Icon'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { ColoredCode, RichText } from '../components/RichText'
import { LESSON_BY_ID } from '../learning/lessons'
import './Compare.css'

const PRESETS = ['([)]', '{[()]}', '(]', '((', '))', '{[(])}', 'a[i] = (b + c) * {d - e}']

export function useCompare(input: string) {
  return useMemo(() => {
    const stack = runStrategy(input, 'stack')
    const counter = runStrategy(input, 'counter')
    const queue = runStrategy(input, 'queue')
    const truth = buildTrace(input).balanced
    const columns: ColumnSpec[] = [
      { result: stack, title: 'Stack (LIFO)', badge: { label: '✓ IDEAL', tone: 'success' } },
      { result: counter, title: 'Counter', badge: { label: '⚠ INCOMPLETE', tone: 'warning' } },
      { result: queue, title: 'Queue (FIFO)', badge: { label: '✕ UNSUITABLE', tone: 'error' } },
    ]
    return { columns, truth, positions: scrubPositions(input, [stack, counter, queue]) }
  }, [input])
}

export default function ComparePage() {
  useDocumentTitle('Compare')
  const [input, setInput] = useState('([)]')
  const { columns, truth, positions } = useCompare(input)
  const [at, setAt] = useState<{ input: string; i: number }>({ input, i: -1 })
  const [playing, setPlaying] = useState(false)
  const i = at.input === input ? at.i : -1
  const setI = (n: number) => setAt({ input, i: n })
  const last = positions.length - 1
  const pos = i < 0 ? -1 : positions[i]

  useEffect(() => {
    if (!playing || i >= last) return
    const id = window.setTimeout(() => {
      setAt((a) => ({ input, i: (a.input === input ? a.i : -1) + 1 }))
      if (i + 1 >= last) setPlaying(false)
    }, 1300)
    return () => window.clearTimeout(id)
  }, [playing, i, last, input])

  const load = (s: string) => {
    setInput(s)
    setPlaying(false)
  }

  const curChar = pos >= 0 && pos < input.length ? input[pos] : null

  return (
    <>
      <PageHeader
        tint="compare"
        eyebrow={
          <>
            <Icon name="columns" /> Report §4.1
          </>
        }
        title="Why not a Queue or a Counter?"
        intro="The same input runs through three real implementations, synced to one scrubber. Watch where each one looks, and where the wrong ones go astray."
      />
      <div className="page compare">
        <section className="card compare__controls" aria-label="Input and scrubber">
          <div className="row">
            <label className="field compare__field">
              <span className="field__label">Input (editable)</span>
              <input className="input input--code" value={input} onChange={(e) => load(e.target.value)} spellCheck={false} maxLength={400} />
            </label>
          </div>
          <div className="row compare__presets" role="group" aria-label="Presets">
            {PRESETS.map((p) => (
              <button key={p} type="button" className="chip chip--code" onClick={() => load(p)} aria-pressed={input === p}>
                <ColoredCode text={p} className="chip__code" />
              </button>
            ))}
          </div>
          <div className="compare__scrub">
            <div className="btn-group">
              <button type="button" className="btn" onClick={() => setI(Math.max(-1, i - 1))} disabled={i < 0}>
                <Icon name="stepBack" /> Back
              </button>
              <button type="button" className="btn btn--primary" onClick={() => (i >= last ? (setI(-1), setPlaying(true)) : setPlaying((p) => !p))}>
                <Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Pause' : i >= last ? 'Replay' : 'Play'}
              </button>
              <button type="button" className="btn" onClick={() => setI(Math.min(last, i + 1))} disabled={i >= last}>
                <Icon name="stepForward" /> Step
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => (setI(-1), setPlaying(false))}>
                <Icon name="restart" /> Restart
              </button>
            </div>
            <input
              type="range"
              min={-1}
              max={last}
              value={i}
              onChange={(e) => (setI(Number(e.target.value)), setPlaying(false))}
              aria-label="Shared scrubber"
              aria-valuetext={pos < 0 ? 'Start' : pos >= input.length ? 'End of input' : `Character ${pos + 1}: ${describeChar(input[pos])}`}
              className="compare__range"
            />
            <span className="compare__pos" aria-live="polite">
              {pos < 0 ? 'Start' : curChar !== null ? `Character ${pos + 1} of ${input.length}: ` : 'End of input'}
              {curChar !== null && <ColoredCode text={curChar} />}
            </span>
          </div>
          <div className="compare__input" aria-hidden="true">
            {[...input].map((c, k) => (
              <span key={k} className={k === pos ? 'is-current' : k < pos ? 'is-done' : ''}>
                <ColoredCode text={c === ' ' ? ' ' : c} className="compare__ch" />
              </span>
            ))}
          </div>
        </section>

        <CompareColumns columns={columns} pos={pos} truth={truth} inputLength={input.length} />

        <section className="compare__demos" aria-labelledby="demos-title">
          <h2 id="demos-title" className="compare__h2">
            Two inputs that expose the impostors
          </h2>
          <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
            <article className="card demo">
              <h3>
                Valid input: Queue fails, Counter passes
              </h3>
              <p>
                <ColoredCode text="{[()]}" /> is perfectly nested. The Counter goes 1, 2, 3, 2, 1, 0 and gets it right. The Queue compares the first closer{' '}
                <ColoredCode text=")" /> with its FRONT, <ColoredCode text="{" />, the oldest opener, and rejects a valid string.
              </p>
              <button type="button" className="btn" onClick={() => (load('{[()]}'), setAt({ input: '{[()]}', i: -1 }), setPlaying(true))}>
                <Icon name="play" /> Run <ColoredCode text="{[()]}" />
              </button>
            </article>
            <article className="card demo">
              <h3>Invalid input: Counter passes</h3>
              <p>
                <ColoredCode text="([)]" /> has crossed pairs. The Counter sees 1, 2, 1, 0 and wrongly says balanced: it knows how many are open, but not their type
                or order. Even <ColoredCode text="(]" /> fools it. The Stack catches both at the exact character.
              </p>
              <div className="row">
                <button type="button" className="btn" onClick={() => (load('([)]'), setAt({ input: '([)]', i: -1 }), setPlaying(true))}>
                  <Icon name="play" /> Run <ColoredCode text="([)]" />
                </button>
                <button type="button" className="btn" onClick={() => (load('(]'), setAt({ input: '(]', i: -1 }), setPlaying(true))}>
                  <Icon name="play" /> Run <ColoredCode text="(]" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section aria-labelledby="verdict-title">
          <h2 id="verdict-title" className="compare__h2">
            Verdict summary for <ColoredCode text={input || '(empty)'} />
          </h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Structure</th>
                  <th scope="col">Says</th>
                  <th scope="col">Truth</th>
                  <th scope="col">Result</th>
                  <th scope="col">Why</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((c) => {
                  const right = c.result.balanced === truth
                  return (
                    <tr key={c.title}>
                      <th scope="row">{c.title}</th>
                      <td>{c.result.balanced ? 'Balanced' : 'Not balanced'}</td>
                      <td>{truth ? 'Balanced' : 'Not balanced'}</td>
                      <td>
                        <span className={`badge badge--${right ? 'success' : 'error'}`}>
                          <Icon name={right ? 'check' : 'x'} /> {right ? 'Correct' : 'Wrong'}
                        </span>
                      </td>
                      <td className="small">
                        <RichText text={c.result.reason} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="report-title">
          <h2 id="report-title" className="compare__h2">
            From the report: comparison with alternative data structures
          </h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {LESSON_BY_ID['other-approaches'].sections[0].table!.head.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LESSON_BY_ID['other-approaches'].sections[0].table!.rows.map((row) => (
                  <tr key={row[0]}>
                    <th scope="row">{row[0]}</th>
                    <td>
                      <RichText text={row[1]} />
                    </td>
                    <td>
                      <strong>{row[2]}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 'var(--sp-4)' }}>
            <Link to="/playground?tab=break" className="btn btn--primary">
              <Icon name="bug" /> Break the Algorithm yourself
            </Link>
            <Link to="/learn/other-approaches" className="btn">
              <Icon name="book" /> Lesson 7: Why other approaches fail
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
