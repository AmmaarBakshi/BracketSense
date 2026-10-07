import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useProgress } from '../../app/progress'
import { familyOf } from '../../core/bracketRules'
import { buildTrace } from '../../core/traceEngine'
import type { Trace } from '../../core/types'
import { checkBugFix, levelOf, scoreFor, starsFor, type BugChallenge, type BuildChallenge, type Challenge, type TraceChallenge } from '../../learning/challenges'
import { CONCEPT_BY_ID, type ConceptId } from '../../learning/concepts'
import { LESSON_BY_ID } from '../../learning/lessons'
import { recordChallenge, recordErrorFound } from '../../learning/progress'
import { Stacky } from '../art/Art'
import { AssetImage } from '../AssetImage'
import { CodeEditor } from '../editor/CodeEditor'
import { Icon } from '../Icon'
import { MiniPlayer } from '../MiniPlayer'
import { ColoredCode, Glyph, RichText } from '../RichText'

interface Mistake {
  concept: ConceptId
  text: ReactNode
}

function LearnFromMistake({ mistake }: { mistake: Mistake }) {
  const c = CONCEPT_BY_ID[mistake.concept]
  const lesson = LESSON_BY_ID[c.lesson]
  return (
    <aside className="mistake" aria-live="polite">
      <div className="mistake__art">
        <AssetImage slot="mascot" alt="" fallback={<Stacky mood="oops" />} />
      </div>
      <div>
        <h4 className="mistake__title">
          <Icon name="bulb" /> Learn from this mistake: {c.label}
        </h4>
        <div className="mistake__text">{mistake.text}</div>
        <Link className="btn btn--sm btn--soft" to={`/learn/${lesson.id}`}>
          Review Lesson {lesson.number}: {lesson.title} <Icon name="arrowRight" />
        </Link>
      </div>
    </aside>
  )
}

function verdictMistake(trace: Trace, predictedBalanced: boolean): Mistake {
  if (!predictedBalanced) {
    return {
      concept: 'lifo',
      text: <p>Every closing bracket here matches the bracket on top of the Stack, newest first, and nothing is left at the end. That is exactly LIFO, so it is balanced.</p>,
    }
  }
  const e = trace.error!
  if (e.type === 'WRONG_TYPE')
    return {
      concept: 'errors',
      text: (
        <p>
          Crossed brackets. At character {e.charIndex + 1} the top of the Stack is <Glyph char={e.top!.char} />, but <Glyph char={e.found!} /> arrives. A closer must
          match the most recently opened bracket.
        </p>
      ),
    }
  if (e.type === 'UNMATCHED_CLOSING')
    return {
      concept: 'errors',
      text: (
        <p>
          At character {e.charIndex + 1}, <Glyph char={e.found!} /> arrives while the Stack is empty. Nothing is open, so it has no partner.
        </p>
      ),
    }
  return {
    concept: 'errors',
    text: (
      <p>
        Count what is left at the end: {e.remainingCount} opening bracket(s) ({e.remaining.map((r) => r.char).join(' ')}) were never closed. A balanced input must
        end with an empty Stack.
      </p>
    ),
  }
}

function useRecorder(c: Challenge, hintsUsed: number) {
  const { update } = useProgress()
  const [attempts, setAttempts] = useState(0)
  const fail = () => {
    setAttempts((a) => a + 1)
    update((p) => recordChallenge(p, c.id, { attempts: (p.challenges[c.id]?.attempts ?? 0) + 1 }))
  }
  const succeed = () => {
    const total = attempts + 1
    update((p) =>
      recordChallenge(p, c.id, {
        completed: true,
        attempts: total,
        hintsUsed,
        stars: starsFor(total, hintsUsed),
        points: scoreFor(levelOf(c.level).points, total, hintsUsed),
      }),
    )
    return { total, stars: starsFor(total, hintsUsed), points: scoreFor(levelOf(c.level).points, total, hintsUsed) }
  }
  const skip = () => update((p) => recordChallenge(p, c.id, { skipped: true }))
  return { attempts, fail, succeed, skip }
}

interface PlayerProps {
  challenge: Challenge
  onDone: () => void
  nextTitle?: string
  onNext?: () => void
}

/** Plays one challenge. Points drop with attempts (−25%) and hints (−20%). */
export function ChallengePlayer({ challenge: c, onDone, nextTitle, onNext }: PlayerProps) {
  const [hintsUsed, setHintsUsed] = useState(0)
  const rec = useRecorder(c, hintsUsed)
  const [result, setResult] = useState<{ stars: number; points: number } | null>(null)
  const level = levelOf(c.level)

  const complete = () => setResult(rec.succeed())

  return (
    <article className="cplayer" aria-labelledby="cplayer-title">
      <header className="cplayer__head">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDone}>
          <Icon name="arrowLeft" /> All challenges
        </button>
        <div className="cplayer__meta">
          <span className={`badge cbadge--${level.color}`}>{level.label}</span>
          <span className="badge">{c.kind === 'trace' ? 'Predict & trace' : c.kind === 'build' ? 'Build a string' : 'Find the bug'}</span>
          <span className="badge badge--brand">
            <Icon name="star" /> {scoreFor(level.points, rec.attempts + 1, hintsUsed)} / {level.points} pts
          </span>
          <span className="badge">Attempts: {rec.attempts}</span>
        </div>
      </header>
      <h2 id="cplayer-title" className="cplayer__title">
        {c.title}
      </h2>
      <p className="muted">
        <RichText text={c.intro} />
      </p>

      {result ? (
        <div className="cdone">
          <div className="cdone__art">
            <AssetImage slot="mascot" alt="" fallback={<Stacky mood="cheer" />} />
          </div>
          <div>
            <h3 className="cdone__title">Challenge complete!</h3>
            <p className="cdone__stars">
              <span className="sr-only">{result.stars} of 3 stars. </span>
              {[1, 2, 3].map((n) => (
                <Icon key={n} name={n <= result.stars ? 'starFilled' : 'star'} className={n <= result.stars ? 'star-on' : 'star-off'} />
              ))}
              <span>
                {result.stars} star{result.stars === 1 ? '' : 's'} · {result.points} points
              </span>
            </p>
            <p className="small muted">
              {rec.attempts + 1} attempt{rec.attempts ? 's' : ''}, {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} used.
            </p>
            <div className="row">
              {onNext && (
                <button type="button" className="btn btn--primary" onClick={onNext}>
                  Next: {nextTitle} <Icon name="arrowRight" />
                </button>
              )}
              <button type="button" className="btn" onClick={onDone}>
                All challenges
              </button>
            </div>
          </div>
        </div>
      ) : c.kind === 'trace' ? (
        <TracePlay challenge={c} onFail={rec.fail} onComplete={complete} />
      ) : c.kind === 'build' ? (
        <BuildPlay challenge={c} onFail={rec.fail} onComplete={complete} />
      ) : (
        <BugPlay challenge={c} onFail={rec.fail} onComplete={complete} />
      )}

      {!result && (
        <footer className="cplayer__foot">
          <div className="chints">
            {c.hints.slice(0, hintsUsed).map((h, i) => (
              <p key={i} className="callout small">
                <Icon name="bulb" />
                <span>
                  <strong>Hint {i + 1}:</strong> <RichText text={h} />
                </span>
              </p>
            ))}
          </div>
          <div className="row">
            {hintsUsed < c.hints.length && (
              <button type="button" className="btn btn--sm" onClick={() => setHintsUsed((h) => h + 1)}>
                <Icon name="bulb" /> Show hint {hintsUsed + 1} (−20% points)
              </button>
            )}
            {rec.attempts >= 3 && (
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => {
                  rec.skip()
                  onDone()
                }}
              >
                <Icon name="skip" /> Skip this challenge
              </button>
            )}
            {rec.attempts > 0 && rec.attempts < 3 && <span className="small muted">Skip unlocks after 3 attempts.</span>}
          </div>
        </footer>
      )}
    </article>
  )
}

/* ---------------- predict & trace ---------------- */

function TracePlay({ challenge: c, onFail, onComplete }: { challenge: TraceChallenge; onFail: () => void; onComplete: () => void }) {
  const { update } = useProgress()
  const trace = useMemo(() => buildTrace(c.input), [c.input])
  const [stage, setStage] = useState<'predict' | 'locate' | 'depth' | 'watch'>('predict')
  const [mistake, setMistake] = useState<Mistake | null>(null)
  const [solvedPrediction, setSolvedPrediction] = useState(false)
  const e = trace.error
  const failAt = e ? (e.type === 'UNCLOSED_OPENING' ? c.input.length : e.charIndex) : -1
  const maxSize = trace.counters.maxSize
  const depthOptions = [...new Set([Math.max(1, maxSize - 1), maxSize, maxSize + 1, maxSize + 2])].sort((a, b) => a - b)

  const predict = (balanced: boolean) => {
    if (balanced === trace.balanced) {
      setMistake(null)
      setSolvedPrediction(true)
      setStage(trace.balanced ? 'depth' : 'locate')
    } else {
      setMistake(verdictMistake(trace, balanced))
      onFail()
    }
  }

  const locate = (i: number) => {
    if (i === failAt) {
      update(recordErrorFound)
      setMistake(null)
      setStage('watch')
      return
    }
    onFail()
    if (i < failAt) {
      const s = trace.steps[i]
      setMistake({
        concept: 'algorithm',
        text: (
          <p>
            At character {i + 1} (<Glyph char={c.input[i]} />) nothing is wrong yet: <RichText text={s.decision} />. Keep tracing: the first problem comes later.
          </p>
        ),
      })
    } else {
      setMistake({
        concept: 'errors',
        text: (
          <p>
            The algorithm already stops before that, at {failAt >= c.input.length ? 'the end of the input' : `character ${failAt + 1}`}: <RichText text={e!.message} />
          </p>
        ),
      })
    }
  }

  const depth = (n: number) => {
    if (n === maxSize) {
      setMistake(null)
      setStage('watch')
      return
    }
    onFail()
    const peak = trace.steps.find((s) => s.counters.size === maxSize)!
    setMistake({
      concept: 'complexity',
      text: (
        <p>
          The maximum stack size is the most openers waiting at the same moment. It peaks at character {peak.charIndex + 1} with{' '}
          <ColoredCode text={peak.stackAfter.map((x) => x.char).join('')} /> on the Stack.
        </p>
      ),
    })
  }

  return (
    <div className="cplay">
      <div className="cplay__input">
        {c.input.length > 40 ? (
          <pre className="cplay__code">
            {[...c.input].map((ch, i) => (
              <span key={i} className={familyOf(ch) ? `ctext--${familyOf(ch)} br-strong` : ''}>
                {ch}
              </span>
            ))}
          </pre>
        ) : (
          <ColoredCode text={c.input} className="cplay__short" />
        )}
      </div>

      {stage === 'predict' && (
        <section className="cstage">
          <h3 className="cstage__title">
            <span className="cstage__n">1</span> Predict: is it balanced?
          </h3>
          <div className="row">
            <button type="button" className="btn btn--success btn--lg" onClick={() => predict(true)}>
              <Icon name="checkCircle" /> Balanced
            </button>
            <button type="button" className="btn btn--danger btn--lg" onClick={() => predict(false)}>
              <Icon name="xCircle" /> Not balanced
            </button>
          </div>
        </section>
      )}

      {solvedPrediction && stage !== 'predict' && (
        <p className="callout callout--success small">
          <Icon name="checkCircle" /> Prediction correct: {trace.balanced ? 'balanced' : 'not balanced'}.
        </p>
      )}

      {stage === 'locate' && (
        <section className="cstage">
          <h3 className="cstage__title">
            <span className="cstage__n">2</span> Click the first character where the algorithm knows it is broken
          </h3>
          <div className="qfail cplay__locate" role="group" aria-label="Characters">
            {[...c.input].map((ch, i) =>
              ch === '\n' ? (
                <span key={i} className="cplay__nl" aria-hidden="true" />
              ) : ch === ' ' ? (
                <span key={i} className="cplay__space" aria-hidden="true" />
              ) : (
                <button key={i} type="button" className={`qfail__ch cplay__ch ctext--${familyOf(ch)}`} onClick={() => locate(i)} aria-label={`Character ${i + 1}: ${ch}`}>
                  {ch}
                </button>
              ),
            )}
            <button type="button" className="qfail__end" onClick={() => locate(c.input.length)}>
              end of input
            </button>
          </div>
        </section>
      )}

      {stage === 'depth' && (
        <section className="cstage">
          <h3 className="cstage__title">
            <span className="cstage__n">2</span> What is the maximum stack size while checking it?
          </h3>
          <div className="row">
            {depthOptions.map((n) => (
              <button key={n} type="button" className="btn btn--lg" onClick={() => depth(n)}>
                {n}
              </button>
            ))}
          </div>
        </section>
      )}

      {mistake && <LearnFromMistake mistake={mistake} />}

      {stage === 'watch' && (
        <section className="cstage">
          <h3 className="cstage__title">
            <span className="cstage__n">3</span> Watch the trace, then finish
          </h3>
          <MiniPlayer input={c.input} />
          <p className="callout small">
            <Icon name={trace.balanced ? 'checkCircle' : 'alert'} />
            <span>
              <strong>Final explanation: </strong>
              <RichText text={trace.balanced ? `Balanced. Maximum stack size ${maxSize}: every opener was closed by its partner in reverse order.` : e!.message} />
            </span>
          </p>
          <button type="button" className="btn btn--primary btn--lg" onClick={onComplete}>
            <Icon name="trophy" /> Finish challenge
          </button>
        </section>
      )}
    </div>
  )
}

/* ---------------- build a balanced string ---------------- */

function BuildPlay({ challenge: c, onFail, onComplete }: { challenge: BuildChallenge; onFail: () => void; onComplete: () => void }) {
  const [value, setValue] = useState('')
  const [mistake, setMistake] = useState<Mistake | null>(null)
  const checks = c.constraints.map((k) => ({ ...k, ok: k.test(value) }))
  const all = checks.every((k) => k.ok)

  const submit = () => {
    if (all) return onComplete()
    onFail()
    const first = checks.find((k) => !k.ok)!
    const t = buildTrace(value)
    const concept: ConceptId = first.id === 'balanced' ? 'algorithm' : first.id === 'depth' ? 'complexity' : 'why-stack'
    setMistake({
      concept,
      text:
        first.id === 'balanced' ? (
          <p>{t.error ? <RichText text={t.error.message} /> : 'Type something first.'}</p>
        ) : first.id === 'depth' ? (
          <p>
            Your maximum stack size is {t.counters.maxSize}. Nest exactly three openers before closing any of them, and never go deeper than three.
          </p>
        ) : first.id === 'types' ? (
          <p>Use all three families: ( ), [ ] and {'{ }'}.</p>
        ) : (
          <p>Add more pairs side by side; siblings like () [] do not increase the depth.</p>
        ),
    })
  }

  return (
    <div className="cplay">
      <label className="field">
        <span className="field__label">Your string</span>
        <input className="input input--code cplay__build" value={value} onChange={(e) => setValue(e.target.value)} placeholder={c.placeholder} spellCheck={false} maxLength={80} />
      </label>
      <ul className="cchecks">
        {checks.map((k) => (
          <li key={k.id} className={k.ok ? 'is-ok' : ''}>
            <Icon name={k.ok ? 'checkCircle' : 'xCircle'} label={k.ok ? 'met' : 'not met'} /> {k.label}
          </li>
        ))}
      </ul>
      {value && <MiniPlayer key={value} input={value} />}
      {mistake && <LearnFromMistake mistake={mistake} />}
      <button type="button" className="btn btn--primary btn--lg" onClick={submit} disabled={!value}>
        Submit
      </button>
    </div>
  )
}

/* ---------------- find the bug ---------------- */

function BugPlay({ challenge: c, onFail, onComplete }: { challenge: BugChallenge; onFail: () => void; onComplete: () => void }) {
  const [code, setCode] = useState(c.code)
  const [mistake, setMistake] = useState<Mistake | null>(null)
  const live = useMemo(() => buildTrace(code), [code])

  const submit = () => {
    const r = checkBugFix(c.code, code)
    if (r.ok) return onComplete()
    onFail()
    setMistake({ concept: 'errors', text: <p><RichText text={r.reason} /></p> })
  }

  return (
    <div className="cplay">
      <CodeEditor value={code} onChange={setCode} label={`${c.language} code to fix`} minLines={4} maxLines={12} />
      <p className={`small ${live.balanced ? 'ctext-ok' : 'ctext-bad'}`} aria-live="polite">
        <Icon name={live.balanced ? 'checkCircle' : 'alert'} /> Live check: {live.balanced ? 'balanced' : <RichText text={live.error!.message} />}
      </p>
      {mistake && <LearnFromMistake mistake={mistake} />}
      <div className="row">
        <button type="button" className="btn btn--primary btn--lg" onClick={submit}>
          Submit fix
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setCode(c.code)}>
          <Icon name="restart" /> Reset code
        </button>
      </div>
    </div>
  )
}
