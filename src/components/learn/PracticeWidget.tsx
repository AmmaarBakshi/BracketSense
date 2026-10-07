import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useProgress } from '../../app/progress'
import { familyOf } from '../../core/bracketRules'
import { buildTrace } from '../../core/traceEngine'
import { recordErrorFound } from '../../learning/progress'
import { Icon } from '../Icon'
import { RichText } from '../RichText'

const ITEMS = ['()[]{}', '([)]', '{[]}(', ')(', '{[()()]}', 'f(a[i)]']

type Phase = 'predict' | 'locate' | 'done'

interface Outcome {
  predictOk: boolean
  locateOk: boolean | null
}

/** Lesson 8: predict, then click the exact failing character; checked by the real engine. */
export function PracticeWidget() {
  const { update } = useProgress()
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<Phase>('predict')
  const [prediction, setPrediction] = useState<boolean | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const input = ITEMS[i]
  const trace = useMemo(() => buildTrace(input), [input])
  const err = trace.error
  const failAt = err ? (err.type === 'UNCLOSED_OPENING' ? input.length : err.charIndex) : null

  const predict = (balanced: boolean) => {
    setPrediction(balanced)
    if (trace.balanced) {
      setOutcomes((o) => [...o, { predictOk: balanced, locateOk: null }])
      setPhase('done')
    } else setPhase('locate')
  }

  const locate = (pos: number) => {
    setPicked(pos)
    const ok = pos === failAt
    if (ok) update(recordErrorFound)
    setOutcomes((o) => [...o, { predictOk: prediction === false, locateOk: ok }])
    setPhase('done')
  }

  const next = () => {
    setI((n) => n + 1)
    setPhase('predict')
    setPrediction(null)
    setPicked(null)
  }

  const restart = () => {
    setI(0)
    setPhase('predict')
    setPrediction(null)
    setPicked(null)
    setOutcomes([])
  }

  const out = phase === 'done' ? outcomes[outcomes.length - 1] : null
  const fullyRight = outcomes.filter((o) => o.predictOk && o.locateOk !== false).length

  return (
    <div className="widget practice">
      <div className="practice__progress">
        <span className="small muted">
          Item {Math.min(i + 1, ITEMS.length)} of {ITEMS.length}
        </span>
        <div className="pbar" role="progressbar" aria-label="Practice progress" aria-valuemin={0} aria-valuemax={ITEMS.length} aria-valuenow={outcomes.length}>
          <div className="pbar__fill" style={{ width: `${(outcomes.length / ITEMS.length) * 100}%` }} />
        </div>
      </div>

      <div className="practice__input" aria-label={`Input: ${input}`}>
        {[...input].map((c, k) => {
          const isFail = phase === 'done' && failAt === k
          const isPicked = picked === k
          return phase === 'locate' ? (
            <button key={k} type="button" className={`practice__ch ctext--${familyOf(c)}`} onClick={() => locate(k)} aria-label={`Character ${k + 1}: ${c}`}>
              {c}
            </button>
          ) : (
            <span key={k} className={`practice__ch ctext--${familyOf(c)} ${isFail ? 'is-fail' : ''} ${isPicked && !isFail ? 'is-picked' : ''}`}>
              {c}
            </span>
          )
        })}
        {(phase === 'locate' || (phase === 'done' && failAt === input.length)) &&
          (phase === 'locate' ? (
            <button type="button" className="practice__end" onClick={() => locate(input.length)}>
              end of input
            </button>
          ) : (
            <span className="practice__end is-fail">end of input</span>
          ))}
      </div>

      {phase === 'predict' && (
        <div className="row">
          <span className="widget__qtext">Is it balanced?</span>
          <button type="button" className="btn btn--success" onClick={() => predict(true)}>
            <Icon name="checkCircle" /> Balanced
          </button>
          <button type="button" className="btn btn--danger" onClick={() => predict(false)}>
            <Icon name="xCircle" /> Not balanced
          </button>
        </div>
      )}

      {phase === 'locate' && (
        <p className="callout small">
          <Icon name="target" />
          <span>
            {prediction === false ? 'Right, it is not balanced.' : 'Actually, it is not balanced.'} Now click the exact character where the algorithm first knows
            it is broken (or “end of input” if something is left on the Stack).
          </span>
        </p>
      )}

      {phase === 'done' && out && (
        <div className={`callout ${out.predictOk && out.locateOk !== false ? 'callout--success' : 'callout--warning'}`} role="status">
          <Icon name={out.predictOk && out.locateOk !== false ? 'checkCircle' : 'info'} />
          <div>
            <p>
              <strong>
                {trace.balanced ? 'Balanced.' : 'Not balanced.'} {out.predictOk ? 'Your prediction was right' : 'Your prediction was wrong'}
                {out.locateOk === null ? '.' : out.locateOk ? ', and you found the exact spot.' : ', but the failing spot is highlighted above.'}
              </strong>
            </p>
            <p>
              <RichText text={err ? err.message : 'Every opener was closed by the right partner, in reverse order, and the Stack ended empty.'} />
            </p>
            <div className="row" style={{ marginTop: 8 }}>
              {i < ITEMS.length - 1 ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={next}>
                  Next item <Icon name="arrowRight" />
                </button>
              ) : (
                <button type="button" className="btn btn--sm" onClick={restart}>
                  <Icon name="restart" /> Practice again
                </button>
              )}
              <Link className="btn btn--sm" to={`/visualizer?input=${encodeURIComponent(input)}`}>
                <Icon name="layers" /> See it in the Visualizer
              </Link>
            </div>
          </div>
        </div>
      )}

      {outcomes.length === ITEMS.length && (
        <p className="practice__summary">
          <Icon name="trophy" /> You got <strong>{fullyRight}</strong> of {ITEMS.length} fully right.
        </p>
      )}
    </div>
  )
}
