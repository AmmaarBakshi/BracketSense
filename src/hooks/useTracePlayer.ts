import { useCallback, useEffect, useState } from 'react'
import type { Trace } from '../core/types'

export type Direction = 'forward' | 'backward' | 'jump'

export interface TracePlayer {
  /** -1 = ready (nothing processed yet), otherwise an index into trace.steps */
  index: number
  direction: Direction
  playing: boolean
  atStart: boolean
  atEnd: boolean
  lastIndex: number
  play: () => void
  pause: () => void
  toggle: () => void
  stepForward: () => void
  stepBack: () => void
  jumpTo: (index: number) => void
  /** Back to the start and play again. */
  restart: () => void
  /** Back to the start, stopped. */
  reset: () => void
}

interface State {
  trace: Trace
  index: number
  direction: Direction
  playing: boolean
}

/**
 * The single source of truth for the Visualizer: `index` (currentStepIndex).
 * Every panel renders trace.steps[index]; this hook only moves the index.
 * `delayMs` = 0 is Instant mode: play jumps straight to the final step.
 */
export function useTracePlayer(trace: Trace, delayMs: number, initialIndex = -1): TracePlayer {
  const [state, setState] = useState<State>(() => ({ trace, index: Math.min(initialIndex, trace.steps.length - 1), direction: 'jump', playing: false }))

  // A new trace (the input changed) starts from the beginning.
  let current = state
  if (state.trace !== trace) {
    current = { trace, index: -1, direction: 'jump', playing: false }
    setState(current)
  }

  const lastIndex = trace.steps.length - 1
  const { index, playing } = current

  useEffect(() => {
    if (!playing || index >= lastIndex) return
    const id = window.setTimeout(
      () =>
        setState((s) => {
          const next = Math.min(s.index + 1, lastIndex)
          return { ...s, index: next, direction: 'forward', playing: next < lastIndex }
        }),
      delayMs,
    )
    return () => window.clearTimeout(id)
  }, [playing, index, lastIndex, delayMs])

  const play = useCallback(() => {
    setState((s) => {
      const atEnd = s.index >= s.trace.steps.length - 1
      if (delayMs === 0) return { ...s, index: s.trace.steps.length - 1, direction: 'jump', playing: false }
      if (atEnd) return { ...s, index: 0, direction: 'jump', playing: s.trace.steps.length > 1 }
      const index = s.index < 0 ? 0 : s.index
      return { ...s, playing: index < s.trace.steps.length - 1, index, direction: s.index < 0 ? 'forward' : s.direction }
    })
  }, [delayMs])

  const pause = useCallback(() => setState((s) => ({ ...s, playing: false })), [])

  const stepForward = useCallback(
    () => setState((s) => ({ ...s, playing: false, index: Math.min(s.index + 1, s.trace.steps.length - 1), direction: 'forward' })),
    [],
  )

  const stepBack = useCallback(() => setState((s) => ({ ...s, playing: false, index: Math.max(s.index - 1, -1), direction: 'backward' })), [])

  const jumpTo = useCallback(
    (i: number) => setState((s) => ({ ...s, playing: false, index: Math.max(-1, Math.min(i, s.trace.steps.length - 1)), direction: i === s.index + 1 ? 'forward' : 'jump' })),
    [],
  )

  const restart = useCallback(() => {
    setState((s) =>
      delayMs === 0
        ? { ...s, index: s.trace.steps.length - 1, direction: 'jump', playing: false }
        : { ...s, index: 0, direction: 'forward', playing: s.trace.steps.length > 1 },
    )
  }, [delayMs])

  const reset = useCallback(() => setState((s) => ({ ...s, index: -1, direction: 'jump', playing: false })), [])

  return {
    index,
    direction: current.direction,
    playing,
    atStart: index < 0,
    atEnd: index >= lastIndex,
    lastIndex,
    play,
    pause,
    toggle: playing ? pause : play,
    stepForward,
    stepBack,
    jumpTo,
    restart,
    reset,
  }
}
