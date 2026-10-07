/**
 * Algorithm 1 from the report ("Balanced Parentheses Checker using Stack").
 *
 * One deliberate difference from the report's listing: the report pops first
 * (`top ← pop(St)`) and then compares. Here we peek first and pop only on a
 * match, which is what the report's section 6.1 describes ("calls peek() to
 * check the top element and pop() to remove it if it matches"). The verdict is
 * identical; peeking keeps the mismatched top visible on the Stack when an
 * error is shown. Lines 16-18 make the report's implicit "ignore" branch explicit.
 */

export interface PseudoLine {
  n: number
  text: string
  indent: number
  comment?: string
}

export const PSEUDOCODE: readonly PseudoLine[] = [
  { n: 1, text: 'Input: String S of length n', indent: 0 },
  { n: 2, text: 'Output: true if balanced, false otherwise', indent: 0 },
  { n: 3, text: 'Initialize an empty stack St', indent: 0 },
  { n: 4, text: 'for each character c in S do', indent: 0 },
  { n: 5, text: 'if c is an opening bracket then', indent: 1 },
  { n: 6, text: 'push(St, c)', indent: 2 },
  { n: 7, text: 'else if c is a closing bracket then', indent: 1 },
  { n: 8, text: 'if St is empty then', indent: 2 },
  { n: 9, text: 'return false', indent: 3, comment: 'closing bracket with nothing to match' },
  { n: 10, text: 'end if', indent: 2 },
  { n: 11, text: 'top ← peek(St)', indent: 2 },
  { n: 12, text: 'if top does not match c then', indent: 2 },
  { n: 13, text: 'return false', indent: 3, comment: 'wrong bracket type' },
  { n: 14, text: 'end if', indent: 2 },
  { n: 15, text: 'pop(St)', indent: 2, comment: 'pair matched' },
  { n: 16, text: 'else', indent: 1 },
  { n: 17, text: 'ignore c', indent: 2, comment: 'not a bracket' },
  { n: 18, text: 'end if', indent: 1 },
  { n: 19, text: 'end for', indent: 0 },
  { n: 20, text: 'if St is empty then', indent: 0 },
  { n: 21, text: 'return true', indent: 1, comment: 'balanced' },
  { n: 22, text: 'else', indent: 0 },
  { n: 23, text: 'return false', indent: 1, comment: 'unclosed opening bracket(s) remain' },
  { n: 24, text: 'end if', indent: 0 },
]

/** Lines executed for each kind of step (last entry is the "current" line). */
export const PSEUDO_PATHS = {
  PUSH: [4, 5, 6],
  POP: [4, 5, 7, 8, 11, 12, 15],
  WRONG_TYPE: [4, 5, 7, 8, 11, 12, 13],
  UNMATCHED_CLOSING: [4, 5, 7, 8, 9],
  IGNORE: [4, 5, 7, 16, 17],
  ACCEPT: [19, 20, 21],
  REJECT: [19, 20, 22, 23],
} as const satisfies Record<string, readonly number[]>
