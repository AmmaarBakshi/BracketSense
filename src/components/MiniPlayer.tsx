import { useMemo } from 'react'
import { familyOf } from '../core/bracketRules'
import { buildTrace } from '../core/traceEngine'
import { useTracePlayer } from '../hooks/useTracePlayer'
import { Icon } from './Icon'
import { RichText } from './RichText'
import { StackView } from './StackView'
import { OpBadge } from './trace/OpBadge'
import './MiniPlayer.css'

/** Compact trace player: input with current character, Stack, explanation and controls. */
export function MiniPlayer({ input, autoPlay, speed = 900 }: { input: string; autoPlay?: boolean; speed?: number }) {
  const trace = useMemo(() => buildTrace(input), [input])
  const player = useTracePlayer(trace, speed, autoPlay ? 0 : -1)
  const step = player.index >= 0 ? trace.steps[player.index] : null
  const long = input.length > 160

  return (
    <div className="miniplayer">
      <div className={`miniplayer__input ${long ? 'is-long' : ''}`} aria-label={`Input: ${input}`}>
        {[...input].map((c, i) =>
          c === '\n' ? (
            <br key={i} />
          ) : (
            <span key={i} className={[familyOf(c) ? `ctext--${familyOf(c)} br-strong` : '', step && step.charIndex === i ? 'is-current' : '', step && step.charIndex > i ? 'is-done' : ''].join(' ')}>
              {c}
            </span>
          ),
        )}
      </div>
      <div className="miniplayer__body">
        <StackView step={step} direction={player.direction} size="sm" showIncoming={false} maxVisible={10} />
        <div className="miniplayer__explain">
          <div className="row">
            <button type="button" className="btn btn--sm" onClick={player.stepBack} disabled={player.atStart}>
              <Icon name="stepBack" /> Back
            </button>
            <button type="button" className="btn btn--sm btn--primary" onClick={player.playing ? player.pause : player.play}>
              <Icon name={player.playing ? 'pause' : 'play'} /> {player.playing ? 'Pause' : player.atEnd ? 'Replay' : 'Play'}
            </button>
            <button type="button" className="btn btn--sm" onClick={player.stepForward} disabled={player.atEnd}>
              <Icon name="stepForward" /> Step
            </button>
            <span className="small muted">
              {player.atStart ? `${trace.steps.length} steps` : `Step ${player.index + 1} / ${trace.steps.length}`}
            </span>
          </div>
          <p aria-live="polite">
            {step ? (
              <>
                <OpBadge op={step.operation} /> <RichText text={step.explanation} />
              </>
            ) : (
              <span className="muted">Press Play to watch the Stack.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
