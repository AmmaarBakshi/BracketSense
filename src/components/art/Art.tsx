import type { ReactNode } from 'react'
import './art.css'

/* Inline SVG fallback illustrations. Each one is used only when the matching
 * student picture is missing from public/assets (see src/config/assets.ts). */

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="art" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="6" y="31" width="36" height="12" rx="4" className="f-curly" />
      <rect x="10" y="18" width="28" height="12" rx="4" className="f-square" />
      <rect x="14" y="5" width="20" height="12" rx="4" className="f-round" />
      <g fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="s-onb">
        <path d="M21.5 7.5q-2.2 3.5 0 7M26.5 7.5q2.2 3.5 0 7" />
        <path d="M20.5 20.5h-2v7h2M27.5 20.5h2v7h-2" />
        <path d="M20.5 33.5q-2 0-2 1.6v.9q0 .9-1.2.9 1.2 0 1.2.9v.9q0 1.6 2 1.6M27.5 33.5q2 0 2 1.6v.9q0 .9 1.2.9-1.2 0-1.2.9v.9q0 1.6-2 1.6" />
      </g>
    </svg>
  )
}

export type StackyMood = 'happy' | 'think' | 'oops' | 'cheer'

/** "Stacky": a friendly stack of three bracket blocks. */
export function Stacky({ mood = 'happy', title }: { mood?: StackyMood; title?: string }) {
  const armsUp = mood === 'cheer'
  return (
    <svg className="art" viewBox="0 0 160 190" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {/* shadow */}
      <ellipse cx="80" cy="180" rx="50" ry="7" className="f-surface3" />
      {/* feet */}
      <rect x="48" y="164" width="22" height="12" rx="6" className="f-ink" />
      <rect x="90" y="164" width="22" height="12" rx="6" className="f-ink" />
      {/* bottom block (curly) */}
      <rect x="28" y="122" width="104" height="46" rx="14" className="f-curly" />
      <text x="80" y="155" textAnchor="middle" fontSize="26" className="t-onb">{'{ }'}</text>
      {/* middle block (square) */}
      <rect x="36" y="78" width="88" height="44" rx="14" className="f-square" />
      <text x="80" y="109" textAnchor="middle" fontSize="24" className="t-onb">[ ]</text>
      {/* arms */}
      <g fill="none" strokeWidth="6" strokeLinecap="round" className="s-ink">
        {armsUp ? (
          <>
            <path d="M38 96 Q20 82 18 60" />
            <path d="M122 96 Q140 82 142 60" />
          </>
        ) : (
          <>
            <path d="M38 98 Q22 108 20 124" />
            <path d="M122 98 Q138 108 140 124" />
          </>
        )}
      </g>
      {/* head (round) */}
      <rect x="44" y="20" width="72" height="60" rx="22" className="f-round" />
      {/* face */}
      {mood === 'oops' ? (
        <>
          <circle cx="66" cy="46" r="5" className="f-onb" />
          <circle cx="94" cy="46" r="5" className="f-onb" />
          <ellipse cx="80" cy="64" rx="6" ry="7" className="f-onb" />
          <path d="M120 30 q6 9 0 14 q-6-5 0-14z" className="f-brand" />
        </>
      ) : mood === 'think' ? (
        <>
          <circle cx="68" cy="43" r="5" className="f-onb" />
          <circle cx="96" cy="43" r="5" className="f-onb" />
          <path d="M70 64 h20" fill="none" strokeWidth="4.5" strokeLinecap="round" className="s-onb" />
          <circle cx="132" cy="18" r="13" className="f-surface" />
          <circle cx="132" cy="18" r="13" fill="none" strokeWidth="2" className="s-line" />
          <text x="132" y="25" textAnchor="middle" fontSize="18" className="t-ink">?</text>
        </>
      ) : (
        <>
          <circle cx="66" cy="45" r="5" className="f-onb" />
          <circle cx="94" cy="45" r="5" className="f-onb" />
          <path d="M66 59 q14 13 28 0" fill="none" strokeWidth="4.5" strokeLinecap="round" className="s-onb" />
          {mood === 'cheer' && (
            <>
              <path d="M24 30 l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" className="f-curly" />
              <path d="M138 34 l2.4 5.5 5.6.8-4 4 1 5.6-5-3-5 3 1-5.6-4-4 5.6-.8z" className="f-square" />
            </>
          )}
        </>
      )}
    </svg>
  )
}

/** Home hero fallback: a code window whose brackets feed a stack. */
export function HeroArt() {
  return (
    <svg className="art" viewBox="0 0 480 340" aria-hidden="true" focusable="false">
      <rect x="10" y="18" width="330" height="250" rx="22" className="f-surface" />
      <rect x="10" y="18" width="330" height="250" rx="22" fill="none" strokeWidth="2" className="s-line" />
      <rect x="10" y="18" width="330" height="44" rx="22" className="f-surface2" />
      <rect x="10" y="44" width="330" height="18" className="f-surface2" />
      <circle cx="38" cy="40" r="6" className="f-round" />
      <circle cx="58" cy="40" r="6" className="f-curly" />
      <circle cx="78" cy="40" r="6" className="f-square" />
      {/* code lines */}
      <g>
        <rect x="36" y="86" width="70" height="12" rx="6" className="f-surface3" />
        <text x="114" y="98" fontSize="17" className="ctext t-ink">(</text>
        <rect x="128" y="86" width="40" height="12" rx="6" className="f-surface3" />
        <text x="174" y="98" fontSize="17" className="t-ink">)</text>
        <text x="190" y="98" fontSize="17" className="t-ink">{'{'}</text>

        <rect x="60" y="120" width="44" height="12" rx="6" className="f-surface3" />
        <text x="110" y="132" fontSize="17" className="t-ink">[</text>
        <rect x="124" y="120" width="30" height="12" rx="6" className="f-surface3" />
        <text x="160" y="132" fontSize="17" className="t-ink">]</text>
        <rect x="178" y="120" width="60" height="12" rx="6" className="f-surface3" />

        <rect x="60" y="154" width="90" height="12" rx="6" className="f-surface3" />
        <text x="156" y="166" fontSize="17" className="t-ink">(</text>
        <rect x="170" y="154" width="54" height="12" rx="6" className="f-surface3" />
        <text x="230" y="166" fontSize="17" className="t-ink">)</text>

        <text x="36" y="200" fontSize="17" className="t-ink">{'}'}</text>
      </g>
      {/* coloured bracket highlights */}
      <rect x="110" y="82" width="16" height="22" rx="5" className="f-round" opacity="0.35" />
      <rect x="186" y="82" width="16" height="22" rx="5" className="f-curly" opacity="0.45" />
      <rect x="106" y="116" width="16" height="22" rx="5" className="f-square" opacity="0.35" />
      {/* flow arrow */}
      <path d="M250 120 C 300 120, 320 150, 360 170" fill="none" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" className="s-brand" />
      <path d="M352 160 l12 11 -15 4" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="s-brand" />
      {/* stack column */}
      <rect x="360" y="150" width="104" height="176" rx="18" className="f-surface2" />
      <rect x="372" y="268" width="80" height="44" rx="11" className="f-curly" />
      <text x="412" y="297" textAnchor="middle" fontSize="22" className="t-onb">{'{'}</text>
      <rect x="372" y="218" width="80" height="44" rx="11" className="f-square" />
      <text x="412" y="247" textAnchor="middle" fontSize="22" className="t-onb">[</text>
      <rect x="372" y="168" width="80" height="44" rx="11" className="f-round" />
      <text x="412" y="197" textAnchor="middle" fontSize="22" className="t-onb">(</text>
      <text x="412" y="140" textAnchor="middle" fontSize="13" className="t-ink2">TOP ↓</text>
    </svg>
  )
}

export function EmptyStackArt() {
  return (
    <svg className="art" viewBox="0 0 160 140" aria-hidden="true" focusable="false">
      <path d="M30 20 v96 a12 12 0 0 0 12 12 h76 a12 12 0 0 0 12-12 V20" fill="none" strokeWidth="4" strokeLinecap="round" className="s-line" />
      <g strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" fill="none" className="s-line">
        <path d="M46 104 h68" />
        <path d="M46 80 h68" />
        <path d="M46 56 h68" />
      </g>
      <path d="M80 2 v18 M72 12 l8 8 8-8" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="s-brand" />
    </svg>
  )
}

/** Header illustration for each Learn lesson (1-8). */
export function LessonArt({ lesson }: { lesson: number }) {
  return (
    <svg className="art" viewBox="0 0 200 150" aria-hidden="true" focusable="false">
      <circle cx="100" cy="78" r="66" className="f-surface" opacity="0.75" />
      {LESSON_SCENES[lesson] ?? LESSON_SCENES[1]}
    </svg>
  )
}

const block = (x: number, y: number, w: number, cls: string, glyph?: string) => (
  <g key={`${x}-${y}`}>
    <rect x={x} y={y} width={w} height="24" rx="7" className={cls} />
    {glyph && (
      <text x={x + w / 2} y={y + 17.5} textAnchor="middle" fontSize="15" className="t-onb">
        {glyph}
      </text>
    )}
  </g>
)

const LESSON_SCENES: Record<number, ReactNode> = {
  1: (
    <>
      {block(66, 108, 68, 'f-curly', 'C')}
      {block(66, 82, 68, 'f-square', 'B')}
      {block(66, 56, 68, 'f-round', 'A')}
      <path d="M150 68 h-12 M144 62 l-6 6 6 6" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="s-brand" />
      <text x="154" y="73" fontSize="12" className="t-ink2">TOP</text>
    </>
  ),
  2: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="100" cy={118 - i * 16} rx="48" ry="10" className={['f-curly', 'f-square', 'f-round', 'f-brand-soft'][i]} />
          <ellipse cx="100" cy={118 - i * 16} rx="48" ry="10" fill="none" strokeWidth="2" className="s-onb" opacity="0.35" />
        </g>
      ))}
      <path d="M100 18 v30 M92 38 l8 10 8-10" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="s-success" />
      <path d="M140 48 v-30 M132 28 l8-10 8 10" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="s-error" />
    </>
  ),
  3: (
    <>
      {block(70, 104, 60, 'f-square', '[')}
      {block(70, 78, 60, 'f-round', '(')}
      <path d="M44 40 v40 M36 70 l8 10 8-10" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="s-success" />
      <text x="26" y="34" fontSize="12" className="t-ink2">push</text>
      <path d="M156 80 v-40 M148 50 l8-10 8 10" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="s-error" />
      <text x="142" y="98" fontSize="12" className="t-ink2">pop</text>
    </>
  ),
  4: (
    <>
      <text x="100" y="92" textAnchor="middle" fontSize="34" className="t-ink">
        <tspan className="ctext--curly" style={{ fill: 'var(--curly-text)' }}>{'{'}</tspan>
        <tspan style={{ fill: 'var(--square-text)' }}>[</tspan>
        <tspan style={{ fill: 'var(--round-text)' }}>()</tspan>
        <tspan style={{ fill: 'var(--square-text)' }}>]</tspan>
        <tspan style={{ fill: 'var(--curly-text)' }}>{'}'}</tspan>
      </text>
      <path d="M92 58 q8 -14 16 0" fill="none" strokeWidth="3" className="s-error" style={{ stroke: 'var(--round)' }} />
      <path d="M72 54 q28 -36 56 0" fill="none" strokeWidth="3" style={{ stroke: 'var(--square)' }} />
      <path d="M52 50 q48 -56 96 0" fill="none" strokeWidth="3" style={{ stroke: 'var(--curly)' }} />
    </>
  ),
  5: (
    <>
      <rect x="74" y="16" width="52" height="20" rx="10" className="f-brand-soft" />
      <path d="M100 36 v10" strokeWidth="2.5" className="s-ink2" />
      <path d="M100 46 l26 18 -26 18 -26-18z" className="f-curly" />
      <path d="M126 64 h18" strokeWidth="2.5" className="s-ink2" />
      <rect x="144" y="54" width="40" height="20" rx="6" className="f-square" />
      <path d="M100 82 v12" strokeWidth="2.5" className="s-ink2" />
      <rect x="76" y="94" width="48" height="20" rx="6" className="f-round" />
      <path d="M74 64 h-18" strokeWidth="2.5" className="s-ink2" />
      <rect x="16" y="54" width="40" height="20" rx="6" className="f-error" />
      <rect x="76" y="122" width="48" height="18" rx="9" className="f-success" />
    </>
  ),
  6: (
    <>
      <path d="M36 128 h132 M36 128 V24" fill="none" strokeWidth="3" strokeLinecap="round" className="s-ink2" />
      <path d="M40 120 L160 36" fill="none" strokeWidth="4" strokeLinecap="round" className="s-brand" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={46 + i * 28} cy={116 - i * 19.6} r="6" className={['f-round', 'f-square', 'f-curly', 'f-round', 'f-square'][i]} />
      ))}
      <text x="150" y="146" fontSize="13" className="t-ink2">n</text>
      <text x="16" y="30" fontSize="13" className="t-ink2">ops</text>
    </>
  ),
  7: (
    <>
      {block(22, 40, 26, 'f-round')}
      {block(52, 40, 26, 'f-square')}
      {block(82, 40, 26, 'f-curly')}
      <path d="M24 78 l22 22 M46 78 l-22 22" strokeWidth="5" strokeLinecap="round" className="s-error" />
      {block(130, 104, 50, 'f-curly')}
      {block(130, 78, 50, 'f-square')}
      {block(130, 52, 50, 'f-round')}
      <path d="M140 30 l8 8 16-16" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="s-success" />
      <text x="40" y="128" fontSize="12" className="t-ink2">queue</text>
      <text x="136" y="146" fontSize="12" className="t-ink2">stack</text>
    </>
  ),
  8: (
    <>
      <circle cx="100" cy="78" r="50" className="f-round" opacity="0.9" />
      <circle cx="100" cy="78" r="36" className="f-surface" />
      <circle cx="100" cy="78" r="24" className="f-square" />
      <circle cx="100" cy="78" r="12" className="f-surface" />
      <text x="100" y="84" textAnchor="middle" fontSize="16" className="t-ink">{'{}'}</text>
      <path d="M150 28 L108 72" strokeWidth="4" strokeLinecap="round" className="s-ink" />
      <path d="M150 28 l10 -4 -4 10z" className="f-curly" />
    </>
  ),
}
