import { closerFor, isClosing, isOpening, matches } from './bracketRules'
import { tick } from './messages'
import { Queue } from './Queue'
import { Stack } from './Stack'
import { buildTrace } from './traceEngine'
import type { StackItem } from './types'

/**
 * Real alternative implementations, used by Compare ("Why not Queue or
 * Counter?") and Break the Algorithm. Each one is a genuine program run on the
 * input, not a scripted animation. `stack` is the correct algorithm and is
 * derived from the real trace engine.
 */
export type StrategyId = 'stack' | 'counter' | 'queue' | 'ignore-types' | 'pop-bottom' | 'skip-top-check' | 'skip-end-check'

export type StructureKind = 'stack' | 'queue' | 'counter'

export interface AltStep {
  /** Character index, or input.length for the end-of-input step. */
  index: number
  char: string | null
  /** Short action, e.g. "push (", "count 2 → 1", "dequeue {". */
  action: string
  /** false when this step rejects the input */
  ok: boolean
  /** Contents after the step: stack bottom→top, queue front→back. Empty for counter. */
  structure: readonly string[]
  counter?: number
  /** Position in `structure` (before the step) that was compared or removed. */
  compared?: number
  /** Plain-English explanation of this step (backticks mark code). */
  note: string
  final?: boolean
}

export interface AltResult {
  strategy: StrategyId
  kind: StructureKind
  steps: AltStep[]
  /** What this implementation claims. */
  balanced: boolean
  /** Index of the character at which it rejected, if it did. */
  rejectedAt?: number
  /** Final explanation of the verdict. */
  reason: string
}

export function runStrategy(input: string, strategy: StrategyId): AltResult {
  switch (strategy) {
    case 'stack':
      return runStack(input)
    case 'counter':
      return runCounter(input)
    case 'queue':
      return runQueue(input)
    case 'pop-bottom':
      return runPopBottom(input)
    case 'ignore-types':
    case 'skip-top-check':
    case 'skip-end-check':
      return runFaultyStack(input, strategy)
  }
}

/** The correct algorithm, from the real trace engine. */
function runStack(input: string): AltResult {
  const trace = buildTrace(input)
  const steps: AltStep[] = trace.steps
    .filter((s) => s.operation !== 'IGNORE')
    .map((s) => ({
      index: s.charIndex,
      char: s.char,
      action:
        s.operation === 'PUSH'
          ? `push ${s.char}`
          : s.operation === 'POP'
            ? `pop ${s.top?.char}`
            : s.operation === 'ACCEPT'
              ? 'stack empty ✓'
              : s.operation === 'REJECT'
                ? `${s.stackAfter.length} left ✕`
                : 'reject ✕',
      ok: s.operation !== 'ERROR' && s.operation !== 'REJECT',
      structure: s.stackAfter.map((i) => i.char),
      compared: s.top ? s.stackBefore.length - 1 : undefined,
      note: s.explanation,
      final: s.kind === 'end' || s.operation === 'ERROR',
    }))
  return {
    strategy: 'stack',
    kind: 'stack',
    steps,
    balanced: trace.balanced,
    rejectedAt: trace.error?.type === 'UNCLOSED_OPENING' ? undefined : trace.error?.charIndex,
    reason: trace.balanced
      ? 'Correct: every closing bracket matched the most recent unmatched opening bracket (the top), and the Stack ended empty.'
      : `Correct: ${trace.error!.message}`,
  }
}

function runCounter(input: string): AltResult {
  let count = 0
  const steps: AltStep[] = []
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (isOpening(c)) {
      steps.push({ index: i, char: c, action: `count ${count} → ${count + 1}`, ok: true, structure: [], counter: count + 1, note: `${tick(c)} opens something, so the counter goes up to ${count + 1}. It does not remember that it was a ${tick(c)}.` })
      count++
    } else if (isClosing(c)) {
      if (count === 0) {
        steps.push({ index: i, char: c, action: 'count is 0 ✕', ok: false, structure: [], counter: 0, note: `${tick(c)} closes something, but the counter is already 0. Nothing is open, so this is rejected.`, final: true })
        return { strategy: 'counter', kind: 'counter', steps, balanced: false, rejectedAt: i, reason: 'The counter caught a closing bracket with nothing open.' }
      }
      steps.push({ index: i, char: c, action: `count ${count} → ${count - 1}`, ok: true, structure: [], counter: count - 1, note: `${tick(c)} closes something, so the counter goes down to ${count - 1}. It cannot check WHICH bracket ${tick(c)} is closing.` })
      count--
    }
  }
  const balanced = count === 0
  steps.push({
    index: input.length,
    char: null,
    action: balanced ? 'count = 0 → "balanced"' : `count = ${count} ✕`,
    ok: balanced,
    structure: [],
    counter: count,
    note: balanced
      ? 'The counter ended at 0, so it says “balanced”. It only knows how many brackets are open, not their type or order.'
      : `The counter ended at ${count}, so ${count} bracket(s) were never closed.`,
    final: true,
  })
  return {
    strategy: 'counter',
    kind: 'counter',
    steps,
    balanced,
    reason: balanced
      ? 'The counter says balanced because opens and closes cancel out. It knows how many are open, but not their type or order.'
      : 'The counter ended above zero: some brackets were never closed.',
  }
}

function runQueue(input: string): AltResult {
  const q = new Queue<StackItem>()
  const steps: AltStep[] = []
  const contents = () => q.toArray().map((i) => i.char)
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (isOpening(c)) {
      q.enqueue({ char: c, index: i })
      steps.push({ index: i, char: c, action: `enqueue ${c}`, ok: true, structure: contents(), note: `${tick(c)} joins the BACK of the queue.` })
    } else if (isClosing(c)) {
      if (q.isEmpty()) {
        steps.push({ index: i, char: c, action: 'queue empty ✕', ok: false, structure: [], note: `${tick(c)} arrives but the queue is empty.`, final: true })
        return { strategy: 'queue', kind: 'queue', steps, balanced: false, rejectedAt: i, reason: 'The queue was empty when a closing bracket arrived.' }
      }
      const front = q.front()!
      if (!matches(front.char, c)) {
        steps.push({
          index: i,
          char: c,
          action: `front ${front.char} ≠ ${c} ✕`,
          ok: false,
          structure: contents(),
          compared: 0,
          note: `${tick(c)} is compared with the FRONT of the queue, ${tick(front.char)}: the OLDEST opening bracket, not the most recent one. They do not match, so the queue rejects.`,
          final: true,
        })
        return {
          strategy: 'queue',
          kind: 'queue',
          steps,
          balanced: false,
          rejectedAt: i,
          reason: `FIFO compared ${tick(c)} with the oldest opener ${tick(front.char)}. Nested brackets close newest-first, so a queue looks at the wrong end.`,
        }
      }
      q.dequeue()
      steps.push({ index: i, char: c, action: `dequeue ${front.char}`, ok: true, structure: contents(), compared: 0, note: `${tick(c)} is compared with the FRONT, ${tick(front.char)}. They happen to match, so ${tick(front.char)} leaves the queue.` })
    }
  }
  const balanced = q.isEmpty()
  steps.push({
    index: input.length,
    char: null,
    action: balanced ? 'queue empty → "balanced"' : `${q.size()} left ✕`,
    ok: balanced,
    structure: contents(),
    note: balanced ? 'The queue ended empty, so it says “balanced”.' : `${q.size()} bracket(s) are still in the queue.`,
    final: true,
  })
  return {
    strategy: 'queue',
    kind: 'queue',
    steps,
    balanced,
    reason: balanced ? 'The queue ended empty, so it says “balanced”.' : 'Some brackets were left in the queue.',
  }
}

/** A "stack" that removes from the bottom: effectively FIFO. */
function runPopBottom(input: string): AltResult {
  const items: StackItem[] = []
  const steps: AltStep[] = []
  const contents = () => items.map((i) => i.char)
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (isOpening(c)) {
      items.push({ char: c, index: i })
      steps.push({ index: i, char: c, action: `push ${c}`, ok: true, structure: contents(), note: `${tick(c)} is pushed on top, as usual.` })
    } else if (isClosing(c)) {
      if (items.length === 0) {
        steps.push({ index: i, char: c, action: 'stack empty ✕', ok: false, structure: [], note: `${tick(c)} arrives but the stack is empty.`, final: true })
        return { strategy: 'pop-bottom', kind: 'stack', steps, balanced: false, rejectedAt: i, reason: 'Caught a closing bracket with an empty stack.' }
      }
      const bottom = items[0]
      if (!matches(bottom.char, c)) {
        steps.push({ index: i, char: c, action: `bottom ${bottom.char} ≠ ${c} ✕`, ok: false, structure: contents(), compared: 0, note: `The bug compares ${tick(c)} with the BOTTOM item ${tick(bottom.char)} instead of the top. They do not match.`, final: true })
        return { strategy: 'pop-bottom', kind: 'stack', steps, balanced: false, rejectedAt: i, reason: 'Looked at the oldest bracket instead of the newest one.' }
      }
      items.shift()
      steps.push({ index: i, char: c, action: `remove bottom ${bottom.char}`, ok: true, structure: contents(), compared: 0, note: `The bug removes the BOTTOM item ${tick(bottom.char)}. It matched ${tick(c)} by luck.` })
    }
  }
  const balanced = items.length === 0
  steps.push({ index: input.length, char: null, action: balanced ? 'stack empty → "balanced"' : `${items.length} left ✕`, ok: balanced, structure: contents(), note: balanced ? 'Ended empty, so it says “balanced”.' : `${items.length} left on the stack.`, final: true })
  return { strategy: 'pop-bottom', kind: 'stack', steps, balanced, reason: balanced ? 'Ended empty, so it says “balanced”.' : 'Some brackets were left on the stack.' }
}

/** Stack-based variants with one rule removed. */
function runFaultyStack(input: string, strategy: 'ignore-types' | 'skip-top-check' | 'skip-end-check'): AltResult {
  const stack = new Stack<StackItem>()
  const steps: AltStep[] = []
  const contents = () => stack.toArray().map((i) => i.char)
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (isOpening(c)) {
      stack.push({ char: c, index: i })
      steps.push({ index: i, char: c, action: `push ${c}`, ok: true, structure: contents(), note: `${tick(c)} is pushed on top.` })
      continue
    }
    if (!isClosing(c)) continue

    if (stack.isEmpty()) {
      if (strategy === 'skip-top-check') {
        steps.push({ index: i, char: c, action: 'pop (nothing there)', ok: true, structure: [], note: `The bug pops without looking. The stack is empty, so ${tick(c)} is silently skipped instead of rejected.` })
        continue
      }
      steps.push({ index: i, char: c, action: 'stack empty ✕', ok: false, structure: [], note: `${tick(c)} arrives but the stack is empty, so it is rejected.`, final: true })
      return { strategy, kind: 'stack', steps, balanced: false, rejectedAt: i, reason: 'Caught a closing bracket with an empty stack.' }
    }

    const top = stack.peek()!
    const typeOk = matches(top.char, c)
    if (!typeOk && strategy === 'skip-end-check') {
      steps.push({ index: i, char: c, action: `top ${top.char} ≠ ${c} ✕`, ok: false, structure: contents(), compared: stack.size() - 1, note: `${tick(c)} does not match the top ${tick(top.char)}.`, final: true })
      return { strategy, kind: 'stack', steps, balanced: false, rejectedAt: i, reason: `Wrong bracket type: expected ${tick(closerFor(top.char))}.` }
    }
    stack.pop()
    steps.push({
      index: i,
      char: c,
      action: typeOk ? `pop ${top.char}` : `pop ${top.char} (types ignored)`,
      ok: true,
      structure: contents(),
      compared: stack.size(),
      note: typeOk
        ? `${tick(c)} matches the top ${tick(top.char)}, so it is popped.`
        : strategy === 'ignore-types'
          ? `The bug treats every bracket as the same type, so ${tick(c)} “closes” ${tick(top.char)} even though only ${tick(closerFor(top.char))} should.`
          : `The bug pops without checking the top: ${tick(c)} removes ${tick(top.char)} even though only ${tick(closerFor(top.char))} should.`,
    })
  }

  if (strategy === 'skip-end-check') {
    const left = stack.size()
    steps.push({
      index: input.length,
      char: null,
      action: 'skip isEmpty() → "balanced"',
      ok: true,
      structure: contents(),
      note: left
        ? `The bug never checks isEmpty() at the end, so it says “balanced” although ${left} bracket(s) were never closed.`
        : 'The bug never checks isEmpty() at the end; this time the stack happens to be empty.',
      final: true,
    })
    return { strategy, kind: 'stack', steps, balanced: true, reason: 'Forgot the final isEmpty() check, so unclosed brackets slip through.' }
  }

  const balanced = stack.isEmpty()
  steps.push({ index: input.length, char: null, action: balanced ? 'stack empty → "balanced"' : `${stack.size()} left ✕`, ok: balanced, structure: contents(), note: balanced ? 'The stack ended empty, so it says “balanced”.' : `${stack.size()} bracket(s) left on the stack.`, final: true })
  return { strategy, kind: 'stack', steps, balanced, reason: balanced ? 'The stack ended empty, so it says “balanced”.' : 'Some brackets were left on the stack.' }
}

export interface Divergence {
  /** Character index where the broken run first differs from the correct one. */
  index: number
  /** Position of that step in each run's steps array. */
  correctStep: number
  brokenStep: number
}

/** First point where a broken run behaves differently from the correct one. */
export function findDivergence(correct: AltResult, broken: AltResult): Divergence | null {
  const n = Math.max(correct.steps.length, broken.steps.length)
  for (let i = 0; i < n; i++) {
    const a = correct.steps[i]
    const b = broken.steps[i]
    if (!a || !b) return { index: (a ?? b)!.index, correctStep: Math.min(i, correct.steps.length - 1), brokenStep: Math.min(i, broken.steps.length - 1) }
    const sameStructure = a.structure.join('') === b.structure.join('') || broken.kind === 'counter'
    if (a.index !== b.index || a.ok !== b.ok || !sameStructure || (a.final && b.final && a.ok !== b.ok)) {
      return { index: Math.min(a.index, b.index), correctStep: i, brokenStep: i }
    }
  }
  return correct.balanced === broken.balanced ? null : { index: correct.steps.at(-1)!.index, correctStep: correct.steps.length - 1, brokenStep: broken.steps.length - 1 }
}

/** Inputs (from `candidates`) on which `strategy` gives the wrong verdict. */
export function exposingCases(strategy: StrategyId, candidates: readonly string[]): string[] {
  return candidates.filter((input) => runStrategy(input, strategy).balanced !== runStrategy(input, 'stack').balanced)
}
