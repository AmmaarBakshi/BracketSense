import { familyOf } from '../../core/bracketRules'

/** A tiny stack picture from a string of brackets (bottom → top). */
export function MiniStack({ chars, label }: { chars: string; label?: string }) {
  const items = [...chars].filter((c) => familyOf(c))
  return (
    <span className="ministack" role="img" aria-label={label ?? (items.length ? `Stack, bottom to top: ${items.join(' ')}` : 'Empty stack')}>
      {items.length === 0 && <span className="ministack__empty">empty</span>}
      {[...items].reverse().map((c, i) => (
        <span key={i} className={`ministack__blk mblk--${familyOf(c)} ${i === 0 ? 'is-top' : ''}`}>
          {c}
        </span>
      ))}
    </span>
  )
}
