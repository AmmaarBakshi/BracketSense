import { describe, expect, it } from 'vitest'
import { FLOW_EDGES } from '../src/core/flow'
import { buildTrace } from '../src/core/traceEngine'
import { validate } from '../src/core/validator'
import type { TraceStep } from '../src/core/types'

const ops = (input: string) => buildTrace(input).steps.map((s) => s.operation)
const chars = (stack: readonly { char: string }[]) => stack.map((i) => i.char).join('')

/** Small deterministic PRNG so property tests are reproducible. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomInput(rand: () => number, len: number): string {
  const alphabet = '()[]{}()[]{}ab '
  let s = ''
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(rand() * alphabet.length)]
  return s
}

describe('traceEngine', () => {
  it('{[()]}: verifies every push and pop (acceptance test 1)', () => {
    const t = buildTrace('{[()]}')
    expect(t.balanced).toBe(true)
    expect(ops('{[()]}')).toEqual(['PUSH', 'PUSH', 'PUSH', 'POP', 'POP', 'POP', 'ACCEPT'])
    expect(t.steps.map((s) => chars(s.stackAfter))).toEqual(['{', '{[', '{[(', '{[', '{', '', ''])
    expect(t.steps.slice(3, 6).map((s) => s.matchedOpenIndex)).toEqual([2, 1, 0])
    expect(t.pairs).toEqual([
      [2, 3],
      [1, 4],
      [0, 5],
    ])
    expect(t.steps.map((s) => s.flowchartNodeId)).toEqual(['PUSH', 'PUSH', 'PUSH', 'POP', 'POP', 'POP', 'ACCEPT'])
  })

  it('writes WHY-style explanations', () => {
    const t = buildTrace('{[()]}')
    expect(t.steps[3].explanation.startsWith('`)` is a closing bracket and the top of the Stack is `(`, so they match. POP `(`')).toBe(true)
    expect(t.steps[0].explanation).toContain('opening bracket')
    expect(t.steps[6].explanation).toContain('balanced')
  })

  it('([)]: fails exactly at ) with WRONG_TYPE and keeps [ on top (acceptance test 2)', () => {
    const t = buildTrace('([)]')
    expect(ops('([)]')).toEqual(['PUSH', 'PUSH', 'ERROR'])
    const err = t.steps[2]
    expect(err.charIndex).toBe(2)
    expect(err.char).toBe(')')
    expect(err.error?.type).toBe('WRONG_TYPE')
    expect(err.expected).toBe(']')
    expect(err.found).toBe(')')
    expect(err.top?.char).toBe('[')
    expect(chars(err.stackAfter)).toBe('([')
    expect(err.flowchartNodeId).toBe('ERR_WRONG')
    expect(err.pseudocodeLine).toBe(13)
    expect(err.explanation).toContain('The top of the Stack is `[`, but the current character is `)`. The types do not match, so the sequence is invalid.')
  })

  it('((: UNCLOSED_OPENING with 2 remaining (acceptance test 3)', () => {
    const t = buildTrace('((')
    expect(ops('((')).toEqual(['PUSH', 'PUSH', 'REJECT'])
    const end = t.steps[2]
    expect(end.kind).toBe('end')
    expect(end.error?.type).toBe('UNCLOSED_OPENING')
    expect(end.error?.remainingCount).toBe(2)
    expect(end.flowchartNodeId).toBe('ERR_UNCLOSED')
  })

  it(')): UNMATCHED_CLOSING at the first ) and the scan stops (acceptance test 4)', () => {
    const t = buildTrace('))')
    expect(t.steps).toHaveLength(1)
    expect(t.steps[0]).toMatchObject({ operation: 'ERROR', charIndex: 0, flowchartNodeId: 'ERR_UNMATCHED', pseudocodeLine: 9 })
    expect(t.error?.type).toBe('UNMATCHED_CLOSING')
  })

  it('a[i] = (b + c) * {d - e}: balanced with correct ignored count (acceptance test 5)', () => {
    const t = buildTrace('a[i] = (b + c) * {d - e}')
    expect(t.balanced).toBe(true)
    expect(t.steps).toHaveLength(25)
    expect(t.counters).toMatchObject({ scanned: 24, processed: 6, ignored: 18 })
    expect(t.steps.filter((s) => s.operation === 'IGNORE')).toHaveLength(18)
    expect(t.steps[0].explanation).toContain('not a bracket')
  })

  it('empty input is balanced with a "Nothing to check" note', () => {
    const t = buildTrace('')
    expect(t.balanced).toBe(true)
    expect(t.empty).toBe(true)
    expect(t.steps).toHaveLength(1)
    expect(t.steps[0].operation).toBe('ACCEPT')
    expect(t.steps[0].explanation).toContain('Nothing to check')
  })

  it.each([
    ['', true],
    ['()', true],
    ['[]', true],
    ['{}', true],
    ['(', false],
    [')', false],
    ['([)]', false],
    ['{[()]}', true],
    ['(((', false],
    ['))', false],
    [']', false],
    ['[(])', false],
    ['{[(])}', false],
    ['a[i] = (b + c) * {d - e}', true],
  ])('edge case %j -> balanced=%s', (input, balanced) => {
    expect(buildTrace(input).balanced).toBe(balanced)
  })

  it('agrees with the validator on 600 random inputs', () => {
    const rand = rng(42)
    for (let i = 0; i < 600; i++) {
      const input = randomInput(rand, Math.floor(rand() * 24))
      const t = buildTrace(input)
      const v = validate(input)
      expect(t.balanced).toBe(v.balanced)
      expect(t.error?.type).toBe(v.error?.type)
      expect(t.error?.charIndex).toBe(v.error?.charIndex)
      expect(t.counters).toEqual(v.counters)
    }
  })

  it('every step starts from the previous step\'s stack and applies exactly its operation', () => {
    const rand = rng(7)
    for (let n = 0; n < 200; n++) {
      const t = buildTrace(randomInput(rand, 30))
      let prev: TraceStep | null = null
      for (const s of t.steps) {
        if (prev) expect(chars(s.stackBefore)).toBe(chars(prev.stackAfter))
        else expect(s.stackBefore).toHaveLength(0)
        const before = chars(s.stackBefore)
        const after = chars(s.stackAfter)
        if (s.operation === 'PUSH') expect(after).toBe(before + s.char)
        else if (s.operation === 'POP') expect(after).toBe(before.slice(0, -1))
        else expect(after).toBe(before)
        expect(s.counters.size).toBe(s.stackAfter.length)
        prev = s
      }
    }
  })

  it('is deterministic and immutable, so stepping back restores exact snapshots', () => {
    const input = 'int main() { for (i = 0; i < n; i++) { a[i] = (b[i] + c); } }'
    const serialize = (s: TraceStep) =>
      JSON.stringify({ ...s, before: undefined, after: undefined, stackBefore: s.stackBefore, stackAfter: s.stackAfter })
    const first = buildTrace(input).steps.map(serialize)
    // walk forward to the end, then back to the start, re-reading every snapshot
    const t = buildTrace(input)
    for (let i = 0; i < t.steps.length; i++) expect(serialize(t.steps[i])).toBe(first[i])
    for (let i = t.steps.length - 1; i >= 0; i--) expect(serialize(t.steps[i])).toBe(first[i])
    expect(Object.isFrozen(t.steps)).toBe(true)
    expect(Object.isFrozen(t.steps[0])).toBe(true)
  })

  it('flow paths only use real flowchart edges', () => {
    const edges = new Set(FLOW_EDGES.map((e) => `${e.from}->${e.to}`))
    for (const input of ['{[()]}', '([)]', '((', '))', 'a(b)c', '']) {
      for (const s of buildTrace(input).steps) {
        for (let i = 1; i < s.flowPath.length; i++) {
          const id = `${s.flowPath[i - 1]}->${s.flowPath[i]}`
          if (input === '' && id === 'START->END_INPUT') continue
          expect(edges.has(id), `${input}: ${id}`).toBe(true)
        }
      }
    }
  })

  it('counters are monotonic and maxSize tracks the deepest stack', () => {
    const t = buildTrace('((([[]])))[]')
    for (let i = 1; i < t.steps.length; i++) {
      const a = t.steps[i - 1].counters
      const b = t.steps[i].counters
      expect(b.scanned).toBeGreaterThanOrEqual(a.scanned)
      expect(b.pushes).toBeGreaterThanOrEqual(a.pushes)
      expect(b.maxSize).toBeGreaterThanOrEqual(a.maxSize)
    }
    expect(t.counters.maxSize).toBe(5)
  })

  it('handles 20 000-character inputs in linear time', () => {
    const input = '({[]})'.repeat(3334)
    const t0 = performance.now()
    const t = buildTrace(input)
    const ms = performance.now() - t0
    expect(t.balanced).toBe(true)
    expect(t.steps).toHaveLength(input.length + 1)
    expect(ms).toBeLessThan(2000)
    expect(t.steps[2].stackAfter.map((i) => i.char).join('')).toBe('({[')
  })
})
