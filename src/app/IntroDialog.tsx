import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { familyOf } from '../core/bracketRules'
import { buildTrace } from '../core/traceEngine'
import { Stacky } from '../components/art/Art'
import { AssetImage } from '../components/AssetImage'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { ColoredCode, RichText } from '../components/RichText'
import { StackView } from '../components/StackView'
import { markIntroSeen } from '../learning/progress'
import { useProgress } from './progress'
import { useUI } from './ui'
import './IntroDialog.css'

type Choice = 'counter' | 'queue' | 'stack'

const DEMO = '([{}])'

/** First-time introduction: "Why do we need a Stack?" Shown once, replayable from Help. */
export function IntroDialog() {
  const ui = useUI()
  const navigate = useNavigate()
  const { progress, update } = useProgress()
  const open = ui.introOpen || !progress.introSeen
  const [choice, setChoice] = useState<Choice | null>(null)
  const [index, setIndex] = useState(-1)
  const trace = useMemo(() => buildTrace(DEMO), [])
  const last = trace.steps.length - 1
  const animating = choice !== null

  useEffect(() => {
    if (!open || !animating || index >= last) return
    const id = window.setTimeout(() => setIndex((i) => i + 1), index < 0 ? 600 : 1500)
    return () => window.clearTimeout(id)
  }, [open, animating, index, last])

  const close = () => {
    ui.closeIntro()
    update(markIntroSeen)
    setChoice(null)
    setIndex(-1)
  }

  const step = index >= 0 ? trace.steps[index] : null
  const correct = choice === 'stack'

  return (
    <Modal
      open={open}
      onClose={close}
      title="Why do we need a Stack?"
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={close}>
            Skip Introduction
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              close()
              navigate('/learn/what-is-a-stack')
            }}
          >
            <Icon name="book" /> Start Learning
          </button>
        </>
      }
    >
      <div className="intro">
        <div className="intro__q">
          <div className="intro__brackets" role="img" aria-label="{ [ ( ) ] }">
            <ColoredCode text="{ [ ( ) ] }" />
          </div>
          <p className="intro__ask">How can a computer know which opening bracket should be matched first?</p>
          <div className="intro__options" role="group" aria-label="Choose one">
            {(['counter', 'queue', 'stack'] as Choice[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`intro__opt ${choice === c ? (c === 'stack' ? 'is-right' : 'is-wrong') : ''}`}
                onClick={() => {
                  setChoice(c)
                  setIndex(-1)
                }}
                aria-pressed={choice === c}
                disabled={choice !== null && choice !== c && correct}
              >
                <Icon name={c === 'counter' ? 'hash' : c === 'queue' ? 'queue' : 'layers'} />
                {c === 'counter' ? 'Counter' : c === 'queue' ? 'Queue' : 'Stack'}
              </button>
            ))}
          </div>
          {choice && (
            <p className={`callout ${correct ? 'callout--success' : 'callout--warning'}`} role="status">
              <Icon name={correct ? 'checkCircle' : 'info'} />
              <span>
                {correct
                  ? 'Correct! The most recently opened bracket must be closed first. This is exactly the LIFO behavior of a Stack.'
                  : choice === 'counter'
                    ? 'Not quite. Let’s see why. A counter knows how many brackets are open, but not which ones.'
                    : 'Not quite. Let’s see why. A queue hands back the OLDEST bracket first, but nesting closes the NEWEST first.'}
              </span>
            </p>
          )}
        </div>

        <div className="intro__demo">
          {animating ? (
            <>
              <div className="intro__input" aria-hidden="true">
                {[...DEMO].map((c, i) => (
                  <span key={i} className={`ctext--${familyOf(c)} ${step?.charIndex === i ? 'is-current' : ''}`}>
                    {c}
                  </span>
                ))}
              </div>
              <StackView step={step} direction={index <= 0 ? 'jump' : 'forward'} size="sm" showIncoming={false} />
              <p className="intro__explain" aria-live="polite">
                {step ? (
                  <RichText text={step.explanation} />
                ) : (
                  'Watch: the openers ( [ { are pushed, then the closers } ] ) pop them in reverse order.'
                )}
              </p>
              {index >= last && (
                <button type="button" className="btn btn--sm" onClick={() => setIndex(-1)}>
                  <Icon name="rotate" /> Replay
                </button>
              )}
            </>
          ) : (
            <div className="intro__mascot">
              <AssetImage slot="mascot" alt="" fallback={<Stacky mood="think" />} />
              <p className="small muted">Pick an answer to see the Stack in action.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
