import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAnnounce } from '../app/announcer'
import { isInteractiveTarget, isTypingTarget, usesArrowKeys } from '../app/keyboard'
import { useProgress } from '../app/progress'
import { SPEED_MS, useSettings } from '../app/settings'
import { useUI } from '../app/ui'
import { closerFor } from '../core/bracketRules'
import { similarTo } from '../core/generators'
import { plain } from '../core/messages'
import { createPositionLookup } from '../core/position'
import { buildTrace } from '../core/traceEngine'
import { CodeEditor, type EditorMark } from '../components/editor/CodeEditor'
import { Flowchart } from '../components/Flowchart'
import { Icon, type IconName } from '../components/Icon'
import { NestingFold } from '../components/NestingFold'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { ColoredCode } from '../components/RichText'
import { StackView } from '../components/StackView'
import { Tour, type TourStep } from '../components/Tour'
import { ExplainPanel } from '../components/trace/ExplainPanel'
import { PseudocodePanel } from '../components/trace/PseudocodePanel'
import { StatsHud } from '../components/trace/StatsHud'
import { Timeline } from '../components/trace/Timeline'
import { TracePanel } from '../components/trace/TracePanel'
import { MatchStatus } from '../components/visualizer/MatchStatus'
import { PlaybackToolbar } from '../components/visualizer/PlaybackToolbar'
import { PredictionPrompt } from '../components/visualizer/PredictionPrompt'
import { ResultCard, type Prediction } from '../components/visualizer/ResultCard'
import { useBracketMatcher } from '../hooks/useBracketMatcher'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useTracePlayer } from '../hooks/useTracePlayer'
import { DEFAULT_INPUT, EXAMPLE_GROUPS, EXAMPLES } from '../learning/examples'
import { LAST_INPUT_KEY, recordPrediction, recordRun } from '../learning/progress'
import { readString, writeString } from '../learning/storage'
import '../components/trace/trace.css'
import './Visualizer.css'

type Tab = 'editor' | 'stack' | 'flow' | 'explain' | 'stats'

const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: 'editor', label: 'Editor', icon: 'code' },
  { id: 'stack', label: 'Stack', icon: 'layers' },
  { id: 'flow', label: 'Flow', icon: 'flow' },
  { id: 'explain', label: 'Explain', icon: 'message' },
  { id: 'stats', label: 'Stats', icon: 'bars' },
]

const TOUR: TourStep[] = [
  { target: '[data-tour="editor"]', title: 'The input', body: 'Type brackets or paste real code. Only ( ) [ ] { } are processed; everything else is ignored but counted.' },
  { target: '[data-tour="run"]', title: 'Run, step, rewind', body: 'Run plays every step. Step and Back move one character at a time, like a debugger. Space, → and ← work too.' },
  { target: '[data-tour="stack"]', title: 'The Stack', body: 'Built from the real Stack snapshot at this step. The TOP pointer shows the bracket that must be closed next.' },
  { target: '[data-tour="explain"]', title: 'Why did this happen?', body: 'Every step explains what the algorithm saw, what it had to do, and why the Stack changed.' },
  { target: '[data-tour="flow"]', title: 'Flowchart', body: 'The active decision glows; the path taken leaves a faded trail.' },
  { target: '[data-tour="timeline"]', title: 'Timeline', body: 'Jump to any step. Going back restores every panel exactly.' },
]

function initialInput(params: URLSearchParams): string {
  return params.get('input') ?? readString(LAST_INPUT_KEY) ?? DEFAULT_INPUT
}

function Panel({ title, icon, tour, area, children, actions, id }: { title: string; icon: IconName; tour?: string; area: string; children: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <section className={`vpanel vpanel--${area}`} data-tour={tour} aria-labelledby={`vp-${area}`} id={id}>
      <header className="vpanel__head">
        <h2 id={`vp-${area}`} className="vpanel__title">
          <Icon name={icon} />
          {title}
        </h2>
        {actions}
      </header>
      {children}
    </section>
  )
}

export default function VisualizerPage() {
  useDocumentTitle('Visualizer')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { speed, setSpeed, predictMode, setPredictMode } = useSettings()
  const ui = useUI()
  const announce = useAnnounce()
  const { update } = useProgress()
  const isMobile = useMediaQuery('(max-width: 719px)')

  const [input, setInputRaw] = useState(() => initialInput(params))
  const deferred = useDeferredValue(input)
  const trace = useMemo(() => buildTrace(deferred), [deferred])
  const positionOf = useMemo(() => createPositionLookup(deferred), [deferred])
  const player = useTracePlayer(trace, SPEED_MS[speed])
  const step = player.index >= 0 ? trace.steps[player.index] : null
  const matcher = useBracketMatcher(deferred)

  const [tab, setTab] = useState<Tab>('editor')
  const [asking, setAsking] = useState(false)
  const [prediction, setPrediction] = useState<{ input: string; value: Prediction } | null>(null)
  const [skippedFor, setSkippedFor] = useState<string | null>(null)
  const [nestingOpen, setNestingOpen] = useState(false)
  // ?tour=<key> opens the guided tour; closing it remembers that key.
  const tourKey = params.get('tour')
  const [closedTour, setClosedTour] = useState<string | null>(null)
  const tourOpen = !!tourKey && tourKey !== closedTour
  const traceRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const activePrediction = prediction?.input === trace.input ? prediction.value : null
  const needsPrediction = predictMode && !activePrediction && skippedFor !== trace.input && player.atStart
  const atVerdict = player.index === player.lastIndex && player.index >= 0

  // Drop the one-shot ?input= param so a refresh keeps the last typed input.
  useEffect(() => {
    if (params.has('input')) {
      setParams(
        (p) => {
          p.delete('input')
          return p
        },
        { replace: true },
      )
    }
  }, [params, setParams])

  const closeTour = () => {
    setClosedTour(tourKey)
    setParams(
      (p) => {
        p.delete('tour')
        return p
      },
      { replace: true },
    )
  }

  // Remember the input (refresh keeps it).
  useEffect(() => {
    const id = window.setTimeout(() => writeString(LAST_INPUT_KEY, input), 250)
    return () => window.clearTimeout(id)
  }, [input])

  const setInput = useCallback((value: string) => {
    setInputRaw(value)
    setAsking(false)
  }, [])

  const run = useCallback(() => {
    if (needsPrediction) return setAsking(true)
    player.play()
  }, [needsPrediction, player])

  const stepForward = useCallback(() => {
    if (needsPrediction) return setAsking(true)
    player.stepForward()
  }, [needsPrediction, player])

  // Screen readers hear every step ("Pushed [, stack size 2").
  useEffect(() => {
    if (step) announce(plain(step.summary))
  }, [step, announce])

  // Verdict reached: record the run and the prediction (once per trace).
  const recorded = useRef<{ trace: unknown; prediction: unknown }>({ trace: null, prediction: null })
  useEffect(() => {
    if (!atVerdict) return
    if (recorded.current.trace !== trace) {
      recorded.current.trace = trace
      update(recordRun)
    }
    if (activePrediction && recorded.current.prediction !== prediction) {
      recorded.current.prediction = prediction
      const correct = (activePrediction === 'balanced') === trace.balanced
      update((p) => recordPrediction(p, correct))
      if (!correct) announce("Don't worry. Now let's inspect the exact step where the prediction failed.", 'assertive')
    }
  }, [atVerdict, trace, activePrediction, prediction, update, announce])

  // Keyboard: Space play/pause, ← → step, R reset, P presentation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || ui.presentation.open || ui.helpOpen || nestingOpen) return
      if (isTypingTarget(e.target)) return
      if (e.key === ' ' && !isInteractiveTarget(e.target)) {
        e.preventDefault()
        if (player.playing) player.pause()
        else run()
      } else if (e.key === 'ArrowRight' && !usesArrowKeys(e.target)) {
        e.preventDefault()
        stepForward()
      } else if (e.key === 'ArrowLeft' && !usesArrowKeys(e.target)) {
        e.preventDefault()
        player.stepBack()
      } else if (e.key === 'r' || e.key === 'R') {
        player.reset()
      } else if (e.key === 'p' || e.key === 'P') {
        ui.openPresentation(input)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player, run, stepForward, ui, input, nestingOpen])

  // Editor decorations for the current step.
  const errorMarks = useMemo<EditorMark[]>(() => {
    const e = step?.error
    if (!e) return []
    if (e.type === 'UNCLOSED_OPENING') {
      return e.remaining.map((it, k) => ({ index: it.index, message: `Unclosed ${it.char}: needs ${closerFor(it.char)}`, primary: k === e.remaining.length - 1 }))
    }
    return [{ index: e.charIndex, message: e.type === 'WRONG_TYPE' ? `Expected ${e.expected}, found ${e.found}` : `Unmatched ${e.found}: nothing to match`, primary: true }]
  }, [step])

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const inspectError = () => {
    player.jumpTo(trace.verdictStep)
    if (isMobile) setTab('explain')
    else scrollTo(editorRef.current)
  }

  const counters = step?.counters

  const groups: Record<Tab, ReactNode> = {
    editor: (
      <Panel
        title="Input"
        icon="code"
        tour="editor"
        area="editor"
        actions={
          <span className="vpanel__meta small muted">
            {input.length.toLocaleString()} chars · {trace.counters.processed.toLocaleString()} brackets
          </span>
        }
      >
        <div ref={editorRef}>
          <CodeEditor
            value={input}
            onChange={setInput}
            label="Input: brackets or code to check"
            current={step && step.kind !== 'end' ? step.charIndex : null}
            errors={errorMarks}
            showErrorTooltip={atVerdict && !trace.balanced}
            pair={matcher.pair}
            pairOk={matcher.info?.ok ?? true}
            onBracketFocus={matcher.setFocus}
            minLines={isMobile ? 6 : 7}
            maxLines={isMobile ? 12 : 14}
          />
        </div>
        <MatchStatus info={matcher.info} input={deferred} />
        <dl className="vcounts">
          <div>
            <dt>Characters scanned</dt>
            <dd>
              {(counters?.scanned ?? 0).toLocaleString()} / {input.length.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>Brackets processed</dt>
            <dd>{(counters?.processed ?? 0).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Ignored</dt>
            <dd>{(counters?.ignored ?? 0).toLocaleString()}</dd>
          </div>
        </dl>
      </Panel>
    ),
    stack: (
      <>
        <Panel title="Stack" icon="layers" tour="stack" area="stack">
          <StackView step={step} direction={player.direction} positionOf={positionOf} />
        </Panel>
        <Panel title="Timeline" icon="timeline" tour="timeline" area="timeline">
          <Timeline trace={trace} index={player.index} onJump={player.jumpTo} />
        </Panel>
      </>
    ),
    flow: (
      <>
        <Panel title="Flowchart" icon="flow" tour="flow" area="flow">
          <Flowchart trace={trace} index={player.index} />
        </Panel>
        <Panel title="Pseudocode (report Algorithm 1)" icon="list" area="pseudo">
          <PseudocodePanel step={step} />
        </Panel>
      </>
    ),
    explain: (
      <>
        <Panel title="Why did this happen?" icon="message" tour="explain" area="explain">
          <ExplainPanel step={step} total={trace.steps.length} />
        </Panel>
        <div ref={traceRef} className="vpanel-wrap vpanel-wrap--trace">
          <Panel title="Trace" icon="table" area="trace">
            <TracePanel trace={trace} index={player.index} onJump={player.jumpTo} />
          </Panel>
        </div>
      </>
    ),
    stats: (
      <Panel title="Operation HUD" icon="bars" area="stats">
        <StatsHud trace={trace} step={step} />
      </Panel>
    ),
  }

  return (
    <>
      <PageHeader
        tint="visualizer"
        eyebrow={
          <>
            <Icon name="layers" /> Algorithm debugger
          </>
        }
        title="Watch the Stack think"
        intro="Every panel below is drawn from the same trace step: the editor highlight, the Stack, the flowchart, the pseudocode line, the explanation and the counters."
      />

      <div className="viz page">
        <div className="viz__sticky">
          <PlaybackToolbar
            player={player}
            speed={speed}
            onSpeed={setSpeed}
            onRun={run}
            onStepForward={stepForward}
            predictMode={predictMode}
            onPredictMode={setPredictMode}
            onPresent={() => ui.openPresentation(input)}
          />
          {isMobile && (
            <div className="vtabs" role="tablist" aria-label="Visualizer panels">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`vtab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`vgroup-${t.id}`}
                  className="vtabs__tab"
                  onClick={() => setTab(t.id)}
                >
                  <Icon name={t.icon} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="viz__examples" role="group" aria-label="Examples">
          {EXAMPLE_GROUPS.map((g) => (
            <div key={g.id} className="viz__exgroup">
              <span className="viz__exlabel">
                {g.label} <span className="badge">{g.level}</span>
              </span>
              <div className="viz__chips">
                {EXAMPLES.filter((e) => e.group === g.id).map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    className={`chip ${ex.group === 'code' ? '' : 'chip--code'}`}
                    onClick={() => setInput(ex.input)}
                    title={ex.note}
                    aria-pressed={input === ex.input}
                  >
                    {ex.group === 'code' && ex.id !== 'expr' ? ex.label : <ColoredCode text={ex.label} className="chip__code" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {asking && player.atStart ? (
          <PredictionPrompt input={trace.input} onPredict={(v) => (setPrediction({ input: trace.input, value: v }), setAsking(false), player.play())} onSkip={() => (setSkippedFor(trace.input), setAsking(false), player.play())} />
        ) : atVerdict ? (
          <ResultCard
            trace={trace}
            prediction={activePrediction}
            onRunAgain={player.restart}
            onRestart={player.restart}
            onSeeTrace={() => {
              if (isMobile) setTab('explain')
              setTimeout(() => scrollTo(traceRef.current), 50)
            }}
            onTrySimilar={() => setInput(similarTo(trace))}
            onLearnWhy={() => navigate('/learn/algorithm')}
            onInspectError={inspectError}
            onNesting={() => setNestingOpen(true)}
          />
        ) : player.atStart ? (
          <div className="viz__banner">
            <span className="viz__banner-text">
              <strong>Ready? Let's watch the Stack think.</strong>
              <span className="muted small">
                {predictMode ? 'You will be asked to predict the result first.' : 'Prediction is off: the trace starts right away.'}
              </span>
            </span>
            <button type="button" className="btn btn--primary btn--lg" onClick={run}>
              <Icon name="play" /> Run Trace ▶
            </button>
            <button type="button" className="btn" onClick={() => setInput('([)]')}>
              Try a failing one: <ColoredCode text="([)]" />
            </button>
          </div>
        ) : null}

        <div className="viz__grid">
          {TABS.map((t) => (
            <div
              key={t.id}
              id={`vgroup-${t.id}`}
              className="vgroup"
              role={isMobile ? 'tabpanel' : undefined}
              aria-labelledby={isMobile ? `vtab-${t.id}` : undefined}
              hidden={isMobile && tab !== t.id}
            >
              {groups[t.id]}
            </div>
          ))}
        </div>
      </div>

      <NestingFold trace={trace} open={nestingOpen} onClose={() => setNestingOpen(false)} />
      <Tour steps={TOUR} open={tourOpen} onClose={closeTour} />
    </>
  )
}
