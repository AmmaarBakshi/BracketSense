import { closerFor, isClosing, isOpening, matches, type CloseBracket } from './bracketRules'
import { UNMATCHED_CLOSING_MESSAGE, unclosedMessage, wrongTypeMessage } from './messages'
import { createPositionLookup } from './position'
import { Stack, type StackSnapshot } from './Stack'
import type { BracketError, Counters, StackItem, ValidationResult } from './types'

/** Event emitted for every character the algorithm examines. */
export interface CharEvent {
  index: number
  char: string
  kind: 'opening' | 'closing' | 'ignored'
  operation: 'PUSH' | 'POP' | 'IGNORE' | 'ERROR'
  /** Top of the stack before the step (closing brackets only). */
  top?: StackItem
  expected?: CloseBracket
  error?: BracketError
  before: StackSnapshot<StackItem>
  after: StackSnapshot<StackItem>
  counters: Counters
}

export interface EndEvent {
  balanced: boolean
  error?: BracketError
  remaining: StackSnapshot<StackItem>
  counters: Counters
}

export interface AlgorithmObserver {
  onChar?(event: CharEvent): void
  onEnd?(event: EndEvent): void
}

/**
 * THE balanced-brackets algorithm (report, Algorithm 1). This is the only
 * implementation in the app: `validate` calls it directly and the trace engine
 * records its steps through the observer.
 *
 *   for each character c:
 *     if c is opening: push c
 *     else if c is closing:
 *       if stack is empty: reject (UNMATCHED_CLOSING)
 *       if top does not match c: reject (WRONG_TYPE)
 *       pop
 *   after loop: stack empty ? accept : reject (UNCLOSED_OPENING)
 */
export function runAlgorithm(input: string, observer?: AlgorithmObserver): ValidationResult {
  const stack = new Stack<StackItem>()
  const position = createPositionLookup(input)
  const counters: Counters = { scanned: 0, processed: 0, ignored: 0, pushes: 0, pops: 0, comparisons: 0, size: 0, maxSize: 0 }
  const observe = !!observer?.onChar

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    const before = observe ? stack.snapshot() : null
    counters.scanned++

    if (isOpening(c)) {
      counters.processed++
      stack.push({ char: c, index: i })
      counters.pushes++
      counters.size = stack.size()
      if (counters.size > counters.maxSize) counters.maxSize = counters.size
      if (observe) observer!.onChar!({ index: i, char: c, kind: 'opening', operation: 'PUSH', before: before!, after: stack.snapshot(), counters: { ...counters } })
      continue
    }

    if (isClosing(c)) {
      counters.processed++
      if (stack.isEmpty()) {
        const error: BracketError = {
          type: 'UNMATCHED_CLOSING',
          charIndex: i,
          found: c,
          remaining: [],
          remainingCount: 0,
          message: UNMATCHED_CLOSING_MESSAGE,
          position: position(i),
        }
        if (observe) observer!.onChar!({ index: i, char: c, kind: 'closing', operation: 'ERROR', error, before: before!, after: before!, counters: { ...counters } })
        return finish(input, false, error, counters, observer, stack)
      }

      const top = stack.peek()!
      counters.comparisons++
      if (!matches(top.char, c)) {
        const expected = closerFor(top.char)
        const remaining = stack.toArray()
        const error: BracketError = {
          type: 'WRONG_TYPE',
          charIndex: i,
          expected,
          found: c,
          top,
          remaining,
          remainingCount: remaining.length,
          message: wrongTypeMessage(expected, c, top.char),
          position: position(i),
        }
        if (observe)
          observer!.onChar!({ index: i, char: c, kind: 'closing', operation: 'ERROR', top, expected, error, before: before!, after: before!, counters: { ...counters } })
        return finish(input, false, error, counters, observer, stack)
      }

      stack.pop()
      counters.pops++
      counters.size = stack.size()
      if (observe)
        observer!.onChar!({ index: i, char: c, kind: 'closing', operation: 'POP', top, expected: closerFor(top.char), before: before!, after: stack.snapshot(), counters: { ...counters } })
      continue
    }

    counters.ignored++
    if (observe) observer!.onChar!({ index: i, char: c, kind: 'ignored', operation: 'IGNORE', before: before!, after: before!, counters: { ...counters } })
  }

  if (stack.isEmpty()) return finish(input, true, undefined, counters, observer, stack)

  const remaining = stack.toArray()
  const top = remaining[remaining.length - 1]
  const error: BracketError = {
    type: 'UNCLOSED_OPENING',
    charIndex: top.index,
    remaining,
    remainingCount: remaining.length,
    message: unclosedMessage(remaining),
    position: position(top.index),
  }
  return finish(input, false, error, counters, observer, stack)
}

function finish(
  input: string,
  balanced: boolean,
  error: BracketError | undefined,
  counters: Counters,
  observer: AlgorithmObserver | undefined,
  stack: Stack<StackItem>,
): ValidationResult {
  observer?.onEnd?.({ balanced, error, remaining: stack.snapshot(), counters: { ...counters } })
  return { input, balanced, error, counters: { ...counters }, empty: input.length === 0 }
}

/** Fast validation (no snapshots). */
export function validate(input: string): ValidationResult {
  return runAlgorithm(input)
}

export function isBalanced(input: string): boolean {
  return runAlgorithm(input).balanced
}
