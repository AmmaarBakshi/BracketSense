import { closerFor, isOpening } from './bracketRules'
import type { FlowNodeId } from './flow'
import { tick } from './messages'
import { createPositionLookup } from './position'
import { PSEUDO_PATHS } from './pseudocode'
import type { StackSnapshot } from './Stack'
import { runAlgorithm, type CharEvent, type EndEvent } from './validator'
import type { Counters, StackItem, Trace, TraceStep } from './types'

/**
 * Deterministic snapshot generator: one TraceStep per examined character plus
 * one for end-of-input (unless an error stops the scan early, exactly like the
 * report's algorithm). Every panel in the UI renders `steps[currentStepIndex]`.
 *
 * Snapshots share structure (see Stack.snapshot), so building a trace is O(n)
 * time and memory even for 10 000+ character inputs. Steps are frozen; going
 * back to step i always shows exactly what step i showed before.
 */
export function buildTrace(input: string): Trace {
  const cached = cache.get(input)
  if (cached) return cached

  const steps: TraceStep[] = []
  const pairs: Array<readonly [number, number]> = []
  const position = createPositionLookup(input)
  const last = input.length - 1

  const onChar = (e: CharEvent) => {
    const stepNo = steps.length + 1
    const prefix: FlowNodeId[] = stepNo === 1 ? ['START'] : []
    const loop: FlowNodeId[] = e.index < last ? ['NEXT', 'END_INPUT', 'READ'] : ['NEXT', 'END_INPUT']
    const c = e.char

    if (e.operation === 'PUSH') {
      const below = e.before.peek()
      steps.push(
        makeStep({
          step: stepNo,
          char: c,
          charIndex: e.index,
          kind: 'opening',
          operation: 'PUSH',
          decision: 'Opening bracket → PUSH',
          seen: `An opening bracket ${tick(c)}`,
          mustDo: `Push ${tick(c)} onto the Stack so it can be matched later.`,
          explanation:
            `${tick(c)} is an opening bracket. We cannot know yet what will close it, so the algorithm remembers it by pushing it onto the Stack. ` +
            (below
              ? `${tick(c)} is now the TOP and sits on ${tick(below.char)}, which must wait until ${tick(c)} is closed (LIFO).`
              : `${tick(c)} is now the TOP: the first bracket that must be closed.`),
          summary: `Step ${stepNo}: pushed ${c}. Stack size ${e.counters.size}.`,
          before: e.before,
          after: e.after,
          flowchartNodeId: 'PUSH',
          flowPath: [...prefix, 'READ', 'IS_OPEN', 'PUSH', ...loop],
          pseudocodeLines: PSEUDO_PATHS.PUSH,
          counters: e.counters,
          position: position(e.index),
        }),
      )
      return
    }

    if (e.operation === 'POP') {
      const top = e.top!
      const newTop = e.after.peek()
      pairs.push([top.index, e.index])
      steps.push(
        makeStep({
          step: stepNo,
          char: c,
          charIndex: e.index,
          kind: 'closing',
          operation: 'POP',
          decision: `Closing bracket, top ${tick(top.char)} matches → POP`,
          seen: `A closing bracket ${tick(c)}`,
          mustDo: `Check that the top of the Stack is its partner ${tick(top.char)}, then pop it.`,
          explanation:
            `${tick(c)} is a closing bracket and the top of the Stack is ${tick(top.char)}, so they match. POP ${tick(top.char)}: this pair is complete. ` +
            (newTop
              ? `The new top is ${tick(newTop.char)}, the next bracket waiting to be closed.`
              : 'The Stack is empty again: every bracket opened so far has been closed.'),
          summary: `Step ${stepNo}: ${c} matches ${top.char}. Popped. Stack size ${e.counters.size}.`,
          before: e.before,
          after: e.after,
          top,
          expected: e.expected,
          found: c,
          matchedOpenIndex: top.index,
          flowchartNodeId: 'POP',
          flowPath: [...prefix, 'READ', 'IS_OPEN', 'IS_CLOSE', 'IS_EMPTY', 'TOP_MATCH', 'POP', ...loop],
          pseudocodeLines: PSEUDO_PATHS.POP,
          counters: e.counters,
          position: position(e.index),
        }),
      )
      return
    }

    if (e.operation === 'IGNORE') {
      const shown = tick(c)
      steps.push(
        makeStep({
          step: stepNo,
          char: c,
          charIndex: e.index,
          kind: 'ignored',
          operation: 'IGNORE',
          decision: 'Not a bracket → IGNORE',
          seen: `A non-bracket character: ${shown}`,
          mustDo: 'Nothing. Only ( ) [ ] { } matter, so skip it.',
          explanation: `${capitalize(shown)} is not a bracket, so the algorithm ignores it and moves on. The Stack does not change.`,
          summary: `Step ${stepNo}: ignored ${describe(c)}.`,
          before: e.before,
          after: e.after,
          flowchartNodeId: 'IGNORE',
          flowPath: [...prefix, 'READ', 'IS_OPEN', 'IS_CLOSE', 'IGNORE', ...loop],
          pseudocodeLines: PSEUDO_PATHS.IGNORE,
          counters: e.counters,
          position: position(e.index),
        }),
      )
      return
    }

    // ERROR at a closing bracket
    const error = e.error!
    if (error.type === 'UNMATCHED_CLOSING') {
      steps.push(
        makeStep({
          step: stepNo,
          char: c,
          charIndex: e.index,
          kind: 'closing',
          operation: 'ERROR',
          decision: 'Stack is empty → ERROR (unmatched closing)',
          seen: `A closing bracket ${tick(c)}`,
          mustDo: 'Match it with the opening bracket on top of the Stack — but the Stack is empty.',
          explanation: `${tick(c)} is a closing bracket, but the Stack is empty. No opening bracket is waiting to be closed, so this character has nothing to match. The sequence is invalid.`,
          summary: `Step ${stepNo}: error. ${c} has nothing to match: the Stack is empty.`,
          before: e.before,
          after: e.after,
          found: c,
          flowchartNodeId: 'ERR_UNMATCHED',
          flowPath: [...prefix, 'READ', 'IS_OPEN', 'IS_CLOSE', 'IS_EMPTY', 'ERR_UNMATCHED'],
          pseudocodeLines: PSEUDO_PATHS.UNMATCHED_CLOSING,
          counters: e.counters,
          error,
          position: position(e.index),
        }),
      )
      return
    }

    const top = e.top!
    const expected = closerFor(top.char)
    steps.push(
      makeStep({
        step: stepNo,
        char: c,
        charIndex: e.index,
        kind: 'closing',
        operation: 'ERROR',
        decision: `Top ${tick(top.char)} does not match ${tick(c)} → ERROR (wrong type)`,
        seen: `A closing bracket ${tick(c)}`,
        mustDo: `Compare it with the top of the Stack. Only ${tick(expected)} can close ${tick(top.char)}.`,
        explanation:
          `The top of the Stack is ${tick(top.char)}, but the current character is ${tick(c)}. The types do not match, so the sequence is invalid. ` +
          `${tick(top.char)} was opened most recently, so it must be closed first, and only ${tick(expected)} can close it.`,
        summary: `Step ${stepNo}: error. Expected ${expected}, found ${c}. The top of the Stack is ${top.char}.`,
        before: e.before,
        after: e.after,
        top,
        expected,
        found: c,
        flowchartNodeId: 'ERR_WRONG',
        flowPath: [...prefix, 'READ', 'IS_OPEN', 'IS_CLOSE', 'IS_EMPTY', 'TOP_MATCH', 'ERR_WRONG'],
        pseudocodeLines: PSEUDO_PATHS.WRONG_TYPE,
        counters: e.counters,
        error,
        position: position(e.index),
      }),
    )
  }

  const onEnd = (e: EndEvent) => {
    // An error at a character ends the scan immediately: no end-of-input step.
    if (e.error && e.error.type !== 'UNCLOSED_OPENING') return
    const stepNo = steps.length + 1
    const prefix: FlowNodeId[] = stepNo === 1 ? ['START'] : []
    const counters = e.counters
    const endPos = position(input.length)

    if (e.balanced) {
      steps.push(
        makeStep({
          step: stepNo,
          char: null,
          charIndex: input.length,
          kind: 'end',
          operation: 'ACCEPT',
          decision: 'End of input, Stack empty → BALANCED ✓',
          seen: 'The end of the input',
          mustDo: 'Check whether the Stack is empty.',
          explanation:
            input.length === 0
              ? 'Nothing to check: the input is empty. With no brackets, nothing is left open, and an empty Stack at the end means the sequence is balanced.'
              : counters.processed === 0
                ? 'End of input. There were no brackets at all, so the Stack stayed empty the whole time. An empty Stack at the end means balanced ✓.'
                : 'End of input. The Stack is empty, so every opening bracket was closed by the right partner in the right order. The sequence is balanced ✓.',
          summary: input.length === 0 ? 'Nothing to check. The input is empty, so it is balanced.' : `Step ${stepNo}: end of input. The Stack is empty. Balanced.`,
          before: e.remaining,
          after: e.remaining,
          flowchartNodeId: 'ACCEPT',
          flowPath: [...prefix, 'END_INPUT', 'FINAL_EMPTY', 'ACCEPT'],
          pseudocodeLines: PSEUDO_PATHS.ACCEPT,
          counters,
          position: endPos,
        }),
      )
      return
    }

    const error = e.error!
    const remaining = error.remaining
    const top = remaining[remaining.length - 1]
    const list = remaining.map((item) => tick(item.char)).join(', ')
    steps.push(
      makeStep({
        step: stepNo,
        char: null,
        charIndex: input.length,
        kind: 'end',
        operation: 'REJECT',
        decision: `End of input, ${remaining.length} left in Stack → ERROR (unclosed opening)`,
        seen: 'The end of the input',
        mustDo: 'Check whether the Stack is empty.',
        explanation:
          `End of input, but ${remaining.length} bracket(s) remain in the Stack: ${list}. They were opened and never closed, so the sequence is not balanced. ` +
          `The top one, ${tick(top.char)}, needed ${tick(closerFor(top.char))} first.`,
        summary: `Step ${stepNo}: end of input. ${remaining.length} bracket(s) remain in the Stack. Not balanced.`,
        before: e.remaining,
        after: e.remaining,
        top,
        expected: closerFor(top.char),
        flowchartNodeId: 'ERR_UNCLOSED',
        flowPath: [...prefix, 'END_INPUT', 'FINAL_EMPTY', 'ERR_UNCLOSED'],
        pseudocodeLines: PSEUDO_PATHS.REJECT,
        counters,
        error,
        position: endPos,
      }),
    )
  }

  const result = runAlgorithm(input, { onChar, onEnd })
  for (const s of steps) Object.freeze(s)

  const trace: Trace = Object.freeze({
    input,
    steps: Object.freeze(steps),
    balanced: result.balanced,
    error: result.error,
    counters: result.counters,
    pairs: Object.freeze(pairs),
    empty: result.empty,
    verdictStep: steps.length - 1,
  })
  remember(input, trace)
  return trace
}

type StepFields = Omit<TraceStep, 'stackBefore' | 'stackAfter' | 'pseudocodeLine' | 'counters'> & {
  counters: Counters
}

function makeStep(fields: StepFields): TraceStep {
  const before: StackSnapshot<StackItem> = fields.before
  const after: StackSnapshot<StackItem> = fields.after
  const lines = fields.pseudocodeLines
  return {
    ...fields,
    pseudocodeLine: lines[lines.length - 1],
    get stackBefore() {
      return before.toArray()
    },
    get stackAfter() {
      return after.toArray()
    },
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function describe(c: string): string {
  if (c === ' ') return 'a space'
  if (c === '\n') return 'a newline'
  if (c === '\t') return 'a tab'
  return c
}

/* Small cache: the same input is traced by several components at once. */
const CACHE_SIZE = 12
const cache = new Map<string, Trace>()
function remember(input: string, trace: Trace) {
  if (input.length > 200_000) return
  cache.set(input, trace)
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!)
}

/** Opening brackets of a string in order — handy for widgets and quizzes. */
export function openingCount(input: string): number {
  let n = 0
  for (const c of input) if (isOpening(c)) n++
  return n
}
