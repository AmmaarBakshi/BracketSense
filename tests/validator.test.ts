import { describe, expect, it } from 'vitest'
import { isBalanced, validate } from '../src/core/validator'

describe('validator: SPEC section 2 edge cases', () => {
  it('"" is balanced (nothing to check)', () => {
    const r = validate('')
    expect(r.balanced).toBe(true)
    expect(r.empty).toBe(true)
    expect(r.error).toBeUndefined()
  })

  it.each(['()', '[]', '{}', '{[()]}', 'a[i] = (b + c) * {d - e}'])('%s is balanced', (s) => {
    expect(isBalanced(s)).toBe(true)
  })

  it('( is UNCLOSED_OPENING with 1 remaining', () => {
    const r = validate('(')
    expect(r.balanced).toBe(false)
    expect(r.error?.type).toBe('UNCLOSED_OPENING')
    expect(r.error?.remainingCount).toBe(1)
  })

  it(') is UNMATCHED_CLOSING at index 0', () => {
    const r = validate(')')
    expect(r.error?.type).toBe('UNMATCHED_CLOSING')
    expect(r.error?.charIndex).toBe(0)
  })

  it('([)] fails exactly at ) with WRONG_TYPE', () => {
    const r = validate('([)]')
    expect(r.balanced).toBe(false)
    expect(r.error).toMatchObject({ type: 'WRONG_TYPE', charIndex: 2, expected: ']', found: ')' })
    expect(r.error?.top?.char).toBe('[')
    expect(r.error?.message).toBe('Wrong bracket type. Expected `]`, found `)`. The top of the Stack is `[`.')
  })

  it('{[()]} pushes and pops every bracket', () => {
    const r = validate('{[()]}')
    expect(r.counters).toMatchObject({ pushes: 3, pops: 3, maxSize: 3, size: 0, processed: 6, ignored: 0, scanned: 6 })
  })

  it('((( is UNCLOSED_OPENING with 3 remaining', () => {
    const r = validate('(((')
    expect(r.error).toMatchObject({ type: 'UNCLOSED_OPENING', remainingCount: 3 })
  })

  it('(( is UNCLOSED_OPENING (2 remain) with the exact message', () => {
    const r = validate('((')
    expect(r.error?.type).toBe('UNCLOSED_OPENING')
    expect(r.error?.remainingCount).toBe(2)
    expect(r.error?.message).toBe('Unclosed opening brackets. 2 bracket(s) remain in the Stack: `(`, `(`.')
    expect(r.error?.remaining.map((i) => i.index)).toEqual([0, 1])
  })

  it(')) is UNMATCHED_CLOSING at the first )', () => {
    const r = validate('))')
    expect(r.error).toMatchObject({ type: 'UNMATCHED_CLOSING', charIndex: 0, found: ')' })
    expect(r.error?.message).toBe('Unmatched closing bracket. The Stack is empty, so there is nothing to match this character.')
    expect(r.counters.scanned).toBe(1)
  })

  it('] is UNMATCHED_CLOSING', () => {
    expect(validate(']').error?.type).toBe('UNMATCHED_CLOSING')
  })

  it('[(]) is WRONG_TYPE at index 2 (expected ), found ])', () => {
    expect(validate('[(])').error).toMatchObject({ type: 'WRONG_TYPE', charIndex: 2, expected: ')', found: ']' })
  })

  it('{[(])} is WRONG_TYPE at index 3', () => {
    expect(validate('{[(])}').error).toMatchObject({ type: 'WRONG_TYPE', charIndex: 3, expected: ')', found: ']' })
  })

  it('a[i] = (b + c) * {d - e} counts ignored characters', () => {
    const r = validate('a[i] = (b + c) * {d - e}')
    expect(r.counters).toMatchObject({ scanned: 24, processed: 6, ignored: 18, pushes: 3, pops: 3, maxSize: 1 })
  })

  it('reports line and column of the offending character', () => {
    const r = validate('function f() {\n  return [1, 2);\n}')
    expect(r.error?.type).toBe('WRONG_TYPE')
    expect(r.error?.position).toEqual({ line: 2, col: 15 })
  })

  it('the report example a[i) = (b + c) gives "Expected ] but found )"', () => {
    const r = validate('a[i) = (b + c)')
    expect(r.error).toMatchObject({ type: 'WRONG_TYPE', expected: ']', found: ')', charIndex: 3 })
  })
})
