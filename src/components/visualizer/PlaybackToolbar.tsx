import { SPEED_LABEL, type Speed } from '../../app/settings'
import type { TracePlayer } from '../../hooks/useTracePlayer'
import { Icon } from '../Icon'

interface PlaybackToolbarProps {
  player: TracePlayer
  speed: Speed
  onSpeed: (s: Speed) => void
  /** Run / resume (the page may ask for a prediction first). */
  onRun: () => void
  onStepForward: () => void
  predictMode?: boolean
  onPredictMode?: (on: boolean) => void
  onPresent?: () => void
  large?: boolean
}

const SPEEDS: Speed[] = ['slow', 'normal', 'fast', 'instant']

export function PlaybackToolbar({ player, speed, onSpeed, onRun, onStepForward, predictMode, onPredictMode, onPresent, large }: PlaybackToolbarProps) {
  const runLabel = player.playing ? 'Pause' : player.atStart ? 'Run Trace' : player.atEnd ? 'Run Again' : 'Resume'
  const total = player.lastIndex + 1
  return (
    <div className={`ptoolbar ${large ? 'ptoolbar--lg' : ''}`} role="toolbar" aria-label="Playback controls">
      <div className="ptoolbar__group ptoolbar__group--main">
        <button
          type="button"
          className={`btn btn--primary ${large ? 'btn--lg' : ''} ptoolbar__run`}
          onClick={player.playing ? player.pause : onRun}
          aria-keyshortcuts="Space"
          data-tour="run"
        >
          <Icon name={player.playing ? 'pause' : player.atEnd ? 'rotate' : 'play'} />
          {runLabel}
        </button>
        <button type="button" className={`btn ${large ? 'btn--lg' : ''}`} onClick={player.stepBack} disabled={player.atStart} aria-keyshortcuts="ArrowLeft">
          <Icon name="stepBack" />
          <span className="ptoolbar__label">Back</span>
        </button>
        <button type="button" className={`btn ${large ? 'btn--lg' : ''}`} onClick={onStepForward} disabled={player.atEnd} aria-keyshortcuts="ArrowRight">
          <Icon name="stepForward" />
          <span className="ptoolbar__label">Step</span>
        </button>
        <button type="button" className={`btn btn--ghost ${large ? 'btn--lg' : ''}`} onClick={player.restart}>
          <Icon name="restart" />
          <span className="ptoolbar__label">Restart</span>
        </button>
        <button type="button" className={`btn btn--ghost ${large ? 'btn--lg' : ''}`} onClick={player.reset} aria-keyshortcuts="R">
          <Icon name="eraser" />
          <span className="ptoolbar__label">Reset</span>
        </button>
      </div>

      <div className="ptoolbar__group">
        <span className="ptoolbar__count" aria-live="off">
          {player.atStart ? `Ready · ${total} steps` : `Step ${player.index + 1} / ${total}`}
        </span>
        <div className="seg" role="group" aria-label="Speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className="seg__btn" aria-pressed={speed === s} onClick={() => onSpeed(s)}>
              {s === 'instant' && <Icon name="zap" />}
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
        {onPredictMode && (
          <label className="ptoolbar__switch">
            <input type="checkbox" checked={!!predictMode} onChange={(e) => onPredictMode(e.target.checked)} />
            <Icon name="target" />
            Predict first
          </label>
        )}
        {onPresent && (
          <button type="button" className="btn btn--soft" onClick={onPresent} aria-keyshortcuts="P">
            <Icon name="monitor" />
            <span>Present</span>
          </button>
        )}
      </div>
    </div>
  )
}
