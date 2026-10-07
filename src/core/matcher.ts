import { closerFor, isClosing, isOpening, matches, openerFor } from './bracketRules'
import { Stack } from './Stack'
import type { StackItem } from './types'

export type BracketStatus = 'matched' | 'unclosed' | 'unmatched' | 'mismatch'

export interface PairMap {
  /** bracket index -> partner index (both directions) */
  partner: ReadonlyMap<number, number>
  /** bracket index -> status */
  status: ReadonlyMap<number, BracketStatus>
  /** bracket index -> nesting depth (0 = outermost), used for pair colouring */
  depth: ReadonlyMap<number, number>
  /** For a mismatched closer: the index of the opener it was compared with. */
  comparedWith: ReadonlyMap<number, number>
  pairs: ReadonlyArray<readonly [number, number]>
}

/**
 * Pair map for hover/click matching. Uses the same Stack logic as the
 * validator: push openers, a closer matches the top only if the types agree.
 * Unlike the validator it keeps going after a problem so every bracket in the
 * document gets a status (like an editor): a closer that does not match the top
 * is flagged and skipped, leaving the stack untouched.
 */
export function buildPairMap(input: string): PairMap {
  const stack = new Stack<StackItem>()
  const partner = new Map<number, number>()
  const status = new Map<number, BracketStatus>()
  const depth = new Map<number, number>()
  const comparedWith = new Map<number, number>()
  const pairs: Array<readonly [number, number]> = []

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (isOpening(c)) {
      depth.set(i, stack.size())
      stack.push({ char: c, index: i })
    } else if (isClosing(c)) {
      const top = stack.peek()
      if (!top) {
        status.set(i, 'unmatched')
        depth.set(i, 0)
      } else if (matches(top.char, c)) {
        stack.pop()
        partner.set(i, top.index)
        partner.set(top.index, i)
        status.set(i, 'matched')
        status.set(top.index, 'matched')
        depth.set(i, stack.size())
        pairs.push([top.index, i])
      } else {
        status.set(i, 'mismatch')
        comparedWith.set(i, top.index)
        depth.set(i, stack.size())
      }
    }
  }
  for (const item of stack.toArray()) status.set(item.index, 'unclosed')

  return { partner, status, depth, comparedWith, pairs }
}

export interface MatchInfo {
  index: number
  char: string
  partner?: number
  status: BracketStatus
  ok: boolean
  /** "✓ Matching pair found" / "⚠ No matching bracket" */
  headline: string
  detail: string
}

/** Describe the bracket at `index` (or null when it is not a bracket). */
export function describeMatch(input: string, map: PairMap, index: number): MatchInfo | null {
  const c = input[index]
  const status = map.status.get(index)
  if (!c || !status) return null
  const partner = map.partner.get(index)

  if (status === 'matched' && partner !== undefined) {
    return {
      index,
      char: c,
      partner,
      status,
      ok: true,
      headline: '✓ Matching pair found',
      detail: isOpening(c) ? `\`${c}\` is closed by \`${input[partner]}\`.` : `\`${c}\` closes \`${input[partner]}\`.`,
    }
  }
  if (status === 'unclosed' && isOpening(c)) {
    return {
      index,
      char: c,
      status,
      ok: false,
      headline: '⚠ No matching bracket',
      detail: `\`${c}\` is never closed. It needs a \`${closerFor(c)}\`.`,
    }
  }
  if (status === 'mismatch' && isClosing(c)) {
    const top = map.comparedWith.get(index)
    const topChar = top !== undefined ? input[top] : undefined
    return {
      index,
      char: c,
      partner: top,
      status,
      ok: false,
      headline: '⚠ No matching bracket',
      detail: topChar
        ? `\`${c}\` arrives while \`${topChar}\` is on top of the Stack. Expected \`${isOpening(topChar) ? closerFor(topChar) : '?'}\`.`
        : `\`${c}\` does not match the bracket on top of the Stack.`,
    }
  }
  return {
    index,
    char: c,
    status,
    ok: false,
    headline: '⚠ No matching bracket',
    detail: isClosing(c) ? `\`${c}\` has no \`${openerFor(c)}\` waiting for it: the Stack was empty.` : `\`${c}\` is never closed.`,
  }
}
