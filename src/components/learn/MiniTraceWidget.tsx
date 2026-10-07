import { useMemo, useState } from 'react'
import { buildTrace } from '../../core/traceEngine'
import { useTracePlayer } from '../../hooks/useTracePlayer'
import { Flowchart } from '../Flowchart'
import { Icon } from '../Icon'
import { ColoredCode, RichText } from '../RichText'
import { StackView } from '../StackView'
import { OpBadge } from '../trace/OpBadge'
import { PseudocodePanel } from '../trace/PseudocodePanel'
import '../trace/trace.css'

const INPUTS = ['{[()]}', '([)]', '))', '((']

/** Lesson 5: the flowchart and pseudocode, driven by a real trace. */
export function MiniTraceWidget() {
  const [input, setInput] = useState(INPUTS[0])
  const trace = useMemo(() => buildTrace(input), [input])
  const player = useTracePlayer(trace, 1100)
  const step = player.index >= 0 ? trace.steps[player.index] : null

  return (
    <div className="widget minitrace">
      <div className="row">
        <div className="btn-group" role="group" aria-label="Input">
          {INPUTS.map((s) => (
            <button key={s} type="button" className="chip chip--code" onClick={() => setInput(s)} aria-pressed={input === s}>
              <ColoredCode text={s} className="chip__code" />
            </button>
          ))}
        </div>
        <span className="spacer" />
        <div className="btn-group">
          <button type="button" className="btn btn--sm" onClick={player.stepBack} disabled={player.atStart}>
            <Icon name="stepBack" /> Back
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={player.playing ? player.pause : player.play}>
            <Icon name={player.playing ? 'pause' : 'play'} /> {player.playing ? 'Pause' : player.atEnd ? 'Replay' : 'Play'}
          </button>
          <button type="button" className="btn btn--sm" onClick={player.stepForward} disabled={player.atEnd}>
            <Icon name="stepForward" /> Step
          </button>
        </div>
      </div>
      <Flowchart trace={trace} index={player.index} compact />
      <div className="minitrace__grid">
        <PseudocodePanel step={step} compact />
        <div className="minitrace__side">
          <StackView step={step} direction={player.direction} size="sm" />
          <div className="minitrace__explain" aria-live="polite">
            {step ? (
              <>
                <OpBadge op={step.operation} /> <RichText text={step.explanation} />
              </>
            ) : (
              <span className="muted">Press Play or Step. The flowchart node, the pseudocode line and the Stack all follow the same step.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
