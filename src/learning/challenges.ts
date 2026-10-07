import { isBracket } from '../core/bracketRules'
import { buildTrace } from '../core/traceEngine'
import type { ConceptId } from './concepts'

export type ChallengeLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
export type ChallengeKind = 'trace' | 'build' | 'bug'

export const LEVELS: ReadonlyArray<{ id: ChallengeLevel; label: string; points: number; color: 'square' | 'curly' | 'round' | 'brand' | 'success' }> = [
  { id: 'beginner', label: 'Beginner', points: 10, color: 'success' },
  { id: 'easy', label: 'Easy', points: 20, color: 'square' },
  { id: 'medium', label: 'Medium', points: 30, color: 'curly' },
  { id: 'hard', label: 'Hard', points: 40, color: 'round' },
  { id: 'expert', label: 'Expert', points: 50, color: 'brand' },
]

interface BaseChallenge {
  id: string
  level: ChallengeLevel
  title: string
  kind: ChallengeKind
  intro: string
  hints: [string, string]
  concept: ConceptId
}

/** Predict the verdict, then locate the failing bracket (or the max stack size if balanced). */
export interface TraceChallenge extends BaseChallenge {
  kind: 'trace'
  input: string
}

export interface BuildConstraint {
  id: string
  label: string
  test: (input: string) => boolean
}

/** Type a string that satisfies every constraint. */
export interface BuildChallenge extends BaseChallenge {
  kind: 'build'
  constraints: BuildConstraint[]
  placeholder: string
}

/** Fix a broken snippet by changing brackets only. */
export interface BugChallenge extends BaseChallenge {
  kind: 'bug'
  language: string
  code: string
}

export type Challenge = TraceChallenge | BuildChallenge | BugChallenge

const has = (s: string, chars: string) => [...chars].every((c) => s.includes(c))

export const CHALLENGES: readonly Challenge[] = [
  {
    id: 'b1',
    level: 'beginner',
    kind: 'trace',
    title: 'Round pair',
    input: '()',
    concept: 'push-pop',
    intro: 'The smallest possible bracket pair. Predict, then watch the Stack.',
    hints: ['An opening bracket is pushed; its closer pops it.', 'Is anything left on the Stack at the end?'],
  },
  {
    id: 'b2',
    level: 'beginner',
    kind: 'trace',
    title: 'Square pair',
    input: '[]',
    concept: 'push-pop',
    intro: 'Same idea with square brackets.',
    hints: ['`[` is pushed, then `]` is compared with the top.', 'The top is `[` and the closer is `]`: same type.'],
  },
  {
    id: 'b3',
    level: 'beginner',
    kind: 'trace',
    title: 'Curly pair',
    input: '{}',
    concept: 'push-pop',
    intro: 'And with curly braces.',
    hints: ['One push, one pop.', 'An empty Stack at the end means balanced.'],
  },
  {
    id: 'e1',
    level: 'easy',
    kind: 'trace',
    title: 'One inside another',
    input: '([])',
    concept: 'lifo',
    intro: 'Your first nesting: a square pair inside a round pair.',
    hints: ['The inner pair must close before the outer one.', 'How many brackets are on the Stack right before the first closer?'],
  },
  {
    id: 'e2',
    level: 'easy',
    kind: 'trace',
    title: 'Wrong partner',
    input: '(]',
    concept: 'errors',
    intro: 'Two brackets. Do they belong together?',
    hints: ['What is on top of the Stack when `]` arrives?', 'Only `)` can close `(`.'],
  },
  {
    id: 'm1',
    level: 'medium',
    kind: 'trace',
    title: 'The report example',
    input: '{[()]}',
    concept: 'algorithm',
    intro: 'The exact string traced in the project report (Figure 1).',
    hints: ['Three openers are pushed before anything closes.', 'Closers arrive in reverse order of the openers: LIFO.'],
  },
  {
    id: 'm2',
    level: 'medium',
    kind: 'trace',
    title: 'Crossed wires',
    input: '{[(])}',
    concept: 'errors',
    intro: 'Looks almost nested. Find where it goes wrong.',
    hints: ['Track the top of the Stack after each opener.', 'When `]` arrives, the top is `(`.'],
  },
  {
    id: 'm3',
    level: 'medium',
    kind: 'build',
    title: 'Build a balanced string',
    concept: 'lifo',
    intro: 'Type a bracket string that meets every rule. The checks update as you type.',
    placeholder: 'e.g. ( [ ... ] )',
    hints: ['Nest three different openers, then close them in reverse order.', 'Try something like `{[()]}`, then add another pair beside it.'],
    constraints: [
      { id: 'balanced', label: 'It is balanced', test: (s) => s.length > 0 && buildTrace(s).balanced },
      { id: 'types', label: 'It uses ( ), [ ] and { }', test: (s) => has(s, '()[]{}') },
      { id: 'depth', label: 'Maximum stack size is exactly 3', test: (s) => buildTrace(s).counters.maxSize === 3 },
      { id: 'length', label: 'It has at least 8 brackets', test: (s) => [...s].filter(isBracket).length >= 8 },
    ],
  },
  {
    id: 'h1',
    level: 'hard',
    kind: 'trace',
    title: 'Four deep',
    input: '{[({})]}',
    concept: 'lifo',
    intro: 'Four levels of nesting with a repeated brace.',
    hints: ['The inner `{` and the outer `{` are different stack items.', 'Count the openers before the first closer.'],
  },
  {
    id: 'h2',
    level: 'hard',
    kind: 'trace',
    title: 'One too many',
    input: '([]{()})]',
    concept: 'errors',
    intro: 'Everything looks fine… until the very end?',
    hints: ['Trace to the 8th character: what does the Stack look like?', 'A closer that arrives when the Stack is empty has nothing to match.'],
  },
  {
    id: 'h3',
    level: 'hard',
    kind: 'bug',
    title: 'Find the bug: JavaScript',
    language: 'JavaScript',
    concept: 'errors',
    intro: 'This function does not compile. Fix it by changing brackets only.',
    hints: ['Run the checker in your head: where does the first mismatch appear?', 'Array indexing uses square brackets: `nums[i]`.'],
    code: `function average(nums) {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i);
  }
  return total / nums.length;
}`,
  },
  {
    id: 'x1',
    level: 'expert',
    kind: 'trace',
    title: 'Deep and wide',
    input: '{[()()]([{}])}{[()]}',
    concept: 'algorithm',
    intro: 'Twenty brackets, siblings and nesting mixed together.',
    hints: ['The Stack grows and shrinks several times.', 'The deepest point is inside `([{}])`.'],
  },
  {
    id: 'x2',
    level: 'expert',
    kind: 'trace',
    title: 'Real code: nested loops in C',
    input: `int sum2d(int a[3][3]) {
  int s = 0;
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      s += a[i][j];
    }
  return s;
}`,
    concept: 'errors',
    intro: 'A C function with nested loops. Only the brackets matter.',
    hints: ['Count the `{` and `}` per line.', 'A loop body was never closed, so something is left on the Stack at the end.'],
  },
  {
    id: 'x3',
    level: 'expert',
    kind: 'bug',
    title: 'Find the bug: Python (from the report)',
    language: 'Python',
    concept: 'errors',
    intro: 'The report’s editor example, with a typo. Fix it by changing brackets only.',
    hints: ['Something is opened and never closed.', 'Look at the indexing at the end of line 2.'],
    code: `def calculate(a, b):
    result = (a + b) * [1, 2, 3][0
    return result`,
  },
]

export const CHALLENGE_COUNT = CHALLENGES.length

export function levelOf(id: ChallengeLevel) {
  return LEVELS.find((l) => l.id === id)!
}

/** Points after attempts and hints: -25% per extra attempt, -20% per hint, never below 25%. */
export function scoreFor(base: number, attempts: number, hintsUsed: number): number {
  const factor = Math.max(0.25, 1 - 0.25 * Math.max(0, attempts - 1) - 0.2 * hintsUsed)
  return Math.round(base * factor)
}

export function starsFor(attempts: number, hintsUsed: number): number {
  if (attempts <= 1 && hintsUsed === 0) return 3
  if (attempts <= 2 && hintsUsed <= 1) return 2
  return 1
}

/** A bug fix is valid when it is balanced and only bracket characters changed. */
export function checkBugFix(original: string, attempt: string): { ok: boolean; reason: string } {
  const strip = (s: string) => [...s].filter((c) => !isBracket(c)).join('').replace(/\s+/g, ' ').trim()
  const t = buildTrace(attempt)
  if (strip(original) !== strip(attempt)) return { ok: false, reason: 'Only bracket characters may change. Some other text was edited.' }
  if (!t.balanced) return { ok: false, reason: t.error!.message }
  return { ok: true, reason: 'Balanced, and only brackets changed.' }
}
