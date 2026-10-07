import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { familyOf } from '../core/bracketRules'
import { createPositionLookup } from '../core/position'
import type { Trace } from '../core/types'
import { useSettings } from '../app/settings'
import { Icon } from './Icon'
import { Modal } from './Modal'
import './NestingFold.css'

interface Pair {
  open: number
  close: number
  depth: number
}

/**
 * "Visualize Nesting": matched pairs fold inward, innermost first — exactly
 * the order the Stack closed them. This is how editors build code-folding ranges.
 */
export function NestingFold({ trace, open, onClose }: { trace: Trace; open: boolean; onClose: () => void }) {
  const { reducedMotion } = useSettings()
  const pairs = useMemo<Pair[]>(() => {
    // depth = stack size after the pop (how many brackets still enclose this pair)
    const list = trace.steps.filter((s) => s.operation === 'POP').map((s) => ({ open: s.matchedOpenIndex!, close: s.charIndex, depth: s.counters.size }))
    return list.sort((a, b) => b.depth - a.depth || a.open - b.open)
  }, [trace])
  const position = useMemo(() => createPositionLookup(trace.input), [trace])
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!open || !playing) return
    if (frame >= pairs.length) return
    const id = window.setTimeout(() => {
      setFrame((f) => f + 1)
      if (frame + 1 >= pairs.length) setPlaying(false)
    }, reducedMotion ? 400 : 750)
    return () => window.clearTimeout(id)
  }, [open, playing, frame, pairs.length, reducedMotion])

  const folded = useMemo(() => new Map(pairs.slice(0, frame).map((p) => [p.open, p])), [pairs, frame])
  const lastFolded = frame > 0 ? pairs[frame - 1] : null

  const rendered = useMemo(() => {
    const out: ReactNode[] = []
    const text = trace.input
    let buf = ''
    for (let i = 0; i < text.length; i++) {
      const p = folded.get(i)
      if (p) {
        if (buf) out.push(buf)
        buf = ''
        const fam = familyOf(text[p.open])
        out.push(
          <span key={i} className={`fold-chip fold-chip--${fam} ${p === lastFolded ? 'is-new' : ''}`} title={`${p.close - p.open - 1} characters folded`}>
            {text[p.open]}
            <span className="fold-chip__dots">⋯</span>
            {text[p.close]}
          </span>,
        )
        i = p.close
        continue
      }
      const fam = familyOf(text[i])
      if (fam) {
        if (buf) out.push(buf)
        buf = ''
        out.push(
          <span key={i} className={`ctext--${fam} br-strong`}>
            {text[i]}
          </span>,
        )
      } else buf += text[i]
    }
    if (buf) out.push(buf)
    return out
  }, [trace.input, folded, lastFolded])

  const close = () => {
    setPlaying(false)
    setFrame(0)
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Visualize Nesting: code folding" size="lg">
      <div className="nesting">
        <p className="muted">
          Every pair the Stack matched becomes a <strong>folding range</strong>, the blocks an editor lets you collapse. Pairs fold from the innermost to the
          outermost, in the same order the Stack closed them (LIFO).
        </p>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={() => (frame >= pairs.length ? (setFrame(0), setPlaying(true)) : setPlaying((p) => !p))}>
            <Icon name={playing ? 'pause' : 'play'} />
            {playing ? 'Pause' : frame >= pairs.length ? 'Replay' : frame === 0 ? 'Fold all' : 'Resume'}
          </button>
          <button type="button" className="btn" onClick={() => setFrame((f) => Math.max(0, f - 1))} disabled={frame === 0}>
            <Icon name="stepBack" /> Unfold one
          </button>
          <button type="button" className="btn" onClick={() => setFrame((f) => Math.min(pairs.length, f + 1))} disabled={frame >= pairs.length}>
            <Icon name="stepForward" /> Fold one
          </button>
          <span className="small muted" aria-live="polite">
            {frame} of {pairs.length} pairs folded
          </span>
        </div>
        <pre className="nesting__code" tabIndex={0}>
          {rendered}
        </pre>
        {lastFolded && (
          <p className="callout small">
            <Icon name="fold" />
            <span>
              Folded <strong className={`ctext--${familyOf(trace.input[lastFolded.open])}`}>{trace.input[lastFolded.open]}</strong> (line {position(lastFolded.open).line}) …{' '}
              <strong className={`ctext--${familyOf(trace.input[lastFolded.close])}`}>{trace.input[lastFolded.close]}</strong> (line {position(lastFolded.close).line}) at depth{' '}
              {lastFolded.depth}. {lastFolded.depth === 0 ? 'This is an outermost block.' : `${lastFolded.depth} bracket(s) still enclose it.`}
            </span>
          </p>
        )}
        <p className="small muted">
          Parsers read nested code the same way: the most recently opened block is always the first to finish, which is why compilers, linters and editors
          all use a Stack for this.
        </p>
      </div>
    </Modal>
  )
}
