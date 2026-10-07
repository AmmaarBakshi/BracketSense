import type { Trace, TraceStep } from '../../core/types'

/** Operation HUD: live counters plus the complexity of this run. */
export function StatsHud({ trace, step, compact }: { trace: Trace; step: TraceStep | null; compact?: boolean }) {
  const c = step?.counters ?? { scanned: 0, processed: 0, ignored: 0, pushes: 0, pops: 0, comparisons: 0, size: 0, maxSize: 0 }
  const n = trace.input.length
  const k = c.maxSize
  const tiles: Array<{ label: string; value: string; hint?: string; tone?: string }> = [
    { label: 'Characters scanned', value: `${c.scanned.toLocaleString()} / ${n.toLocaleString()}` },
    { label: 'Brackets processed', value: c.processed.toLocaleString(), tone: 'brand' },
    { label: 'Ignored', value: c.ignored.toLocaleString() },
    { label: 'Pushes', value: c.pushes.toLocaleString(), tone: 'round' },
    { label: 'Pops', value: c.pops.toLocaleString(), tone: 'square' },
    { label: 'Current stack size', value: c.size.toLocaleString(), tone: 'curly' },
    { label: 'Max stack size', value: k.toLocaleString(), tone: 'curly' },
  ]
  return (
    <div className={`hud ${compact ? 'hud--compact' : ''}`}>
      <dl className="hud__tiles">
        {tiles.map((t) => (
          <div key={t.label} className={`hud__tile ${t.tone ? `hud__tile--${t.tone}` : ''}`}>
            <dt>{t.label}</dt>
            <dd>{t.value}</dd>
          </div>
        ))}
        <div className="hud__tile hud__tile--big">
          <dt>Time</dt>
          <dd>
            O(n) <span className="hud__sub">n = {n.toLocaleString()}</span>
          </dd>
        </div>
        <div className="hud__tile hud__tile--big">
          <dt>Space</dt>
          <dd>
            O(k) <span className="hud__sub">k = {k.toLocaleString()}</span>
          </dd>
        </div>
      </dl>
      {!compact && (
        <p className="hud__note small muted">
          Every character is examined once, so time is <strong>O(n)</strong>. <strong>k</strong> = max number of unmatched opening brackets stored at a
          time, so space is <strong>O(k)</strong>: at most O(n) when every character is an opening bracket, and O(1) when there are no brackets at all.
        </p>
      )}
    </div>
  )
}
