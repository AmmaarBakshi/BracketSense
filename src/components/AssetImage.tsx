import { useState, type ReactNode } from 'react'
import { assetUrl, type AssetSlot } from '../config/assets'

interface AssetImageProps {
  slot: AssetSlot
  alt: string
  /** Inline SVG used when the slot has no picture (or the picture fails to load). */
  fallback: ReactNode
  className?: string
  /** Eager-load images that are above the fold (hero, logo). */
  eager?: boolean
}

/**
 * Shows the student's picture for `slot` if one exists in public/assets,
 * otherwise the inline SVG fallback. Never stretches: object-fit: contain.
 */
export function AssetImage({ slot, alt, fallback, className, eager }: AssetImageProps) {
  const src = assetUrl(slot)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span className={className ? `art-frame ${className}` : 'art-frame'} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        {fallback}
      </span>
    )
  }

  return (
    <span className={className ? `art-frame ${className}` : 'art-frame'}>
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
    </span>
  )
}
