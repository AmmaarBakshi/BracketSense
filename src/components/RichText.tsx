import { Fragment, type ReactNode } from 'react'
import { familyOf } from '../core/bracketRules'

/** A single character as a coloured chip: ( ) coral, [ ] teal, { } amber, others neutral. */
export function Glyph({ char, className, title }: { char: string; className?: string; title?: string }) {
  const family = familyOf(char) ?? (char.length === 1 ? 'ignored' : null)
  const cls = ['bglyph', family ? `bglyph--${family}` : '', className ?? ''].filter(Boolean).join(' ')
  const shown = char === ' ' ? '␠' : char === '\n' ? '↵' : char === '\t' ? '⇥' : char
  return (
    <code className={cls} title={title}>
      {shown}
    </code>
  )
}

/**
 * Renders explanation text from the core, where `x` (backticks) marks code.
 * Single bracket characters become coloured glyph chips.
 */
export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split('`')
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          part.length === 1 ? (
            <Glyph key={i} char={part} />
          ) : (
            <code key={i} className="bglyph-run">
              {[...part].map((c, j) => (familyOf(c) ? <span key={j} className={`ctext--${familyOf(c)}`}>{c}</span> : <Fragment key={j}>{c}</Fragment>))}
            </code>
          )
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

/** Colour every bracket in a code string (no chips): for inline inputs and tables. */
export function ColoredCode({ text, className }: { text: string; className?: string }) {
  return (
    <code className={className ?? 'code-inline'}>
      {[...text].map((c, i) => {
        const f = familyOf(c)
        return f ? (
          <span key={i} className={`ctext--${f} br-strong`}>
            {c}
          </span>
        ) : (
          <Fragment key={i}>{c}</Fragment>
        )
      })}
    </code>
  )
}
