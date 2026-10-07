import type { Operation } from '../../core/types'
import { Icon, type IconName } from '../Icon'

const OPS: Record<Operation, { label: string; icon: IconName; tone: string }> = {
  PUSH: { label: 'PUSH', icon: 'arrowDown', tone: 'brand' },
  POP: { label: 'POP', icon: 'arrowUp', tone: 'success' },
  IGNORE: { label: 'IGNORE', icon: 'minus', tone: '' },
  ERROR: { label: 'ERROR', icon: 'xCircle', tone: 'error' },
  ACCEPT: { label: 'BALANCED', icon: 'checkCircle', tone: 'success' },
  REJECT: { label: 'NOT BALANCED', icon: 'xCircle', tone: 'error' },
}

export const OP_ICON: Record<Operation, IconName> = Object.fromEntries(Object.entries(OPS).map(([k, v]) => [k, v.icon])) as Record<Operation, IconName>

/** Operation label with icon + text (never colour alone). */
export function OpBadge({ op }: { op: Operation }) {
  const o = OPS[op]
  return (
    <span className={`badge ${o.tone ? `badge--${o.tone}` : ''}`}>
      <Icon name={o.icon} />
      {o.label}
    </span>
  )
}
