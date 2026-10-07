import type { StrategyId } from '../core/alternatives'

/** Faulty variants for "Break the Algorithm", and the design rule each one removes. */
export interface Variant {
  id: Exclude<StrategyId, 'stack'>
  name: string
  change: string
  rule: string
}

export const VARIANTS: readonly Variant[] = [
  {
    id: 'counter',
    name: 'Use Counter only',
    change: 'Replace the Stack with a single integer: +1 for every opener, −1 for every closer.',
    rule: 'Remember WHICH brackets are open, not just how many. A count cannot tell `(` from `[`, so crossed pairs slip through.',
  },
  {
    id: 'queue',
    name: 'Use Queue / FIFO',
    change: 'Store openers in a queue and compare each closer with the FRONT (the oldest opener).',
    rule: 'Close the newest opener first (LIFO). Nesting closes inside-out, so the oldest opener is the wrong one to compare with.',
  },
  {
    id: 'ignore-types',
    name: 'Ignore bracket types',
    change: 'Keep the empty-stack check, but let any closer pop any opener.',
    rule: 'A closer must be the SAME type as the top. This is what catches `([)]`.',
  },
  {
    id: 'pop-bottom',
    name: 'Pop the wrong element (bottom)',
    change: 'Compare each closer with the BOTTOM of the stack and remove that instead of the top.',
    rule: 'Always work at the TOP. The top is the most recently opened bracket, the one that must close next.',
  },
  {
    id: 'skip-top-check',
    name: 'Skip the top check',
    change: 'Pop on every closer without peeking first: no empty check, no type check.',
    rule: 'Peek before you pop: the Stack must be non-empty and its top must match. Skipping it accepts `))` and `([)]`.',
  },
  {
    id: 'skip-end-check',
    name: 'Forget the final isEmpty()',
    change: 'Scan correctly, but always answer “balanced” at the end.',
    rule: 'After the scan the Stack must be empty. Otherwise unclosed openers like `((` are never reported.',
  },
]

/** Inputs we try against every variant to find the ones that expose it. */
export const CANDIDATE_CASES: readonly string[] = ['([)]', '{[()]}', '(]', '))', '((', ')(', '[(])', '{[(])}', '()', '([]{})', '(()', '{()}[]']
