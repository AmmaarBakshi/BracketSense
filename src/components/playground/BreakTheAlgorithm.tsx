import { useMemo, useState } from 'react'
import { exposingCases, findDivergence, runStrategy, type AltResult } from '../../core/alternatives'
import { familyOf } from '../../core/bracketRules'
import { buildTrace } from '../../core/traceEngine'
import { CANDIDATE_CASES, VARIANTS, type Variant } from '../../learning/variants'
import { Icon } from '../Icon'
import { ColoredCode, Glyph, RichText } from '../RichText'

/** Toggle a faulty variant, run both versions, and see exactly where they part ways. */
export function BreakTheAlgorithm() {
  const [variant, setVariant] = useState<Variant>(VARIANTS[2])
  const [input, setInput] = useState('([)]')
  const truth = useMemo(() => buildTrace(input).balanced, [input])
  const correct = useMemo(() => runStrategy(input, 'stack'), [input])
  const broken = useMemo(() => runStrategy(input, variant.id), [input, variant])
  const div = useMemo(() => findDivergence(correct, broken), [correct, broken])
  const exposing = useMemo(() => exposingCases(variant.id, CANDIDATE_CASES), [variant])
  const brokenWrong = broken.balanced !== truth

  return (
    <div className="breaker">
      <fieldset className="breaker__variants">
        <legend className="breaker__legend">Choose a bug to inject</legend>
        {VARIANTS.map((v) => (
          <label key={v.id} className={`vcard ${variant.id === v.id ? 'is-on' : ''}`}>
            <input type="radio" name="variant" checked={variant.id === v.id} onChange={() => setVariant(v)} />
            <span>
              <strong>{v.name}</strong>
              <span className="small muted">
                <RichText text={v.change} />
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="breaker__input">
        <label className="field">
          <span className="field__label">Input</span>
          <input className="input input--code" value={input} onChange={(e) => setInput(e.target.value)} maxLength={200} spellCheck={false} />
        </label>
        <div className="row" role="group" aria-label="Test inputs">
          {CANDIDATE_CASES.map((c) => (
            <button key={c} type="button" className="chip chip--code" onClick={() => setInput(c)} aria-pressed={input === c}>
              <ColoredCode text={c} className="chip__code" />
            </button>
          ))}
        </div>
      </div>

      <div className={`callout ${brokenWrong ? 'callout--error' : 'callout--success'}`} role="status">
        <Icon name={brokenWrong ? 'bug' : 'checkCircle'} />
        <div>
          {div ? (
            <p>
              <strong>The versions diverge at </strong>
              {div.index >= input.length ? (
                <strong>the end of the input</strong>
              ) : (
                <>
                  <strong>character {div.index + 1}</strong> <Glyph char={input[div.index]} />
                </>
              )}
              .{' '}
              {brokenWrong
                ? `The broken version answers “${broken.balanced ? 'balanced' : 'not balanced'}”, which is wrong.`
                : 'They take different paths but happen to reach the same verdict on this input. Try one of the inputs that expose the bug.'}
            </p>
          ) : (
            <p>
              <strong>No difference on this input.</strong> This bug only shows up on certain inputs. Try one listed under “Test cases that expose this bug”.
            </p>
          )}
          <p className="small">
            <strong>What the design rule protects: </strong>
            <RichText text={variant.rule} />
          </p>
        </div>
      </div>

      <div className="breaker__cols">
        <TraceColumn title="Correct (Stack)" result={correct} truth={truth} divStep={div?.correctStep} tone="ok" />
        <TraceColumn title={`Broken: ${variant.name}`} result={broken} truth={truth} divStep={div?.brokenStep} tone="bad" />
      </div>

      <section className="breaker__cases" aria-labelledby="cases-title">
        <h3 id="cases-title" className="small">
          Test cases that expose this bug
        </h3>
        {exposing.length ? (
          <div className="row">
            {exposing.map((c) => (
              <button key={c} type="button" className="chip chip--code" onClick={() => setInput(c)}>
                <Icon name="bug" /> <ColoredCode text={c} className="chip__code" />
              </button>
            ))}
          </div>
        ) : (
          <p className="small muted">None of the sample inputs expose it.</p>
        )}
      </section>
    </div>
  )
}

function TraceColumn({ title, result, truth, divStep, tone }: { title: string; result: AltResult; truth: boolean; divStep?: number; tone: 'ok' | 'bad' }) {
  const right = result.balanced === truth
  return (
    <section className={`tcol tcol--${tone}`} aria-label={title}>
      <header className="tcol__head">
        <h3 className="tcol__title">
          <Icon name={tone === 'ok' ? 'checkCircle' : 'bug'} /> {title}
        </h3>
        <span className={`badge ${right ? 'badge--success' : 'badge--error'}`}>
          <Icon name={right ? 'check' : 'x'} /> Says {result.balanced ? 'balanced' : 'not balanced'} · {right ? 'correct' : 'wrong'}
        </span>
      </header>
      <ol className="tcol__steps" tabIndex={0} aria-label={`${title}: steps`}>
        {result.steps.map((s, i) => (
          <li key={i} className={`tcol__step ${!s.ok ? 'is-bad' : ''} ${i === divStep ? 'is-div' : ''}`}>
            <span className="tcol__char">{s.char === null ? <span className="badge">end</span> : <Glyph char={s.char} />}</span>
            <span className="tcol__action mono">{s.action}</span>
            <span className="tcol__struct">
              <span className="sr-only">{result.kind} contents: </span>
              {result.kind === 'counter' ? (
                <span className="mono">count {s.counter}</span>
              ) : s.structure.length ? (
                s.structure.slice(-10).map((c, k) => (
                  <span key={k} className={`tcol__blk mblk--${familyOf(c)}`}>
                    {c}
                  </span>
                ))
              ) : (
                <span className="muted small">empty</span>
              )}
            </span>
            {i === divStep && <span className="tcol__flag">diverges here</span>}
          </li>
        ))}
      </ol>
      <p className="small">
        <RichText text={result.reason} />
      </p>
    </section>
  )
}
