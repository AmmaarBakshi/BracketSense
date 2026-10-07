import { codeLike, flat, nested, randomBalanced, seededRandom } from './generators'
import { runAlgorithm } from './validator'

/** Operation counts for one run of the real algorithm. */
export interface OpCount {
  n: number
  scanned: number
  pushes: number
  pops: number
  comparisons: number
  /** basic operations = characters read + pushes + pops + top comparisons */
  total: number
  maxSize: number
  /** wall-clock time of the run in milliseconds (noisy; shown for interest only) */
  ms: number
}

export function countOperations(input: string): OpCount {
  const t0 = performance.now()
  const { counters } = runAlgorithm(input)
  const ms = performance.now() - t0
  return {
    n: input.length,
    scanned: counters.scanned,
    pushes: counters.pushes,
    pops: counters.pops,
    comparisons: counters.comparisons,
    total: counters.scanned + counters.pushes + counters.pops + counters.comparisons,
    maxSize: counters.maxSize,
    ms,
  }
}

export type InputShape = 'random' | 'nested' | 'flat' | 'code'

export const SHAPE_LABEL: Record<InputShape, string> = {
  random: 'Random balanced brackets',
  nested: 'Deeply nested ((([[[{{{…',
  flat: 'Flat pairs ()[]{}…',
  code: 'Code-like text',
}

export const TIME_SIZES = [10, 100, 1000, 2500, 5000, 7500, 10000] as const

/** Generate a balanced input of (about) length n. Code-like inputs end on a whole line. */
export function makeInput(shape: InputShape, n: number, seed = 1): string {
  const rand = seededRandom(seed * 7919 + n)
  switch (shape) {
    case 'random':
      return randomBalanced(n, rand, 12)
    case 'nested':
      return nested(n)
    case 'flat':
      return flat(n)
    case 'code':
      return codeLike(n, rand)
  }
}

/** Stack size after every character: the data behind the space chart. */
export function stackHeights(input: string): { heights: number[]; max: number; stoppedAt?: number } {
  const heights: number[] = []
  const result = runAlgorithm(input, { onChar: (e) => heights.push(e.counters.size) })
  const stoppedAt = result.error && result.error.type !== 'UNCLOSED_OPENING' ? result.error.charIndex : undefined
  return { heights, max: result.counters.maxSize, stoppedAt }
}

/** Least-squares line through (n, ops) points: shows ops grow linearly with n. */
export function fitLine(points: ReadonlyArray<{ x: number; y: number }>): { slope: number; intercept: number; r2: number } {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 1 }
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my)
    sxx += (p.x - mx) ** 2
    syy += (p.y - my) ** 2
  }
  const slope = sxx === 0 ? 0 : sxy / sxx
  const intercept = my - slope * mx
  const r2 = sxx === 0 || syy === 0 ? 1 : (sxy * sxy) / (sxx * syy)
  return { slope, intercept, r2 }
}
