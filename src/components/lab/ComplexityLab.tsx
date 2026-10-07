import { useEffect, useMemo, useRef, useState } from 'react'
import { familyOf } from '../../core/bracketRules'
import { countOperations, fitLine, makeInput, SHAPE_LABEL, stackHeights, TIME_SIZES, type InputShape, type OpCount } from '../../core/complexity'
import { Icon } from '../Icon'
import { ColoredCode } from '../RichText'
import { LineChart } from './LineChart'
import './ComplexityLab.css'

const SPACE_PRESETS = ['((((((((((', '()()()()()', '((((()))))', '{[({[]})]}']

/** Time: real runs on generated inputs. Space: stack height while scanning. */
export function ComplexityLab({ compact }: { compact?: boolean }) {
  return (
    <div className={`lab ${compact ? 'lab--compact' : ''}`}>
      <TimeLab />
      <SpaceLab compact={compact} />
    </div>
  )
}

function TimeLab() {
  const [shape, setShape] = useState<InputShape>('random')
  const [results, setResults] = useState<OpCount[]>([])
  const [running, setRunning] = useState(false)
  const runId = useRef(0)

  const run = () => {
    const id = ++runId.current
    setResults([])
    setRunning(true)
    let i = 0
    const next = () => {
      if (runId.current !== id) return
      if (i >= TIME_SIZES.length) return setRunning(false)
      const n = TIME_SIZES[i++]
      const r = countOperations(makeInput(shape, n, 7))
      setResults((prev) => [...prev, r])
      window.setTimeout(next, 220)
    }
    next()
  }

  // stop a running measurement when leaving the page
  useEffect(() => () => void runId.current++, [])

  const points = results.map((r) => ({ x: r.n, y: r.total }))
  const fit = results.length >= 2 ? fitLine(points) : null

  return (
    <section className="lab__part" aria-labelledby="lab-time">
      <h3 id="lab-time" className="lab__h">
        <Icon name="clock" /> Time: operations grow linearly with n
      </h3>
      <p className="muted small">
        The real algorithm runs on generated inputs of size {TIME_SIZES.join(', ')}. Every character is examined once, so the operation count is a straight
        line through the origin.
      </p>
      <div className="row">
        <label className="field lab__field">
          <span className="field__label">Input shape</span>
          <select className="select" value={shape} onChange={(e) => setShape(e.target.value as InputShape)} disabled={running}>
            {(Object.keys(SHAPE_LABEL) as InputShape[]).map((s) => (
              <option key={s} value={s}>
                {SHAPE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn--primary lab__run" onClick={run} disabled={running}>
          <Icon name={running ? 'clock' : 'play'} />
          {running ? 'Measuring…' : results.length ? 'Measure again' : 'Run measurement'}
        </button>
      </div>

      <LineChart
        points={points}
        dots
        label={
          results.length
            ? `Line chart: basic operations against input size n. ${results.map((r) => `n ${r.n}: ${r.total} operations`).join('; ')}.`
            : 'Empty chart: run the measurement to plot operations against n.'
        }
        xLabel="input size n (characters)"
        yLabel="basic operations"
        xMax={10000}
        yMax={results.length ? undefined : 25000}
        formatY={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
        formatX={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
        tooltip={(p, i) => {
          const r = results[i]
          return (
            <>
              <strong>n = {p.x.toLocaleString()}</strong>
              <br />
              {r.total.toLocaleString()} operations
              <br />
              {r.scanned.toLocaleString()} reads · {r.pushes.toLocaleString()} push · {r.pops.toLocaleString()} pop · {r.comparisons.toLocaleString()} compare
              <br />
              {(r.total / r.n).toFixed(2)} ops per character
            </>
          )
        }}
      />

      {fit && (
        <p className="callout small" role="status">
          <Icon name="chart" />
          <span>
            Best-fit line: operations ≈ <strong>{fit.slope.toFixed(2)} × n</strong> (R² = {fit.r2.toFixed(4)}). A constant amount of work per character
            means time is <strong>O(n)</strong>. Doubling the input doubles the work.
          </span>
        </p>
      )}

      {results.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Measured operation counts</caption>
            <thead>
              <tr>
                <th scope="col">n</th>
                <th scope="col">Characters read</th>
                <th scope="col">Pushes</th>
                <th scope="col">Pops</th>
                <th scope="col">Comparisons</th>
                <th scope="col">Total ops</th>
                <th scope="col">Ops / n</th>
                <th scope="col">Max stack</th>
                <th scope="col">Time</th>
              </tr>
            </thead>
            <tbody className="lab__nums">
              {results.map((r) => (
                <tr key={r.n}>
                  <td>{r.n.toLocaleString()}</td>
                  <td>{r.scanned.toLocaleString()}</td>
                  <td>{r.pushes.toLocaleString()}</td>
                  <td>{r.pops.toLocaleString()}</td>
                  <td>{r.comparisons.toLocaleString()}</td>
                  <td>
                    <strong>{r.total.toLocaleString()}</strong>
                  </td>
                  <td>{(r.total / r.n).toFixed(2)}</td>
                  <td>{r.maxSize.toLocaleString()}</td>
                  <td>{r.ms < 0.1 ? '<0.1 ms' : `${r.ms.toFixed(2)} ms`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SpaceLab({ compact }: { compact?: boolean }) {
  const [input, setInput] = useState(SPACE_PRESETS[0])
  const data = useMemo(() => stackHeights(input), [input])
  const [shown, setShown] = useState(data.heights.length)
  const [playing, setPlaying] = useState(false)

  // "watch it grow": reveal one character at a time
  useEffect(() => {
    const len = data.heights.length
    if (!playing || shown >= len) return
    const id = window.setTimeout(() => {
      setShown((s) => s + 1)
      if (shown + 1 >= len) setPlaying(false)
    }, 260)
    return () => window.clearTimeout(id)
  }, [playing, shown, data.heights.length])

  const visible = data.heights.slice(0, shown).map((h, i) => ({ x: i + 1, y: h }))
  const flat = useMemo(() => stackHeights('()()()()()'), [])
  const nested = useMemo(() => stackHeights('((((()))))'), [])

  const choose = (v: string) => {
    setInput(v)
    setShown(0)
    setPlaying(true)
  }

  return (
    <section className="lab__part" aria-labelledby="lab-space">
      <h3 id="lab-space" className="lab__h">
        <Icon name="layers" /> Space: only unmatched openers take room
      </h3>
      <p className="muted small">
        Type brackets and watch the Stack height. Space is O(k), where k is the most unmatched opening brackets stored at once: O(n) in the worst case
        (all openers), O(1) when there are no brackets.
      </p>
      <div className="row">
        <label className="field lab__field lab__field--grow">
          <span className="field__label">Input</span>
          <input
            className="input input--code"
            value={input}
            maxLength={2000}
            onChange={(e) => {
              setInput(e.target.value)
              setPlaying(false)
              setShown(e.target.value.length)
            }}
            spellCheck={false}
          />
        </label>
        <button type="button" className="btn lab__run" onClick={() => (setShown(0), setPlaying(true))} disabled={!input}>
          <Icon name="play" /> Watch it grow
        </button>
      </div>
      <div className="row lab__presets" role="group" aria-label="Presets">
        {SPACE_PRESETS.map((p) => (
          <button key={p} type="button" className="chip chip--code" onClick={() => choose(p)} aria-pressed={input === p}>
            <ColoredCode text={p} className="chip__code" />
          </button>
        ))}
      </div>
      <LineChart
        points={visible}
        step
        integer
        height={compact ? 200 : 220}
        label={`Step chart of stack height for ${input}. Maximum ${data.max}.`}
        xLabel="characters read"
        yLabel="stack height"
        xMax={Math.max(1, data.heights.length)}
        yMax={Math.max(2, data.max)}
        formatY={(v) => String(Math.round(v))}
        formatX={(v) => String(Math.round(v))}
        tooltip={(p) => {
          const c = input[p.x - 1]
          return (
            <>
              <strong>
                char {p.x}: <span className={familyOf(c) ? `ctext--${familyOf(c)}` : ''}>{c === ' ' ? 'space' : c}</span>
              </strong>
              <br />
              stack height {p.y}
            </>
          )
        }}
      />
      <p className="small" role="status">
        Max stack size <strong>k = {data.max}</strong> for {input.length} character{input.length === 1 ? '' : 's'}
        {data.stoppedAt !== undefined ? ` (the scan stopped early at character ${data.stoppedAt + 1}: an error)` : ''}.
      </p>

      <div className="lab__multiples">
        {[
          { s: '()()()()()', d: flat, note: 'Each pair closes immediately: k = 1' },
          { s: '((((()))))', d: nested, note: 'Five openers wait at once: k = 5' },
        ].map(({ s, d, note }) => (
          <figure key={s} className="lab__mini">
            <figcaption>
              <ColoredCode text={s} /> <span className="small muted">{note}</span>
            </figcaption>
            <LineChart
              points={d.heights.map((h, i) => ({ x: i + 1, y: h }))}
              step
              integer
              height={150}
              label={`Stack height for ${s}: maximum ${d.max}.`}
              xLabel="characters read"
              yLabel="height"
              xMax={10}
              yMax={5}
              formatY={(v) => String(Math.round(v))}
              formatX={(v) => String(Math.round(v))}
              tooltip={(p) => (
                <>
                  <strong>char {p.x}</strong>
                  <br />
                  stack height {p.y}
                </>
              )}
            />
          </figure>
        ))}
      </div>
    </section>
  )
}
