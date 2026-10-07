import { isBracket } from '../core/bracketRules'
import { seededRandom } from '../core/generators'
import { buildTrace } from '../core/traceEngine'
import type { Operation } from '../core/types'
import type { ConceptId } from './concepts'

/**
 * Quiz bank. Questions about a concrete input compute their answer with the
 * real trace engine, so the quiz can never disagree with the Visualizer.
 *
 * The six CORE questions are always included in a run. The original spec asked
 * for "the six required questions from the original spec", which were not part
 * of the brief, so these six cover what it lists: balanced?, stack top, what
 * happens on a character, first failing character, time complexity, why a stack.
 */

export interface QuizOption {
  id: string
  /** Rich text (backticks mark code). */
  label: string
  /** For "predict the stack": bottom → top characters to draw. */
  stack?: string
}

interface Base {
  id: string
  concept: ConceptId
  core?: boolean
  prompt: string
  /** Input to display (and to draw the Stack picture from). */
  input?: string
  /** Step index whose Stack picture illustrates the answer. */
  pictureStep?: number
  explain: string
}

export interface ChoiceQuestion extends Base {
  kind: 'choice'
  options: QuizOption[]
  answer: string
  /** Keep options in this order (e.g. Balanced / Not balanced). */
  fixedOrder?: boolean
  /** Options are drawn as small stacks. */
  stackOptions?: boolean
}

export interface FirstFailQuestion extends Base {
  kind: 'first-fail'
  input: string
  /** Character index, or input.length for "end of input". */
  answer: number
}

export interface OrderQuestion extends Base {
  kind: 'order'
  /** Items in the correct order. */
  items: string[]
}

export interface FixQuestion extends Base {
  kind: 'fix'
  input: string
  maxChanges: number
}

export type Question = ChoiceQuestion | FirstFailQuestion | OrderQuestion | FixQuestion

const t = (s: string) => '`' + s + '`'

/* ---------------- builders (answers from the engine) ---------------- */

function balancedQ(id: string, input: string, concept: ConceptId, core = false): ChoiceQuestion {
  const tr = buildTrace(input)
  return {
    id,
    kind: 'choice',
    concept,
    core,
    prompt: `Is ${t(input)} balanced?`,
    input,
    pictureStep: tr.verdictStep,
    fixedOrder: true,
    options: [
      { id: 'yes', label: 'Balanced' },
      { id: 'no', label: 'Not balanced' },
    ],
    answer: tr.balanced ? 'yes' : 'no',
    explain: tr.balanced ? 'Every opener is closed by the right partner in reverse order, and the Stack ends empty.' : tr.error!.message,
  }
}

function stackTopQ(id: string, input: string, prefix: number, core = false): ChoiceQuestion {
  const tr = buildTrace(input)
  const step = tr.steps[prefix - 1]
  const top = step.stackAfter[step.stackAfter.length - 1]
  const opts = ['(', '[', '{'].map((c) => ({ id: c, label: t(c) }))
  return {
    id,
    kind: 'choice',
    concept: 'lifo',
    core,
    prompt: `After reading the first ${prefix} characters of ${t(input)}, what is on top of the Stack?`,
    input,
    pictureStep: prefix - 1,
    options: [...opts, { id: 'empty', label: 'Nothing: the Stack is empty' }],
    answer: top ? top.char : 'empty',
    explain: top
      ? `${t(top.char)} was the most recently pushed bracket that has not been popped yet, so it is on top.`
      : 'Every bracket read so far has been matched and popped, so the Stack is empty.',
  }
}

const OP_LABEL: Record<Operation, string> = { PUSH: 'Push', POP: 'Pop', IGNORE: 'Ignore', ERROR: 'Error (reject)', ACCEPT: 'Accept', REJECT: 'Reject' }

function actionQ(id: string, input: string, index: number, core = false): ChoiceQuestion {
  const tr = buildTrace(input)
  const step = tr.steps[index]
  return {
    id,
    kind: 'choice',
    concept: 'algorithm',
    core,
    prompt: `In ${t(input)}, what does the algorithm do at character ${index + 1}, ${t(step.char!)}?`,
    input,
    pictureStep: index,
    fixedOrder: true,
    options: (['PUSH', 'POP', 'IGNORE', 'ERROR'] as Operation[]).map((op) => ({ id: op, label: OP_LABEL[op] })),
    answer: step.operation,
    explain: step.explanation,
  }
}

function firstFailQ(id: string, input: string, core = false): FirstFailQuestion {
  const tr = buildTrace(input)
  const e = tr.error!
  return {
    id,
    kind: 'first-fail',
    concept: 'errors',
    core,
    prompt: `Click the first character where the algorithm knows ${t(input)} is not balanced (or “end of input”).`,
    input,
    pictureStep: tr.verdictStep,
    answer: e.type === 'UNCLOSED_OPENING' ? input.length : e.charIndex,
    explain: e.message,
  }
}

function orderQ(id: string, input: string): OrderQuestion {
  const tr = buildTrace(input)
  const items = tr.steps.filter((s) => s.operation === 'PUSH' || s.operation === 'POP').map((s) => (s.operation === 'PUSH' ? `push ${s.char}` : `pop ${s.top!.char}`))
  return {
    id,
    kind: 'order',
    concept: 'push-pop',
    prompt: `Drag the Stack operations for ${t(input)} into the order they happen.`,
    input,
    pictureStep: tr.steps.length - 2,
    items,
    explain: `Openers are pushed as they are read; each closer pops its partner from the top, so the pops come out in reverse order of the pushes: ${items.join(', ')}.`,
  }
}

function fixQ(id: string, input: string, maxChanges: number): FixQuestion {
  return {
    id,
    kind: 'fix',
    concept: 'errors',
    prompt: `Fix ${t(input)} by changing at most ${maxChanges} character${maxChanges === 1 ? '' : 's'} (keep the same length).`,
    input,
    maxChanges,
    explain: buildTrace(input).error!.message + ' Change the closers so each one matches the bracket on top of the Stack.',
  }
}

function predictStackQ(id: string, input: string, n: number, distractors: string[]): ChoiceQuestion {
  const tr = buildTrace(input)
  const correct = tr.steps[n - 1].stackAfter.map((i) => i.char).join('')
  const options = [correct, ...distractors.filter((d) => d !== correct)].slice(0, 4).map((s, k) => ({ id: `s${k}`, label: s ? `${t(s)} (bottom → top)` : 'empty', stack: s }))
  return {
    id,
    kind: 'choice',
    concept: 'push-pop',
    prompt: `Predict the Stack after the first ${n} characters of ${t(input)}.`,
    input,
    pictureStep: n - 1,
    stackOptions: true,
    options,
    answer: 's0',
    explain: `Run it step by step: ${tr.steps
      .slice(0, n)
      .map((s) => (s.operation === 'PUSH' ? `push ${s.char}` : s.operation === 'POP' ? `pop ${s.top!.char}` : `ignore ${s.char}`))
      .join(', ')}. That leaves ${correct ? t(correct) : 'nothing'} on the Stack.`,
  }
}

function mcq(id: string, concept: ConceptId, prompt: string, options: string[], answer: number, explain: string, core = false): ChoiceQuestion {
  return { id, kind: 'choice', concept, core, prompt, options: options.map((label, i) => ({ id: `o${i}`, label })), answer: `o${answer}`, explain }
}

/* ---------------- the bank ---------------- */

export const CORE: readonly Question[] = [
  balancedQ('core-balanced', '{[()]}', 'algorithm', true),
  stackTopQ('core-top', '([{', 3, true),
  actionQ('core-action', '[()]', 2, true),
  firstFailQ('core-firstfail', '([)]', true),
  mcq(
    'core-time',
    'complexity',
    'What is the time complexity of the balanced-brackets checker for an input of length n?',
    ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    2,
    'Each of the n characters is processed exactly once, and push, pop and peek are O(1). So the whole scan is O(n).',
    true,
  ),
  mcq(
    'core-why',
    'why-stack',
    'Why is a Stack the right data structure for this problem?',
    [
      'It sorts the brackets automatically',
      'Brackets close in reverse order of opening, which is exactly LIFO',
      'It uses less memory than a variable',
      'It compares the oldest bracket first (FIFO)',
    ],
    1,
    'The most recently opened bracket must be closed first. A Stack gives back the last item pushed, so its top is always the bracket that must close next.',
    true,
  ),
]

export const BANK: readonly Question[] = [
  balancedQ('b-crossed', '([)]', 'errors'),
  balancedQ('b-code', 'a[i] = (b + c) * {d - e}', 'algorithm'),
  balancedQ('b-unclosed', '{[]}(', 'errors'),
  balancedQ('b-siblings', '{[]}()', 'algorithm'),
  stackTopQ('t-1', '{[()', 4),
  stackTopQ('t-2', '()[]', 4),
  stackTopQ('t-3', '(([', 3),
  actionQ('a-ignore', 'f(x)', 0),
  actionQ('a-error', '{[(])}', 3),
  actionQ('a-push', 'x = [y]', 4),
  actionQ('a-unmatched', ')(', 0),
  firstFailQ('f-1', '{[(])}'),
  firstFailQ('f-2', '())('),
  firstFailQ('f-3', '(()'),
  orderQ('o-1', '([])'),
  orderQ('o-2', '{()}[]'),
  fixQ('x-1', '([)]', 2),
  fixQ('x-2', '{[}]', 2),
  fixQ('x-3', '(]', 1),
  predictStackQ('p-1', '{[()]}', 4, ['{[(', '{(', '{[', '[(']),
  predictStackQ('p-2', '([]{', 4, ['([{', '(', '({', '{']),
  predictStackQ('p-3', '(a[b)', 4, ['([', '(a[', '(', '[']),
  mcq('m-space', 'complexity', 'What is the worst-case space complexity, and for which input?', ['O(1), for `()()()`', 'O(n), when every character is an opening bracket like `((((`', 'O(n²), for nested code', 'O(log n), for balanced input'], 1, 'Only unmatched openers are stored. If every character is an opener, all n of them sit on the Stack at once.'),
  mcq('m-best', 'complexity', 'When does the checker need only O(1) extra space?', ['When the input is very long', 'When the input has no bracket characters at all', 'When the input is unbalanced', 'Never'], 1, 'With no brackets nothing is ever pushed, so the Stack stays empty: constant extra space (report §7.2).'),
  mcq('m-peek', 'push-pop', 'What does peek() return?', ['The bottom element, removing it', 'The top element, without removing it', 'The number of elements', 'true if the stack is empty'], 1, 'peek() (or top()) lets the checker compare a closer with the top before deciding to pop.'),
  mcq('m-lifo', 'lifo', 'LIFO means…', ['Last In, First Out', 'Last In, Final Output', 'List In, First Out', 'Linear Input, Fast Output'], 0, 'Last In, First Out: the newest element is removed first, like the top plate of a pile.'),
  mcq('m-counter', 'alternatives', 'Why does a single counter wrongly accept `([)]`?', ['It overflows', 'It knows how many brackets are open, but not their type or order', 'It counts closers twice', 'It cannot read square brackets'], 1, 'The counter goes 1, 2, 1, 0 and ends at zero, so it says balanced. It never checks WHICH bracket a closer is closing.'),
  mcq('m-queue', 'alternatives', 'On `{[()]}`, why does a Queue reject a valid string?', ['The queue is full', 'It compares `)` with the FRONT, `{`, the oldest opener', 'It ignores curly braces', 'It pops twice'], 1, 'FIFO hands back the oldest opener first, but nesting closes the newest first. The very first closer is compared with the wrong bracket.'),
  mcq('m-isempty', 'algorithm', 'When does the algorithm call isEmpty()?', ['Only at the start', 'Before matching a closer, and once more at the end of the input', 'After every push', 'Never'], 1, 'During the scan it catches a closer with nothing to match; at the end it confirms no opener was left unclosed.'),
  mcq('m-unclosed', 'errors', 'Which error does `{[]` produce?', ['Wrong bracket type', 'Unmatched closing bracket', 'Unclosed opening brackets: 1 remains', 'None, it is balanced'], 2, '`[` is pushed and popped by `]`, but `{` is never closed, so it is still on the Stack at the end.'),
  mcq('m-editors', 'why-stack', 'Which editor feature is powered by the same Stack logic (report §8.1)?', ['Spell checking', 'Bracket highlighting and code folding', 'Syntax colouring of keywords', 'Auto-save'], 1, 'The matched pairs found by the Stack drive bracket-pair highlighting, red error underlines, auto-indentation and folding ranges.'),
]

export const QUIZ_LENGTH = 10

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** A run: the 6 core questions + 4 from the bank, in random order, with shuffled options. */
export function buildQuizRun(seed = Date.now()): Question[] {
  const rand = seededRandom(seed)
  const extra = shuffle(BANK, rand).slice(0, QUIZ_LENGTH - CORE.length)
  return shuffle([...CORE, ...extra], rand).map((q) => (q.kind === 'choice' && !q.fixedOrder ? { ...q, options: shuffle(q.options, rand) } : q))
}

/* ---------------- grading ---------------- */

export function gradeChoice(q: ChoiceQuestion, chosen: string): boolean {
  return q.answer === chosen
}

export function gradeFirstFail(q: FirstFailQuestion, index: number): boolean {
  return q.answer === index
}

export function gradeOrder(q: OrderQuestion, order: readonly string[]): boolean {
  return order.length === q.items.length && order.every((x, i) => x === q.items[i])
}

export function gradeFix(q: FixQuestion, attempt: string): { ok: boolean; reason: string } {
  if (attempt.length !== q.input.length) return { ok: false, reason: `Keep the same length (${q.input.length} characters).` }
  let changes = 0
  for (let i = 0; i < attempt.length; i++) if (attempt[i] !== q.input[i]) changes++
  if (changes > q.maxChanges) return { ok: false, reason: `You changed ${changes} characters; at most ${q.maxChanges} allowed.` }
  if ([...attempt].some((c) => !isBracket(c)) && [...q.input].every(isBracket)) return { ok: false, reason: 'Use bracket characters only.' }
  const tr = buildTrace(attempt)
  if (!tr.balanced) return { ok: false, reason: tr.error!.message }
  return { ok: true, reason: 'Balanced, within the allowed changes.' }
}
