import { useEffect, useRef } from 'react'
import { Icon } from '../Icon'
import { ColoredCode } from '../RichText'
import type { Prediction } from './ResultCard'

/** Learn → Predict → Visualize: commit to an answer before the Stack runs. */
export function PredictionPrompt({ input, onPredict, onSkip }: { input: string; onPredict: (p: Prediction) => void; onSkip: () => void }) {
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus(), [])
  const preview = input.length > 80 ? input.slice(0, 80) + '…' : input
  return (
    <section className="predict" aria-labelledby="predict-title">
      <div className="predict__icon">
        <Icon name="target" />
      </div>
      <div className="predict__body">
        <h2 id="predict-title" className="predict__title">
          Predict the result
        </h2>
        <p className="muted">
          Before the Stack runs, decide: is <ColoredCode text={preview || '(empty)'} /> balanced?
        </p>
        <div className="row">
          <button ref={first} type="button" className="btn btn--success btn--lg" onClick={() => onPredict('balanced')}>
            <Icon name="checkCircle" /> Balanced
          </button>
          <button type="button" className="btn btn--danger btn--lg" onClick={() => onPredict('not-balanced')}>
            <Icon name="xCircle" /> Not balanced
          </button>
          <button type="button" className="btn btn--ghost" onClick={onSkip}>
            Skip prediction
          </button>
        </div>
      </div>
    </section>
  )
}
