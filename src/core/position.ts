import type { Position } from './types'

/**
 * Returns a function mapping a character index to its 1-based line/column.
 * Line starts are computed once, lookups are O(log lines), so tracing a
 * 10 000-line file stays linear overall.
 */
export function createPositionLookup(input: string): (index: number) => Position {
  const starts = [0]
  for (let i = 0; i < input.length; i++) if (input.charCodeAt(i) === 10) starts.push(i + 1)

  return (index: number): Position => {
    let lo = 0
    let hi = starts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (starts[mid] <= index) lo = mid
      else hi = mid - 1
    }
    return { line: lo + 1, col: index - starts[lo] + 1 }
  }
}

export function formatPosition(p: Position): string {
  return `line ${p.line}, column ${p.col}`
}
