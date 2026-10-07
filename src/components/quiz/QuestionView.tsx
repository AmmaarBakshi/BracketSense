import { useMemo, useState } from 'react'
import { familyOf } from '../../core/bracketRules'
import { buildTrace } from '../../core/traceEngine'
import { CONCEPT_BY_ID } from '../../learning/concepts'
import { gradeChoice, gradeFirstFail, gradeFix, gradeOrder, type Question } from '../../learning/quiz'
import { Icon } from '../Icon'
import { ColoredCode, RichText } from '../RichText'
import { StackView } from '../StackView'
import { MiniStack } from './MiniStack'

export interface AnswerRecord {
  correct: boolean
  given: string
}

interface Props {
  question: Question
  number: number
  total: number
  onAnswered: (record: AnswerRecord) => void
  onNext: () => void
  isLast: boolean
}

function shuffled<T>(list: readonly T[], seed: number): T[] {
  const a = [...list]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.every((x, i) => x === list[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]]
  return a
}

/** One quiz question: answer UI, then feedback with an explanation and a Stack picture. */
export function QuestionView({ question: q, number, total, onAnswered, onNext, isLast }: Props) {
  const [choice, setChoice] = useState<string | null>(null)
  const [failPick, setFailPick] = useState<number | null>(null)
  const [order, setOrder] = useState<string[]>(() => (q.kind === 'order' ? shuffled(q.items, q.id.length * 7 + number) : []))
  const [fix, setFix] = useState(q.kind === 'fix' ? q.input : '')
  const [result, setResult] = useState<{ correct: boolean; note?: string } | null>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)

  const trace = useMemo(() => (q.input ? buildTrace(q.input) : null), [q.input])
  const picture = trace && q.pictureStep !== undefined ? trace.steps[Math.max(0, Math.min(q.pictureStep, trace.steps.length - 1))] : null

  const canCheck =
    !result &&
    ((q.kind === 'choice' && choice !== null) || (q.kind === 'first-fail' && failPick !== null) || q.kind === 'order' || (q.kind === 'fix' && fix.length > 0))

  const check = () => {
    let correct = false
    let note: string | undefined
    let given = ''
    if (q.kind === 'choice') {
      correct = gradeChoice(q, choice!)
      given = q.options.find((o) => o.id === choice)?.label ?? ''
    } else if (q.kind === 'first-fail') {
      correct = gradeFirstFail(q, failPick!)
      given = failPick === q.input.length ? 'end of input' : `character ${failPick! + 1}`
    } else if (q.kind === 'order') {
      correct = gradeOrder(q, order)
      given = order.join(', ')
    } else {
      const g = gradeFix(q, fix)
      correct = g.ok
      note = g.reason
      given = fix
    }
    setResult({ correct, note })
    onAnswered({ correct, given })
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return
    setOrder((o) => {
      const next = [...o]
      const [x] = next.splice(from, 1)
      next.splice(to, 0, x)
      return next
    })
  }

  const correctLabel =
    q.kind === 'choice'
      ? q.options.find((o) => o.id === q.answer)?.label
      : q.kind === 'first-fail'
        ? q.answer === q.input.length
          ? 'end of input'
          : `character ${q.answer + 1}, ${'`' + q.input[q.answer] + '`'}`
        : q.kind === 'order'
          ? q.items.join(' → ')
          : undefined

  return (
    <article className="qcard" aria-labelledby={`q-${q.id}`}>
      <header className="qcard__head">
        <span className="qcard__count">
          Question {number} of {total}
        </span>
        <span className="badge badge--brand">
          <Icon name="target" /> {CONCEPT_BY_ID[q.concept].label}
        </span>
      </header>
      <div className="pbar" aria-hidden="true">
        <div className="pbar__fill" style={{ width: `${((number - 1) / total) * 100}%` }} />
      </div>
      <h2 id={`q-${q.id}`} className="qcard__prompt">
        <RichText text={q.prompt} />
      </h2>

      {q.input && q.kind !== 'first-fail' && q.kind !== 'fix' && (
        <div className="qcard__input">
          <ColoredCode text={q.input} />
        </div>
      )}

      {/* ---------- answer UIs ---------- */}
      {q.kind === 'choice' && (
        <div className={`qopts ${q.stackOptions ? 'qopts--stacks' : ''}`} role="radiogroup" aria-labelledby={`q-${q.id}`}>
          {q.options.map((o) => {
            const state = result ? (o.id === q.answer ? 'is-right' : o.id === choice ? 'is-wrong' : '') : ''
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={choice === o.id}
                className={`qopt-btn ${choice === o.id ? 'is-chosen' : ''} ${state}`}
                onClick={() => !result && setChoice(o.id)}
                disabled={!!result && o.id !== choice && o.id !== q.answer}
              >
                {q.stackOptions && <MiniStack chars={o.stack ?? ''} />}
                <span>
                  <RichText text={o.label} />
                </span>
                {state === 'is-right' && <Icon name="checkCircle" label="correct answer" />}
                {state === 'is-wrong' && <Icon name="xCircle" label="your answer, incorrect" />}
              </button>
            )
          })}
        </div>
      )}

      {q.kind === 'first-fail' && (
        <div className="qfail" role="group" aria-label="Characters">
          {[...q.input].map((c, i) => {
            const state = result ? (i === q.answer ? 'is-right' : i === failPick ? 'is-wrong' : '') : ''
            return (
              <button
                key={i}
                type="button"
                className={`qfail__ch ctext--${familyOf(c)} ${failPick === i ? 'is-chosen' : ''} ${state}`}
                onClick={() => !result && setFailPick(i)}
                aria-pressed={failPick === i}
                aria-label={`Character ${i + 1}: ${c}`}
              >
                {c}
              </button>
            )
          })}
          <button
            type="button"
            className={`qfail__end ${failPick === q.input.length ? 'is-chosen' : ''} ${result ? (q.answer === q.input.length ? 'is-right' : failPick === q.input.length ? 'is-wrong' : '') : ''}`}
            onClick={() => !result && setFailPick(q.input.length)}
            aria-pressed={failPick === q.input.length}
          >
            end of input
          </button>
        </div>
      )}

      {q.kind === 'order' && (
        <ol className="qorder" aria-label="Operations, drag or use the arrows to reorder">
          {order.map((item, i) => (
            <li
              key={item + i}
              className={`qorder__item ${dragFrom === i ? 'is-dragging' : ''} ${result ? (item === q.items[i] ? 'is-right' : 'is-wrong') : ''}`}
              draggable={!result}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null) move(dragFrom, i)
                setDragFrom(null)
              }}
              onDragEnd={() => setDragFrom(null)}
            >
              <Icon name="grip" className="qorder__grip" />
              <span className="qorder__n">{i + 1}.</span>
              <code className="qorder__op">
                <ColoredCode text={item} className="chip__code" />
              </code>
              <span className="spacer" />
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => move(i, i - 1)} disabled={!!result || i === 0} aria-label={`Move ${item} up`}>
                <Icon name="arrowUp" />
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => move(i, i + 1)}
                disabled={!!result || i === order.length - 1}
                aria-label={`Move ${item} down`}
              >
                <Icon name="arrowDown" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {q.kind === 'fix' && (
        <div className="qfix">
          <label className="field">
            <span className="field__label">Your fixed version</span>
            <input className="input input--code qfix__input" value={fix} onChange={(e) => !result && setFix(e.target.value)} spellCheck={false} readOnly={!!result} />
          </label>
          <span className="small muted">
            Original: <ColoredCode text={q.input} /> · live check: {buildTrace(fix).balanced ? '✓ balanced' : '✕ not balanced yet'}
          </span>
        </div>
      )}

      {/* ---------- feedback ---------- */}
      {result ? (
        <div className={`qfeedback ${result.correct ? 'qfeedback--ok' : 'qfeedback--bad'}`} role="status">
          <div className="qfeedback__text">
            <p className="qfeedback__verdict">
              <Icon name={result.correct ? 'checkCircle' : 'xCircle'} />
              {result.correct ? 'Correct!' : 'Incorrect'}
            </p>
            {!result.correct && correctLabel && (
              <p>
                <strong>Answer: </strong>
                <RichText text={correctLabel} />
              </p>
            )}
            {result.note && !result.correct && <p className="small">{<RichText text={result.note} />}</p>}
            <p>
              <RichText text={q.explain} />
            </p>
            <button type="button" className="btn btn--primary" onClick={onNext} autoFocus>
              {isLast ? 'See results' : 'Next question'} <Icon name="arrowRight" />
            </button>
          </div>
          {picture && (
            <figure className="qfeedback__pic">
              <StackView step={picture} direction="jump" size="sm" showIncoming={false} maxVisible={8} />
              <figcaption className="small muted">The Stack at step {picture.step}</figcaption>
            </figure>
          )}
        </div>
      ) : (
        <div className="row">
          <button type="button" className="btn btn--primary btn--lg" onClick={check} disabled={!canCheck}>
            Check answer
          </button>
        </div>
      )}
    </article>
  )
}
