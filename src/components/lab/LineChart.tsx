import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import './LineChart.css'

export interface ChartPoint {
  x: number
  y: number
}

interface LineChartProps {
  points: readonly ChartPoint[]
  /** Accessible summary of what the chart shows. */
  label: string
  xLabel: string
  yLabel: string
  height?: number
  /** Fix the domains (small multiples share a scale). */
  xMax?: number
  yMax?: number
  /** Draw as a step chart (stack height per character). */
  step?: boolean
  /** Show a dot on every point (only for a handful of points). */
  dots?: boolean
  formatX?: (x: number) => string
  formatY?: (y: number) => string
  tooltip: (p: ChartPoint, index: number) => ReactNode
}

/** Round tick step: 1, 2, 2.5 or 5 × 10^k. */
function niceTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  const ticks: number[] = []
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 })

/**
 * Single-series SVG line chart. 2px line, 8px dots with a surface ring,
 * hairline grid, crosshair + tooltip on hover, arrow keys move the crosshair.
 */
export function LineChart({ points, label, xLabel, yLabel, height = 240, xMax, yMax, step, dots, formatX = fmt, formatY = fmt, tooltip }: LineChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const m = { top: 14, right: 18, bottom: 40, left: 58 }
  const iw = Math.max(40, width - m.left - m.right)
  const ih = height - m.top - m.bottom
  const maxX = xMax ?? Math.max(1, ...points.map((p) => p.x))
  const maxY = yMax ?? Math.max(1, ...points.map((p) => p.y))
  const yTicks = useMemo(() => niceTicks(maxY, 4), [maxY])
  const xTicks = useMemo(() => niceTicks(maxX, width < 420 ? 3 : 5), [maxX, width])
  const yTop = yTicks[yTicks.length - 1]
  const xRight = xTicks[xTicks.length - 1]
  const sx = (x: number) => m.left + (x / xRight) * iw
  const sy = (y: number) => m.top + ih - (y / yTop) * ih

  const path = useMemo(() => {
    if (!points.length) return ''
    let d = `M${sx(points[0].x)} ${sy(points[0].y)}`
    for (let i = 1; i < points.length; i++) {
      const p = points[i]
      if (step) d += `H${sx(p.x)}V${sy(p.y)}`
      else d += `L${sx(p.x)} ${sy(p.y)}`
    }
    return d
    // sx/sy depend on the values below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, step, iw, ih, xRight, yTop])

  const area = points.length ? `${path}V${sy(0)}H${sx(points[0].x)}Z` : ''

  const nearest = (clientX: number) => {
    const el = box.current
    if (!el || !points.length) return null
    const x = ((clientX - el.getBoundingClientRect().left - m.left) / iw) * xRight
    let lo = 0
    let hi = points.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (points[mid].x < x) lo = mid + 1
      else hi = mid
    }
    if (lo > 0 && Math.abs(points[lo - 1].x - x) < Math.abs(points[lo].x - x)) lo--
    return lo
  }

  const hp = hover != null ? points[hover] : null
  const tipLeft = hp ? Math.min(Math.max(sx(hp.x) + 12, 8), width - 200) : 0
  const tipTop = hp ? Math.max(4, sy(hp.y) - 64) : 0

  return (
    <div
      ref={box}
      className="lchart"
      tabIndex={points.length ? 0 : -1}
      role="img"
      aria-label={label}
      onPointerMove={(e) => setHover(nearest(e.clientX))}
      onPointerLeave={() => setHover(null)}
      onFocus={() => points.length && setHover((h) => h ?? points.length - 1)}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (!points.length) return
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          setHover((h) => Math.max(0, Math.min(points.length - 1, (h ?? 0) + (e.key === 'ArrowRight' ? 1 : -1))))
        }
      }}
    >
      <svg width={width} height={height} aria-hidden="true">
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={m.left} x2={m.left + iw} y1={sy(t)} y2={sy(t)} className="lchart__grid" />
            <text x={m.left - 8} y={sy(t) + 4} textAnchor="end" className="lchart__tick">
              {formatY(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={sx(t)} y={m.top + ih + 18} textAnchor="middle" className="lchart__tick">
            {formatX(t)}
          </text>
        ))}
        <line x1={m.left} x2={m.left + iw} y1={sy(0)} y2={sy(0)} className="lchart__axis" />
        <text x={m.left + iw / 2} y={height - 4} textAnchor="middle" className="lchart__axislabel">
          {xLabel}
        </text>
        <text transform={`translate(14 ${m.top + ih / 2}) rotate(-90)`} textAnchor="middle" className="lchart__axislabel">
          {yLabel}
        </text>

        <path d={area} className="lchart__area" />
        <path d={path} className="lchart__line" />
        {dots && points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} className="lchart__dot" />)}

        {hp && (
          <g>
            <line x1={sx(hp.x)} x2={sx(hp.x)} y1={m.top} y2={m.top + ih} className="lchart__cross" />
            <circle cx={sx(hp.x)} cy={sy(hp.y)} r={5.5} className="lchart__dot lchart__dot--hover" />
          </g>
        )}
      </svg>
      {hp && (
        <div className="lchart__tip" style={{ left: tipLeft, top: tipTop }}>
          {tooltip(hp, hover!)}
        </div>
      )}
    </div>
  )
}
