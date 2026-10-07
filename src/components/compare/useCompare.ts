import { useMemo } from 'react'
import { runStrategy } from '../../core/alternatives'
import { buildTrace } from '../../core/traceEngine'
import { scrubPositions, type ColumnSpec } from './CompareColumns'

/** Run Stack, Counter and Queue on the same input (real implementations). */
export function useCompare(input: string) {
  return useMemo(() => {
    const stack = runStrategy(input, 'stack')
    const counter = runStrategy(input, 'counter')
    const queue = runStrategy(input, 'queue')
    const truth = buildTrace(input).balanced
    const columns: ColumnSpec[] = [
      { result: stack, title: 'Stack (LIFO)', badge: { label: '✓ IDEAL', tone: 'success' } },
      { result: counter, title: 'Counter', badge: { label: '⚠ INCOMPLETE', tone: 'warning' } },
      { result: queue, title: 'Queue (FIFO)', badge: { label: '✕ UNSUITABLE', tone: 'error' } },
    ]
    return { columns, truth, positions: scrubPositions(input, [stack, counter, queue]) }
  }, [input])
}
