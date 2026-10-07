import { CLOSING, closerFor, isClosing, isOpening, OPENING, type OpenBracket } from './bracketRules'
import type { ErrorType, Trace } from './types'
import { validate } from './validator'

/** Deterministic PRNG (mulberry32): same seed, same inputs — tests and charts are reproducible. */
export function seededRandom(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(rand: () => number, list: readonly T[]): T => list[Math.floor(rand() * list.length)]

/** Random balanced bracket string of (even) length `len`. */
export function randomBalanced(len: number, rand: () => number = Math.random, maxDepth = 6): string {
  const n = len - (len % 2)
  const open: OpenBracket[] = []
  let out = ''
  for (let i = 0; i < n; i++) {
    const remaining = n - i
    const mustClose = open.length === remaining || open.length >= maxDepth
    const mayClose = open.length > 0
    if (mustClose || (mayClose && rand() < 0.45)) out += closerFor(open.pop()!)
    else {
      const o = pick(rand, OPENING)
      open.push(o)
      out += o
    }
  }
  return out
}

/** `depth` openers followed by their closers: ({[({[...]})]}) — worst case for space. */
export function nested(len: number): string {
  const half = Math.floor(len / 2)
  const opens: OpenBracket[] = Array.from({ length: half }, (_, i) => OPENING[i % 3])
  return opens.join('') + opens.reverse().map(closerFor).join('')
}

/** ()[]{}()... — every pair closes immediately: max stack size 1. */
export function flat(len: number): string {
  const pairs = ['()', '[]', '{}']
  let s = ''
  for (let i = 0; s.length + 2 <= len; i++) s += pairs[i % 3]
  return s
}

const IDENTS = ['a', 'b', 'i', 'n', 'sum', 'x', 'arr', 'total', 'node', 'val']

/** Realistic-looking code: statements with calls, indexing and blocks (always balanced). */
export function codeLike(len: number, rand: () => number = Math.random): string {
  const lines: string[] = []
  let size = 0
  const expr = (depth: number): string => {
    const r = rand()
    if (depth > 2 || r < 0.35) return pick(rand, IDENTS)
    if (r < 0.6) return `${pick(rand, IDENTS)}[${expr(depth + 1)}]`
    if (r < 0.85) return `f(${expr(depth + 1)}, ${expr(depth + 1)})`
    return `(${expr(depth + 1)} + ${expr(depth + 1)})`
  }
  while (size < len) {
    const r = rand()
    const line =
      r < 0.3
        ? `if (${expr(0)} > ${expr(0)}) { ${pick(rand, IDENTS)} = ${expr(0)}; }`
        : r < 0.55
          ? `for (i = 0; i < n; i++) { ${pick(rand, IDENTS)}[i] = ${expr(0)}; }`
          : r < 0.8
            ? `${pick(rand, IDENTS)} = ${expr(0)};`
            : `log({ v: [${expr(0)}, ${expr(0)}] });`
    lines.push(line)
    size += line.length + 1
  }
  return lines.join('\n')
}

/** Corrupt a balanced string so it fails with the given error type. */
export function withError(type: ErrorType, len: number, rand: () => number = Math.random): string {
  const base = randomBalanced(Math.max(len, 4), rand, 4)
  const chars = [...base]
  if (type === 'UNCLOSED_OPENING') {
    // drop the last closing bracket
    const i = chars.findLastIndex((c) => isClosing(c))
    chars.splice(i, 1)
    return chars.join('')
  }
  if (type === 'UNMATCHED_CLOSING') {
    // close one more time than we opened, right after a top-level pair
    const pos = topLevelEnds(base)
    const at = pos.length ? pick(rand, pos) : base.length
    return base.slice(0, at) + pick(rand, CLOSING) + base.slice(at)
  }
  // WRONG_TYPE: replace a closing bracket with a different closer
  const closers = chars.map((c, i) => (isClosing(c) ? i : -1)).filter((i) => i >= 0)
  const i = pick(rand, closers)
  const others = CLOSING.filter((c) => c !== chars[i])
  chars[i] = pick(rand, others)
  return chars.join('')
}

/** Indices right after each top-level pair closes. */
function topLevelEnds(s: string): number[] {
  const out: number[] = []
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (isOpening(s[i])) depth++
    else if (isClosing(s[i])) {
      depth--
      if (depth === 0) out.push(i + 1)
    }
  }
  return out
}

/** "Try Similar": a fresh input with the same verdict and a similar size. */
export function similarTo(trace: Trace, rand: () => number = Math.random): string {
  const brackets = trace.counters.processed || 6
  const isCode = trace.counters.ignored > brackets
  for (let attempt = 0; attempt < 20; attempt++) {
    let candidate: string
    if (trace.balanced) {
      candidate = isCode ? codeLike(Math.max(30, trace.input.length), rand) : randomBalanced(Math.max(4, brackets + (brackets % 2)), rand, Math.max(2, trace.counters.maxSize))
    } else {
      candidate = withError(trace.error!.type, Math.max(4, brackets), rand)
    }
    const v = validate(candidate)
    if (candidate !== trace.input && v.balanced === trace.balanced && v.error?.type === trace.error?.type) return candidate
  }
  return trace.balanced ? '({[]})' : '([)]'
}
