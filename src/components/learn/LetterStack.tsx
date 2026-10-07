import { familyOf } from '../../core/bracketRules'
import { Icon } from '../Icon'
import '../StackView.css'

export interface LetterItem {
  id: number
  label: string
}

const COLOR_BY_LETTER: Record<string, string> = { A: 'round', B: 'square', C: 'curly', D: 'round', E: 'square', F: 'curly' }

function colorOf(label: string): string {
  return familyOf(label) ?? COLOR_BY_LETTER[label] ?? 'round'
}

/** Generic stack drawing for Learn widgets (items bottom → top). */
export function LetterStack({
  items,
  capacity,
  popped,
  peeking,
  justPushed,
}: {
  items: readonly LetterItem[]
  capacity?: number
  popped?: LetterItem | null
  peeking?: boolean
  justPushed?: number | null
}) {
  const topFirst = [...items].reverse()
  return (
    <div className="lstack">
      <div className="lstack__well" role="img" aria-label={items.length ? `Stack, top first: ${topFirst.map((i) => i.label).join(', ')}` : 'Empty stack'}>
        {popped && (
          <div className="lstack__ghost" key={`g${popped.id}`} aria-hidden="true">
            <span className={`sblock sblock--${colorOf(popped.label)} is-leaving`}>
              <span className="sblock__glyph">{popped.label}</span>
            </span>
          </div>
        )}
        <ol className="lstack__list">
          {topFirst.map((item, i) => (
            <li
              key={item.id}
              className={[
                'sblock',
                `sblock--${colorOf(item.label)}`,
                i === 0 ? 'is-top' : '',
                i === 0 && justPushed === item.id ? 'is-entering' : '',
                i === 0 && peeking ? 'is-peek' : '',
              ].join(' ')}
            >
              {i === 0 && (
                <span className="sblock__top" aria-hidden="true">
                  TOP <Icon name="arrowRight" />
                </span>
              )}
              <span className="sblock__glyph">{item.label}</span>
              {i === 0 && peeking && <span className="lstack__peek">peek</span>}
            </li>
          ))}
        </ol>
        {items.length === 0 && <span className="lstack__empty muted small">empty</span>}
      </div>
      <div className="lstack__meta small muted">
        size {items.length}
        {capacity ? ` / capacity ${capacity}` : ''}
      </div>
    </div>
  )
}
