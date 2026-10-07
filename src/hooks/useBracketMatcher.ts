import { useMemo, useState } from 'react'
import { buildPairMap, describeMatch, type MatchInfo } from '../core/matcher'

/** Hover/click matching for an editor: the bracket in focus and its partner. */
export function useBracketMatcher(input: string) {
  const map = useMemo(() => buildPairMap(input), [input])
  const [focus, setFocus] = useState<number | null>(null)
  const info: MatchInfo | null = focus != null && focus < input.length ? describeMatch(input, map, focus) : null
  const pair = info ? (info.partner !== undefined ? [info.index, info.partner] : [info.index]) : null
  return { map, info, pair, setFocus }
}
