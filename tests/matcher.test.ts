import { describe, expect, it } from 'vitest'
import { buildPairMap, describeMatch } from '../src/core/matcher'
import { buildTrace } from '../src/core/traceEngine'

describe('matcher', () => {
  it('pairs nested brackets innermost first', () => {
    const m = buildPairMap('{[()]}')
    expect(m.pairs).toEqual([
      [2, 3],
      [1, 4],
      [0, 5],
    ])
    expect(m.partner.get(0)).toBe(5)
    expect(m.partner.get(5)).toBe(0)
    expect(m.depth.get(2)).toBe(2)
    expect(m.depth.get(0)).toBe(0)
  })

  it('agrees with the trace engine on balanced inputs', () => {
    for (const input of ['{[()]}', 'a[i] = (b + c) * {d - e}', '()[]{}', 'f(x) { return [g(y), {z}]; }']) {
      expect(buildPairMap(input).pairs).toEqual(buildTrace(input).pairs)
    }
  })

  it('flags the mismatched closer in ([)] and keeps going', () => {
    const m = buildPairMap('([)]')
    expect(m.status.get(2)).toBe('mismatch')
    expect(m.comparedWith.get(2)).toBe(1)
    expect(m.partner.get(1)).toBe(3)
    expect(m.status.get(0)).toBe('unclosed')
  })

  it('flags closers with an empty stack as unmatched', () => {
    const m = buildPairMap('))')
    expect(m.status.get(0)).toBe('unmatched')
    expect(m.status.get(1)).toBe('unmatched')
  })

  it('describes matches for hover/click', () => {
    const input = '{[()]}'
    const m = buildPairMap(input)
    expect(describeMatch(input, m, 0)?.headline).toBe('✓ Matching pair found')
    expect(describeMatch(input, m, 0)?.partner).toBe(5)
    const bad = '(('
    expect(describeMatch(bad, buildPairMap(bad), 1)?.headline).toBe('⚠ No matching bracket')
    expect(describeMatch('a', buildPairMap('a'), 0)).toBeNull()
  })
})
