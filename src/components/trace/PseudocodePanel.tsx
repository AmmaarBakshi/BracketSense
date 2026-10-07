import { useEffect, useRef, type ReactNode } from 'react'
import { PSEUDOCODE } from '../../core/pseudocode'
import type { TraceStep } from '../../core/types'

/** Algorithm 1 from the report, with the executed lines of the current step highlighted. */
export function PseudocodePanel({ step, compact }: { step: TraceStep | null; compact?: boolean }) {
  const current = step?.pseudocodeLine ?? 3
  const path = new Set(step?.pseudocodeLines ?? [1, 2, 3])
  const box = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-current="step"]')
    const list = box.current
    if (!el || !list || list.scrollHeight <= list.clientHeight) return
    const top = el.offsetTop - list.clientHeight / 2
    list.scrollTo({ top, behavior: 'smooth' })
  }, [current])

  return (
    <ol ref={box} className={`pseudo ${compact ? 'pseudo--compact' : ''}`} aria-label="Pseudocode (report Algorithm 1)">
      {PSEUDOCODE.map((line) => {
        const isCurrent = line.n === current
        const onPath = path.has(line.n)
        return (
          <li
            key={line.n}
            className={['pseudo__line', isCurrent ? 'is-current' : '', onPath && !isCurrent ? 'is-path' : ''].filter(Boolean).join(' ')}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="pseudo__n" aria-hidden="true">
              {line.n}
            </span>
            <span className="pseudo__code" style={{ paddingLeft: `${line.indent * 1.4}em` }}>
              <Keywords text={line.text} />
              {line.comment && <span className="pseudo__comment"> ▷ {line.comment}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const KW = /\b(for each|for|do|if|then|else if|else|end if|end for|return|true|false|Input|Output|Initialize)\b/g

function Keywords({ text }: { text: string }) {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(KW)) {
    if (m.index! > last) out.push(text.slice(last, m.index))
    out.push(
      <span key={m.index} className="pseudo__kw">
        {m[0]}
      </span>,
    )
    last = m.index! + m[0].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}
