import { assetUrl } from '../config/assets'
import type { Achievement } from '../learning/achievements'
import { Icon } from './Icon'
import './art/art.css'

/** Achievement badge: the student's badge picture if provided, otherwise a drawn medal. */
export function Medal({ achievement, locked, large }: { achievement: Achievement; locked?: boolean; large?: boolean }) {
  const src = assetUrl(achievement.badgeSlot)
  const cls = ['medal', `medal--${locked ? 'locked' : achievement.color}`, large ? 'medal--lg' : ''].filter(Boolean).join(' ')
  return (
    <span className={cls} aria-hidden="true">
      {src && !locked ? <img src={src} alt="" loading="lazy" /> : <Icon name={locked ? 'lock' : achievement.icon} />}
    </span>
  )
}
