import { describe, expect, it } from 'vitest'
import { countOperations, fitLine, makeInput, stackHeights, TIME_SIZES } from '../src/core/complexity'
import { suggestFixes } from '../src/core/fixes'
import { codeLike, flat, nested, randomBalanced, seededRandom, similarTo, withError } from '../src/core/generators'
import { buildTrace } from '../src/core/traceEngine'
import { validate } from '../src/core/validator'

describe('generators', () => {
  it('randomBalanced, nested, flat and codeLike are always balanced', () => {
    const rand = seededRandom(3)
    for (let i = 0; i < 100; i++) {
      expect(validate(randomBalanced(2 + Math.floor(rand() * 60), rand)).balanced).toBe(true)
      expect(validate(codeLike(50 + Math.floor(rand() * 300), rand)).balanced).toBe(true)
    }
    expect(nested(10)).toBe('([{([])}])')
    expect(flat(6)).toBe('()[]{}')
  })

  it('withError produces exactly the requested error type', () => {
    const rand = seededRandom(11)
    for (const type of ['WRONG_TYPE', 'UNMATCHED_CLOSING', 'UNCLOSED_OPENING'] as const) {
      for (let i = 0; i < 50; i++) expect(validate(withError(type, 4 + Math.floor(rand() * 16), rand)).error?.type).toBe(type)
    }
  })

  it('similarTo keeps the verdict and error type', () => {
    const rand = seededRandom(5)
    for (const input of ['{[()]}', '([)]', '((', '))', 'a[i] = (b + c) * {d - e}']) {
      const t = buildTrace(input)
      const s = similarTo(t, rand)
      const v = validate(s)
      expect(v.balanced).toBe(t.balanced)
      expect(v.error?.type).toBe(t.error?.type)
      expect(s).not.toBe(input)
    }
  })
})

describe('complexity', () => {
  it('operations grow linearly with n', () => {
    const points = TIME_SIZES.map((n) => {
      const c = countOperations(makeInput('random', n))
      return { x: c.n, y: c.total }
    })
    const fit = fitLine(points)
    expect(fit.r2).toBeGreaterThan(0.999)
    // every character is read once; each bracket pair costs a push, a pop and a comparison
    expect(fit.slope).toBeGreaterThan(1)
    expect(fit.slope).toBeLessThan(3)
  })

  it('each character is examined exactly once', () => {
    const input = makeInput('code', 2000)
    expect(countOperations(input).scanned).toBe(input.length)
  })

  it('space: ()()()()() has max 1, ((((())))) has max 5, ((((((((((has max 10', () => {
    expect(stackHeights('()()()()()').max).toBe(1)
    expect(stackHeights('((((()))))').max).toBe(5)
    expect(stackHeights('((((((((((').heights).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(stackHeights('())(').stoppedAt).toBe(2)
  })
})

describe('fix suggestions', () => {
  it('([)]: suggests inserting ] before ) and every suggestion is verified', () => {
    const fixes = suggestFixes('([)]')
    expect(fixes.map((f) => f.title)).toContain('Insert `]` before `)`')
    const insert = fixes.find((f) => f.id === 'insert-before')!
    expect(insert.result).toBe('([])]')
    for (const f of fixes) {
      const v = validate(f.result)
      expect(f.resolves === 'all').toBe(v.balanced)
    }
  })

  it('((: appending the closers in LIFO order balances it', () => {
    const fixes = suggestFixes('({')
    expect(fixes[0]).toMatchObject({ id: 'append', result: '({})', resolves: 'all' })
  })

  it(')): removing the extra closer makes progress', () => {
    const fixes = suggestFixes('())')
    expect(fixes[0]).toMatchObject({ id: 'delete', result: '()', resolves: 'all' })
  })

  it('no suggestions for balanced input', () => {
    expect(suggestFixes('{[()]}')).toEqual([])
  })
})
