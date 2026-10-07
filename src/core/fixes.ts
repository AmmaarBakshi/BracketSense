import { closerFor, openerFor, type CloseBracket } from './bracketRules'
import { tick } from './messages'
import { formatPosition } from './position'
import { buildTrace } from './traceEngine'
import type { Trace } from './types'
import { validate } from './validator'

export interface FixSuggestion {
  id: string
  /** e.g. "Insert `]` before `)`" */
  title: string
  detail: string
  /** The input after applying the fix. */
  result: string
  /** 'all': the whole input becomes balanced. 'this': this error is fixed but another remains. */
  resolves: 'all' | 'this'
}

/**
 * Fix suggestions computed from the trace's first error. Every suggestion is
 * verified by running the real validator on the result.
 */
export function suggestFixes(input: string, trace: Trace = buildTrace(input)): FixSuggestion[] {
  const err = trace.error
  if (!err) return []
  const at = formatPosition(err.position)
  const i = err.charIndex
  const raw: Array<Omit<FixSuggestion, 'resolves'>> = []

  if (err.type === 'WRONG_TYPE') {
    const expected = err.expected!
    const found = err.found!
    raw.push({
      id: 'insert-before',
      title: `Insert ${tick(expected)} before ${tick(found)}`,
      detail: `Close ${tick(err.top!.char)} first (it is on top of the Stack), then let ${tick(found)} close the bracket below it. At ${at}.`,
      result: input.slice(0, i) + expected + input.slice(i),
    })
    raw.push({
      id: 'replace',
      title: `Replace ${tick(found)} with ${tick(expected)}`,
      detail: `${tick(err.top!.char)} is on top of the Stack, so the closer here must be ${tick(expected)}. At ${at}.`,
      result: input.slice(0, i) + expected + input.slice(i + 1),
    })
  } else if (err.type === 'UNMATCHED_CLOSING') {
    const found = err.found! as CloseBracket
    raw.push({
      id: 'delete',
      title: `Remove the extra ${tick(found)}`,
      detail: `Nothing is open when ${tick(found)} arrives, so it is probably a typo. At ${at}.`,
      result: input.slice(0, i) + input.slice(i + 1),
    })
    raw.push({
      id: 'add-opener',
      title: `Add ${tick(openerFor(found))} at the start`,
      detail: `Give ${tick(found)} an opening partner earlier in the text.`,
      result: openerFor(found) + input,
    })
  } else {
    const closers = [...err.remaining].reverse().map((item) => closerFor(item.char)).join('')
    raw.push({
      id: 'append',
      title: `Add ${tick(closers)} at the end`,
      detail: `Close the ${err.remainingCount} open bracket(s) in reverse order: the top of the Stack first (LIFO).`,
      result: input + closers,
    })
    const top = err.remaining[err.remaining.length - 1]
    raw.push({
      id: 'remove-opener',
      title: `Remove the unclosed ${tick(top.char)}`,
      detail: `If ${tick(top.char)} at ${at} was a typo, deleting it removes one unclosed bracket.`,
      result: input.slice(0, top.index) + input.slice(top.index + 1),
    })
  }

  const fixes: FixSuggestion[] = raw.map((f) => {
    const v = validate(f.result)
    return { ...f, resolves: v.balanced ? 'all' : 'this' }
  })
  // keep fixes that make progress: balanced, or the first error moves later
  const progress = fixes.filter((f) => {
    if (f.resolves === 'all') return true
    const next = validate(f.result).error
    return !next || next.charIndex !== i || next.type !== err.type
  })
  return progress.sort((a, b) => (a.resolves === b.resolves ? 0 : a.resolves === 'all' ? -1 : 1))
}
