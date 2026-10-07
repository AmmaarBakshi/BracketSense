import { useMemo, useState } from 'react'
import { familyOf } from '../../core/bracketRules'
import type { Trace, TraceStep } from '../../core/types'
import { Icon } from '../Icon'
import { Glyph, RichText } from '../RichText'
import { VirtualList } from '../VirtualList'
import { OpBadge } from './OpBadge'

type Row = { kind: 'step'; i: number } | { kind: 'group'; from: number; to: number }

const ROW_H = 44
const COL_W = 96

function stackText(s: TraceStep): string {
  const chars = s.after.size > 40 ? '…' + s.after.topItems(39).reverse().map((i) => i.char).join('') : s.stackAfter.map((i) => i.char).join('')
  return chars || '∅'
}

/** Trace as a table (Step | Character | Decision | Action | Stack) or as a strip of mini stacks. */
export function TracePanel({ trace, index, onJump }: { trace: Trace; index: number; onJump: (i: number) => void }) {
  const [view, setView] = useState<'table' | 'visual'>('table')
  const [showIgnored, setShowIgnored] = useState(false)
  const ignoredCount = trace.counters.ignored

  // Table rows: runs of ignored characters collapse into one row unless shown.
  const rows = useMemo<Row[]>(() => {
    if (showIgnored) return trace.steps.map((_, i) => ({ kind: 'step', i }))
    const out: Row[] = []
    trace.steps.forEach((s, i) => {
      if (s.operation !== 'IGNORE') out.push({ kind: 'step', i })
      else {
        const prev = out[out.length - 1]
        if (prev && prev.kind === 'group' && prev.to === i - 1) prev.to = i
        else out.push({ kind: 'group', from: i, to: i })
      }
    })
    return out
  }, [trace, showIgnored])

  const rowOf = useMemo(() => {
    const map = new Int32Array(trace.steps.length)
    rows.forEach((r, ri) => {
      if (r.kind === 'step') map[r.i] = ri
      else for (let i = r.from; i <= r.to; i++) map[i] = ri
    })
    return map
  }, [rows, trace])

  // Visual strip: bracket steps (and ignored ones when shown).
  const cols = useMemo(() => trace.steps.map((_, i) => i).filter((i) => showIgnored || trace.steps[i].operation !== 'IGNORE'), [trace, showIgnored])
  const colOf = useMemo(() => {
    const map = new Int32Array(trace.steps.length).fill(-1)
    let last = 0
    for (let i = 0, c = 0; i < trace.steps.length; i++) {
      if (cols[c] === i) {
        last = c
        c++
      }
      map[i] = last
    }
    return map
  }, [cols, trace])

  return (
    <div className="tracepanel">
      <div className="tracepanel__bar">
        <div className="seg" role="group" aria-label="Trace view">
          <button type="button" className="seg__btn" aria-pressed={view === 'table'} onClick={() => setView('table')}>
            <Icon name="table" /> Table
          </button>
          <button type="button" className="seg__btn" aria-pressed={view === 'visual'} onClick={() => setView('visual')}>
            <Icon name="layers" /> Visual
          </button>
        </div>
        <label className="row small" style={{ gap: 8, fontWeight: 650 }}>
          <input type="checkbox" checked={showIgnored} onChange={(e) => setShowIgnored(e.target.checked)} disabled={ignoredCount === 0} />
          Show ignored characters ({ignoredCount.toLocaleString()})
        </label>
      </div>

      {view === 'table' ? (
        <div className="ttable" role="table" aria-label="Trace table" aria-rowcount={rows.length + 1}>
          <div className="ttable__head" role="row">
            <span role="columnheader">Step</span>
            <span role="columnheader">Character</span>
            <span role="columnheader">Decision</span>
            <span role="columnheader">Action</span>
            <span role="columnheader">Stack (bottom → top)</span>
          </div>
          <VirtualList
            className="ttable__body"
            count={rows.length}
            itemSize={ROW_H}
            scrollToIndex={index >= 0 ? rowOf[index] : undefined}
            style={{ maxHeight: Math.min(rows.length, 8) * ROW_H + 2 }}
            renderItem={(ri, style) => {
              const r = rows[ri]
              if (r.kind === 'group') {
                const n = r.to - r.from + 1
                const isCurrent = index >= r.from && index <= r.to
                return (
                  <div key={`g${r.from}`} style={style} role="row" className={`ttable__row ttable__row--group ${isCurrent ? 'is-current' : ''}`}>
                    <span role="cell" className="ttable__group">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowIgnored(true)}>
                        <Icon name="eye" /> {n} ignored character{n === 1 ? '' : 's'} (steps {trace.steps[r.from].step}–{trace.steps[r.to].step}) — show
                      </button>
                    </span>
                  </div>
                )
              }
              const s = trace.steps[r.i]
              const isCurrent = r.i === index
              return (
                <div
                  key={r.i}
                  style={style}
                  role="row"
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`ttable__row ${isCurrent ? 'is-current' : ''} ${r.i > index ? 'is-future' : ''}`}
                  onClick={() => onJump(r.i)}
                >
                  <span role="cell" className="ttable__step">
                    <button type="button" className="ttable__jump" onClick={() => onJump(r.i)} aria-label={`Go to step ${s.step}`}>
                      {s.step}
                    </button>
                  </span>
                  <span role="cell">{s.char === null ? <span className="muted small">end</span> : <Glyph char={s.char} />}</span>
                  <span role="cell" className="ttable__decision">
                    <RichText text={s.decision} />
                  </span>
                  <span role="cell">
                    <OpBadge op={s.operation} />
                  </span>
                  <span role="cell" className="ttable__stack mono">
                    {[...stackText(s)].map((c, j) => (
                      <span key={j} className={familyOf(c) ? `ctext--${familyOf(c)}` : ''}>
                        {c}
                      </span>
                    ))}
                  </span>
                </div>
              )
            }}
          />
        </div>
      ) : (
        <VirtualList
          horizontal
          className="tvisual"
          count={cols.length}
          itemSize={COL_W}
          scrollToIndex={index >= 0 ? colOf[index] : undefined}
          role="list"
          ariaLabel="Stack evolution, one column per step"
          renderItem={(ci, style) => {
            const i = cols[ci]
            const s = trace.steps[i]
            const isCurrent = i === index
            const items = s.after.topItems(5)
            const more = s.after.size - items.length
            const bad = s.operation === 'ERROR' || s.operation === 'REJECT'
            return (
              <div key={i} style={style} role="listitem" className="tvisual__cell">
                <button
                  type="button"
                  className={`tvisual__col ${isCurrent ? 'is-current' : ''} ${i > index ? 'is-future' : ''} ${bad ? 'is-bad' : ''}`}
                  onClick={() => onJump(i)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${s.step}: ${s.decision.replace(/`/g, '')}`}
                >
                  <span className="tvisual__char">{s.char === null ? 'end' : <Glyph char={s.char} />}</span>
                  <span className="tvisual__stack">
                    {items.map((it, k) => (
                      <span key={it.index} className={`tvisual__blk tvisual__blk--${familyOf(it.char)} ${k === 0 ? 'is-top' : ''}`}>
                        {it.char}
                      </span>
                    ))}
                    {more > 0 && <span className="tvisual__more">+{more} below</span>}
                    {items.length === 0 && <span className="tvisual__empty">empty</span>}
                  </span>
                  <span className="tvisual__op">
                    Step {s.step}
                    <br />
                    {s.operation === 'POP' ? `pop ${s.top?.char} ✓` : s.operation === 'PUSH' ? `push ${s.char}` : s.operation === 'IGNORE' ? 'ignore' : s.operation === 'ACCEPT' ? 'balanced ✓' : '✕ error'}
                  </span>
                </button>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
