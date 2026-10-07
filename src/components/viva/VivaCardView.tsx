import { useId, useState } from 'react'
import type { Confidence } from '../../learning/progress'
import type { VivaCard } from '../../learning/viva'
import { Icon } from '../Icon'
import { RichText } from '../RichText'
import './viva.css'

const LEVELS: Array<{ id: Confidence; label: string }> = [
  { id: 'again', label: 'Need practice' },
  { id: 'unsure', label: 'Almost' },
  { id: 'confident', label: 'Confident' },
]

/** One flip/reveal card. In practice mode the answer stays hidden until revealed, then you self-rate. */
export function VivaCardView({
  card,
  practice,
  confidence,
  onRate,
  compact,
}: {
  card: VivaCard
  practice: boolean
  confidence?: Confidence
  onRate: (c: Confidence) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(!practice && !compact)
  const shown = open
  const uid = useId()
  const id = `viva-${card.id}-${uid.replace(/:/g, '')}`

  return (
    <article className={`vcard2 ${shown ? 'is-open' : ''} ${compact ? 'vcard2--compact' : ''}`} aria-labelledby={`${id}-q`}>
      <header className="vcard2__head">
        <span className="badge">{card.category}</span>
        {confidence && (
          <span className={`badge vconf vconf--${confidence}`}>
            <Icon name={confidence === 'confident' ? 'checkCircle' : confidence === 'unsure' ? 'clock' : 'alert'} />
            {LEVELS.find((l) => l.id === confidence)!.label}
          </span>
        )}
      </header>
      <h3 id={`${id}-q`} className="vcard2__q">
        <RichText text={card.q} />
      </h3>
      <button type="button" className="btn btn--sm vcard2__toggle" aria-expanded={shown} aria-controls={`${id}-a`} onClick={() => setOpen((o) => !o)}>
        <Icon name={shown ? 'eyeOff' : 'eye'} /> {shown ? 'Hide answer' : 'Reveal answer'}
      </button>
      <div id={`${id}-a`} className="vcard2__a" hidden={!shown}>
        {card.a.map((p, i) =>
          p.startsWith('• ') ? (
            <p key={i} className="vcard2__bullet">
              <RichText text={p.slice(2)} />
            </p>
          ) : (
            <p key={i}>
              <RichText text={p} />
            </p>
          ),
        )}
        {card.hook && (
          <p className="vcard2__hook">
            <Icon name="bulb" /> {card.hook}
          </p>
        )}
        {practice && (
          <div className="vcard2__rate" role="group" aria-label="How well did you know it?">
            <span className="small muted">How well did you know it?</span>
            {LEVELS.map((l) => (
              <button key={l.id} type="button" className={`btn btn--sm vrate vrate--${l.id}`} aria-pressed={confidence === l.id} onClick={() => onRate(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
