import type { CloseBracket } from './bracketRules'
import type { StackItem } from './types'

/** Wrap a character in backticks so the UI renders it as a coloured code chip. */
export function tick(c: string): string {
  if (c === '`') return 'backtick'
  if (c === ' ') return 'a space'
  if (c === '\n') return 'a newline'
  if (c === '\t') return 'a tab'
  if (c === '\r') return 'a carriage return'
  return '`' + c + '`'
}

export function wrongTypeMessage(expected: CloseBracket, found: string, top: string): string {
  return `Wrong bracket type. Expected ${tick(expected)}, found ${tick(found)}. The top of the Stack is ${tick(top)}.`
}

export const UNMATCHED_CLOSING_MESSAGE = 'Unmatched closing bracket. The Stack is empty, so there is nothing to match this character.'

export function unclosedMessage(remaining: readonly StackItem[]): string {
  const list = remaining.map((item) => tick(item.char)).join(', ')
  return `Unclosed opening brackets. ${remaining.length} bracket(s) remain in the Stack: ${list}.`
}

/** Strip backticks for plain-text contexts (live regions, titles). */
export function plain(text: string): string {
  return text.replace(/`([^`]*)`/g, '$1')
}
