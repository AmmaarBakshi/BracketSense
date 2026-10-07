/**
 * Bracket rules for the three families the report handles: ( ) [ ] { }.
 * Every other character is "ignored" by the algorithm (but still counted).
 */

export type OpenBracket = '(' | '[' | '{'
export type CloseBracket = ')' | ']' | '}'
export type Bracket = OpenBracket | CloseBracket

/** Colour family used across the UI: ( ) coral, [ ] teal, { } amber. */
export type BracketFamily = 'round' | 'square' | 'curly'

export const OPENING: readonly OpenBracket[] = ['(', '[', '{']
export const CLOSING: readonly CloseBracket[] = [')', ']', '}']

/** opening -> closing */
export const PAIRS: Readonly<Record<OpenBracket, CloseBracket>> = { '(': ')', '[': ']', '{': '}' }

/** closing -> opening */
export const OPENER_OF: Readonly<Record<CloseBracket, OpenBracket>> = { ')': '(', ']': '[', '}': '{' }

const FAMILY: Readonly<Record<Bracket, BracketFamily>> = {
  '(': 'round',
  ')': 'round',
  '[': 'square',
  ']': 'square',
  '{': 'curly',
  '}': 'curly',
}

export const FAMILY_NAME: Readonly<Record<BracketFamily, string>> = {
  round: 'parenthesis',
  square: 'square bracket',
  curly: 'curly brace',
}

export function isOpening(c: string): c is OpenBracket {
  return c === '(' || c === '[' || c === '{'
}

export function isClosing(c: string): c is CloseBracket {
  return c === ')' || c === ']' || c === '}'
}

export function isBracket(c: string): c is Bracket {
  return isOpening(c) || isClosing(c)
}

/** True when `close` is the correct closing bracket for `open`. */
export function matches(open: string, close: string): boolean {
  return isOpening(open) && PAIRS[open] === close
}

export function closerFor(open: OpenBracket): CloseBracket {
  return PAIRS[open]
}

export function openerFor(close: CloseBracket): OpenBracket {
  return OPENER_OF[close]
}

export function familyOf(c: string): BracketFamily | null {
  return isBracket(c) ? FAMILY[c] : null
}

/** Human-readable name of a character for explanations (spaces, tabs and newlines are invisible otherwise). */
export function describeChar(c: string): string {
  if (c === ' ') return 'space'
  if (c === '\n') return 'newline'
  if (c === '\r') return 'carriage return'
  if (c === '\t') return 'tab'
  return c
}
