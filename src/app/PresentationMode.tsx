import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { familyOf } from '../core/bracketRules'
import { plain } from '../core/messages'
import { buildTrace } from '../core/traceEngine'
import type { Trace } from '../core/types'
import { project } from '../config/project'
import { LogoMark } from '../components/art/Art'
import { AssetImage } from '../components/AssetImage'
import { CompareColumns } from '../components/compare/CompareColumns'
import { useCompare } from '../components/compare/useCompare'
import { Flowchart } from '../components/Flowchart'
import { Icon } from '../components/Icon'
import { ColoredCode, RichText } from '../components/RichText'
import { StackView } from '../components/StackView'
import { OpBadge } from '../components/trace/OpBadge'
import { useTracePlayer } from '../hooks/useTracePlayer'
import { EXAMPLES } from '../learning/examples'
import { useAnnounce } from './announcer'
import { isInteractiveTarget } from './keyboard'
import { SPEED_LABEL, SPEED_MS, useSettings, type Speed } from './settings'
import { useUI } from './ui'
import '../components/compare/compare.css'
import './PresentationMode.css'

/* ---------------- shared big trace stage ---------------- */

function Spotlight({ input, index }: { input: string; index: number }) {
  // Long inputs: show a window around the current character.
  const start = input.length > 60 ? Math.max(0, Math.min(index - 28, input.length - 60)) : 0
  const end = input.length > 60 ? start + 60 : input.length
  return (
    <div className="pm-spot" aria-hidden="true">
      {start > 0 && <span className="pm-spot__more">…</span>}
      {[...input.slice(start, end)].map((c, k) => {
        const i = start + k
        return (
          <span key={i} className={['pm-spot__ch', familyOf(c) ? `ctext--${familyOf(c)}` : 'pm-spot__plain', i === index ? 'is-current' : '', i < index ? 'is-done' : ''].join(' ')}>
            {c === ' ' ? ' ' : c === '\n' ? '↵' : c}
          </span>
        )
      })}
      {end < input.length && <span className="pm-spot__more">…</span>}
    </div>
  )
}

function TraceStage({ trace, index, direction, title }: { trace: Trace; index: number; direction: 'forward' | 'backward' | 'jump'; title?: string }) {
  const step = index >= 0 ? trace.steps[index] : null
  const atEnd = index === trace.steps.length - 1
  return (
    <div className="pm-stage">
      {title && <h2 className="pm-stage__title">{title}</h2>}
      <Spotlight input={trace.input} index={step && step.kind !== 'end' ? step.charIndex : -1} />
      <div className="pm-stage__grid">
        <div className="pm-stage__left">
          <div className={`pm-explain ${step?.error ? 'is-bad' : step?.operation === 'ACCEPT' ? 'is-ok' : ''}`} aria-live="polite">
            {step ? (
              <>
                <OpBadge op={step.operation} />
                <p>
                  <RichText text={step.explanation} />
                </p>
              </>
            ) : (
              <p className="muted">Ready. The Stack starts empty.</p>
            )}
          </div>
          {atEnd && (
            <p className={`pm-result ${trace.balanced ? 'is-ok' : 'is-bad'}`}>
              <Icon name={trace.balanced ? 'checkCircle' : 'xCircle'} /> {trace.balanced ? 'Balanced' : 'Not balanced'}
              {trace.error && (
                <span className="pm-result__msg">
                  <RichText text={trace.error.message} />
                </span>
              )}
            </p>
          )}
          <Flowchart trace={trace} index={index} compact />
        </div>
        <div className="pm-stage__right">
          <StackView step={step} direction={direction} size="lg" maxVisible={9} />
        </div>
      </div>
    </div>
  )
}

/* ---------------- auto-demo script ---------------- */

type Scene =
  | { kind: 'title'; title: string; ms: number }
  | { kind: 'trace'; title: string; input: string; stepMs: number; holdMs: number }
  | { kind: 'compare'; title: string; input: string; stepMs: number; holdMs: number }
  | { kind: 'outro'; title: string; ms: number }

const SCRIPT: Scene[] = [
  { kind: 'title', title: 'BracketSense', ms: 7000 },
  { kind: 'trace', title: '1 · A balanced input: every push is undone by its partner', input: '{[()]}', stepMs: 2000, holdMs: 4000 },
  { kind: 'trace', title: '2 · Crossed brackets: the top does not match', input: '([)]', stepMs: 2300, holdMs: 5000 },
  { kind: 'trace', title: '3 · Unclosed brackets: something is left on the Stack', input: '((', stepMs: 2000, holdMs: 4000 },
  { kind: 'compare', title: '4 · Why not a Counter or a Queue?', input: '([)]', stepMs: 3000, holdMs: 6000 },
  { kind: 'trace', title: '5 · Real code: only the brackets matter', input: 'a[i] = (b + c) * {d - e}', stepMs: 450, holdMs: 3000 },
  { kind: 'outro', title: 'Watch the Stack think', ms: 7000 },
]

const LEAD_MS = 500

function sceneLength(s: Scene): number {
  if (s.kind === 'title' || s.kind === 'outro') return s.ms
  if (s.kind === 'compare') return LEAD_MS + 5 * s.stepMs + s.holdMs
  return LEAD_MS + buildTrace(s.input).steps.length * s.stepMs + s.holdMs
}

function AutoDemo({ onExit }: { onExit: () => void }) {
  const lengths = useMemo(() => SCRIPT.map(sceneLength), [])
  const starts = useMemo(() => lengths.reduce<number[]>((acc, _l, i) => [...acc, i === 0 ? 0 : acc[i - 1] + lengths[i - 1]], []), [lengths])
  const total = lengths.reduce((a, b) => a + b, 0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const announce = useAnnounce()

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setT((x) => Math.min(total, x + 100)), 100)
    return () => window.clearInterval(id)
  }, [playing, total])

  const sceneIndex = Math.max(0, starts.findLastIndex((s) => s <= t))
  const scene = SCRIPT[sceneIndex]
  const local = t - starts[sceneIndex]
  const finished = t >= total

  useEffect(() => {
    announce(`Auto-Demo: ${SCRIPT[sceneIndex].title}`)
  }, [sceneIndex, announce])

  const jump = (i: number) => setT(starts[Math.max(0, Math.min(SCRIPT.length - 1, i))])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isInteractiveTarget(e.target)) {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowRight') jump(sceneIndex + 1)
      else if (e.key === 'ArrowLeft') jump(sceneIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="pm-demo">
      <div className="pm-demo__body">
        {scene.kind === 'title' && <TitleScene />}
        {scene.kind === 'outro' && <OutroScene />}
        {scene.kind === 'trace' && <ScriptedTrace scene={scene} local={local} />}
        {scene.kind === 'compare' && <ScriptedCompare scene={scene} local={local} />}
      </div>
      <div className="pm-demo__bar">
        <button type="button" className="btn btn--lg" onClick={() => jump(sceneIndex - 1)} disabled={sceneIndex === 0}>
          <Icon name="stepBack" /> Previous
        </button>
        <button type="button" className="btn btn--primary btn--lg" onClick={() => (finished ? (setT(0), setPlaying(true)) : setPlaying((p) => !p))}>
          <Icon name={finished ? 'rotate' : playing ? 'pause' : 'play'} /> {finished ? 'Replay demo' : playing ? 'Pause' : 'Resume'}
        </button>
        <button type="button" className="btn btn--lg" onClick={() => jump(sceneIndex + 1)} disabled={sceneIndex === SCRIPT.length - 1}>
          Next <Icon name="stepForward" />
        </button>
        <div className="pm-demo__progress">
          <div className="pm-demo__track" role="progressbar" aria-label="Auto-Demo progress" aria-valuemin={0} aria-valuemax={Math.round(total / 1000)} aria-valuenow={Math.round(t / 1000)}>
            {SCRIPT.map((_s, i) => (
              <span key={i} className={`pm-demo__seg ${i < sceneIndex ? 'is-done' : i === sceneIndex ? 'is-now' : ''}`} style={{ flexGrow: lengths[i] }}>
                {i === sceneIndex && <span className="pm-demo__fill" style={{ width: `${Math.min(100, (local / lengths[i]) * 100)}%` }} />}
              </span>
            ))}
          </div>
          <span className="small">
            {Math.floor(t / 1000)}s / {Math.round(total / 1000)}s · {scene.title}
          </span>
        </div>
        <button type="button" className="btn btn--ghost btn--lg" onClick={onExit}>
          <Icon name="x" /> Stop demo
        </button>
      </div>
    </div>
  )
}

function ScriptedTrace({ scene, local }: { scene: Extract<Scene, { kind: 'trace' }>; local: number }) {
  const trace = useMemo(() => buildTrace(scene.input), [scene.input])
  const index = Math.min(trace.steps.length - 1, Math.floor((local - LEAD_MS) / scene.stepMs))
  return <TraceStage key={scene.input} trace={trace} index={index} direction={index <= 0 ? 'jump' : 'forward'} title={scene.title} />
}

function ScriptedCompare({ scene, local }: { scene: Extract<Scene, { kind: 'compare' }>; local: number }) {
  const { columns, truth, positions } = useCompare(scene.input)
  const i = Math.min(positions.length - 1, Math.floor((local - LEAD_MS) / scene.stepMs))
  return (
    <div className="pm-stage">
      <h2 className="pm-stage__title">{scene.title}</h2>
      <Spotlight input={scene.input} index={i >= 0 ? positions[i] : -1} />
      <CompareColumns columns={columns} pos={i < 0 ? -1 : positions[i]} truth={truth} inputLength={scene.input.length} />
    </div>
  )
}

function TitleScene() {
  return (
    <div className="pm-title">
      <div className="pm-title__text">
        <LogoMark size={88} />
        <h2 className="pm-title__name">BracketSense</h2>
        <p className="pm-title__promise">Watch the Stack think.</p>
        <p className="pm-title__report">{project.reportTitle}</p>
        <p className="muted">{project.students.join(' · ')}</p>
        <p className="muted small">{[project.department, project.college, project.location].filter(Boolean).join(', ')}</p>
      </div>
      <figure className="pm-figure">
        <AssetImage slot="report-stack-evolution" alt="Figure 1 from the report: stack evolution while scanning {[()]}" fallback={<LogoMark size={120} />} />
        <figcaption className="small muted">From our report: Figure 1, stack evolution while scanning {'{[()]}'}</figcaption>
      </figure>
    </div>
  )
}

function OutroScene() {
  return (
    <div className="pm-title">
      <div className="pm-title__text">
        <h2 className="pm-title__name">One pass. One Stack.</h2>
        <ul className="pm-outro">
          <li>
            <strong>Time O(n)</strong>: every character examined once; push and pop are O(1).
          </li>
          <li>
            <strong>Space O(k)</strong>: only unmatched openers wait; O(n) worst case, O(1) with no brackets.
          </li>
          <li>
            <strong>LIFO</strong> matches nesting: the last bracket opened is the first one closed.
          </li>
        </ul>
        <p className="pm-title__promise">Thank you!</p>
      </div>
      <figure className="pm-figure pm-figure--tall">
        <AssetImage slot="report-flowchart" alt="Figure 2 from the report: decision flow of the checker" fallback={<LogoMark size={120} />} />
        <figcaption className="small muted">From our report: Figure 2, the decision flow</figcaption>
      </figure>
    </div>
  )
}

/* ---------------- manual mode ---------------- */

const SPEEDS: Speed[] = ['slow', 'normal', 'fast']

function ManualMode({ initialInput }: { initialInput: string }) {
  const { speed, setSpeed } = useSettings()
  const [input, setInput] = useState(initialInput)
  const trace = useMemo(() => buildTrace(input), [input])
  const player = useTracePlayer(trace, SPEED_MS[speed === 'instant' ? 'fast' : speed])
  const announce = useAnnounce()
  const step = player.index >= 0 ? trace.steps[player.index] : null

  useEffect(() => {
    if (step) announce(plain(step.summary))
  }, [step, announce])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isInteractiveTarget(e.target)) {
        e.preventDefault()
        player.toggle()
      } else if (e.key === 'ArrowRight' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        player.stepForward()
      } else if (e.key === 'ArrowLeft' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        player.stepBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player])

  return (
    <div className="pm-manual">
      <div className="pm-manual__examples" role="group" aria-label="Examples">
        {EXAMPLES.filter((e) => e.input.length <= 40).map((ex) => (
          <button key={ex.id} type="button" className="chip chip--code" aria-pressed={input === ex.input} onClick={() => setInput(ex.input)}>
            <ColoredCode text={ex.label} className="chip__code" />
          </button>
        ))}
      </div>
      <TraceStage trace={trace} index={player.index} direction={player.direction} />
      <div className="pm-controls" role="toolbar" aria-label="Presentation controls">
        <button type="button" className="btn btn--lg" onClick={player.stepBack} disabled={player.atStart}>
          <Icon name="stepBack" /> Back
        </button>
        <button type="button" className="btn btn--primary btn--lg pm-controls__play" onClick={player.toggle}>
          <Icon name={player.playing ? 'pause' : player.atEnd ? 'rotate' : 'play'} /> {player.playing ? 'Pause' : player.atEnd ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="btn btn--lg" onClick={player.stepForward} disabled={player.atEnd}>
          Step <Icon name="stepForward" />
        </button>
        <button type="button" className="btn btn--ghost btn--lg" onClick={player.reset}>
          <Icon name="eraser" /> Reset
        </button>
        <span className="pm-controls__count">{player.atStart ? `${trace.steps.length} steps` : `Step ${player.index + 1} / ${trace.steps.length}`}</span>
        <div className="seg" role="group" aria-label="Auto-play speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className="seg__btn" aria-pressed={speed === s || (s === 'fast' && speed === 'instant')} onClick={() => setSpeed(s)}>
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- overlay ---------------- */

export function PresentationMode() {
  const ui = useUI()
  const { open, input, autoDemo } = ui.presentation
  const box = useRef<HTMLDivElement>(null)
  const [demo, setDemo] = useState(false)
  const [lastOpen, setLastOpen] = useState(false)

  // Reset the demo flag each time the overlay opens.
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setDemo(!!autoDemo)
  }

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    ui.closePresentation()
  }, [ui])

  useEffect(() => {
    if (!open) return
    const el = box.current
    el?.focus()
    el?.requestFullscreen?.().catch(() => {
      /* fullscreen may be refused; the overlay still covers the page */
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onFs = () => {
      if (!document.fullscreenElement) ui.closePresentation()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFs)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
      document.body.style.overflow = prevOverflow
    }
    // only on open/close
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div ref={box} className="pm" role="dialog" aria-modal="true" aria-label="Presentation Mode" tabIndex={-1}>
      <header className="pm__head">
        <span className="pm__brand">
          <LogoMark size={32} /> <strong>BracketSense</strong> <span className="muted">· {project.reportTitle}</span>
        </span>
        <span className="spacer" />
        {demo ? (
          <span className="badge badge--brand">
            <Icon name="monitor" /> Auto-Demo
          </span>
        ) : (
          <button type="button" className="btn btn--soft" onClick={() => setDemo(true)}>
            <Icon name="play" /> Auto-Demo (90 s)
          </button>
        )}
        <button type="button" className="btn" onClick={close} aria-keyshortcuts="Escape">
          <Icon name="minimize" /> Exit <kbd>Esc</kbd>
        </button>
      </header>
      <main className="pm__main">{demo ? <AutoDemo onExit={() => setDemo(false)} /> : <ManualMode initialInput={input || '{[()]}'} />}</main>
    </div>
  )
}
