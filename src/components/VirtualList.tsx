import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface VirtualListProps {
  count: number
  /** Fixed size of every item in px (height, or width when horizontal). */
  itemSize: number
  horizontal?: boolean
  /** Keep this item visible (scrolls only when it is outside the viewport). */
  scrollToIndex?: number
  renderItem: (index: number, style: CSSProperties) => ReactNode
  className?: string
  style?: CSSProperties
  overscan?: number
  /** Accessible role for the scroll container (e.g. "list"). */
  role?: string
  ariaLabel?: string
}

/**
 * Minimal fixed-size windowing: only the items in view (plus overscan) are in
 * the DOM, so a 10 000-step timeline or table stays smooth.
 */
export function VirtualList({ count, itemSize, horizontal, scrollToIndex, renderItem, className, style, overscan = 6, role, ariaLabel }: VirtualListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [viewport, setViewport] = useState(600)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setViewport(horizontal ? el.clientWidth : el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [horizontal])

  useEffect(() => {
    const el = ref.current
    if (!el || scrollToIndex == null || scrollToIndex < 0) return
    const start = scrollToIndex * itemSize
    const end = start + itemSize
    const pos = horizontal ? el.scrollLeft : el.scrollTop
    const size = horizontal ? el.clientWidth : el.clientHeight
    let target: number | null = null
    if (start < pos) target = Math.max(0, start - itemSize)
    else if (end > pos + size) target = end - size + itemSize
    if (target != null) {
      if (horizontal) el.scrollLeft = target
      else el.scrollTop = target
    }
  }, [scrollToIndex, itemSize, horizontal])

  const first = Math.max(0, Math.floor(offset / itemSize) - overscan)
  const last = Math.min(count - 1, Math.ceil((offset + viewport) / itemSize) + overscan)
  const items: ReactNode[] = []
  for (let i = first; i <= last; i++) {
    items.push(
      renderItem(
        i,
        horizontal
          ? { position: 'absolute', top: 0, bottom: 0, left: i * itemSize, width: itemSize }
          : { position: 'absolute', left: 0, right: 0, top: i * itemSize, height: itemSize },
      ),
    )
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: 'relative', overflow: 'auto', ...style }}
      onScroll={(e) => setOffset(horizontal ? e.currentTarget.scrollLeft : e.currentTarget.scrollTop)}
      role={role}
      aria-label={ariaLabel}
    >
      <div style={horizontal ? { width: count * itemSize, height: '100%', position: 'relative' } : { height: count * itemSize, position: 'relative' }}>{items}</div>
    </div>
  )
}
