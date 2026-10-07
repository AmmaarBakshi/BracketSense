import type { MatchInfo } from '../../core/matcher'
import { createPositionLookup } from '../../core/position'
import { Icon } from '../Icon'
import { Glyph, RichText } from '../RichText'

/** "✓ Matching pair found" / "⚠ No matching bracket" line under an editor. */
export function MatchStatus({ info, input }: { info: MatchInfo | null; input: string }) {
  if (!info) {
    return (
      <p className="matchstatus matchstatus--idle">
        <Icon name="info" /> Hover over or click next to any bracket to see its partner.
      </p>
    )
  }
  const pos = createPositionLookup(input)
  const at = (i: number) => {
    const p = pos(i)
    return `L${p.line}:C${p.col}`
  }
  return (
    <p className={`matchstatus ${info.ok ? 'matchstatus--ok' : 'matchstatus--bad'}`}>
      <Icon name={info.ok ? 'checkCircle' : 'alert'} />
      <strong>{info.headline}</strong>
      <span className="matchstatus__pair">
        <Glyph char={info.char} /> <span className="muted small">{at(info.index)}</span>
        {info.ok && info.partner !== undefined && (
          <>
            <span aria-hidden="true">↔</span>
            <Glyph char={input[info.partner]} /> <span className="muted small">{at(info.partner)}</span>
          </>
        )}
      </span>
      <span className="matchstatus__detail small">
        <RichText text={info.detail} />
      </span>
    </p>
  )
}
