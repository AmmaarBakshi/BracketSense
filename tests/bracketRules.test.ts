import { describe, expect, it } from 'vitest'
import { closerFor, familyOf, isBracket, isClosing, isOpening, matches, openerFor, PAIRS } from '../src/core/bracketRules'

describe('bracketRules', () => {
  it('classifies opening and closing brackets', () => {
    for (const c of '([{') expect(isOpening(c)).toBe(true)
    for (const c of ')]}') expect(isClosing(c)).toBe(true)
    for (const c of 'a1 <>"\n') {
      expect(isBracket(c)).toBe(false)
    }
  })

  it('pairs each opener with its closer', () => {
    expect(PAIRS).toEqual({ '(': ')', '[': ']', '{': '}' })
    expect(closerFor('[')).toBe(']')
    expect(openerFor('}')).toBe('{')
  })

  it('matches only same-type pairs', () => {
    expect(matches('(', ')')).toBe(true)
    expect(matches('[', ']')).toBe(true)
    expect(matches('{', '}')).toBe(true)
    expect(matches('[', ')')).toBe(false)
    expect(matches('(', '}')).toBe(false)
    expect(matches(')', '(')).toBe(false)
  })

  it('maps brackets to colour families', () => {
    expect(familyOf('(')).toBe('round')
    expect(familyOf(']')).toBe('square')
    expect(familyOf('{')).toBe('curly')
    expect(familyOf('x')).toBeNull()
  })
})
