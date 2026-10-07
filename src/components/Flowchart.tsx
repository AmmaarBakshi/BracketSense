import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react'
import { familyOf } from '../core/bracketRules'
import { edgesOfPath, FLOW_EDGES, FLOW_NODES, type FlowNodeId } from '../core/flow'
import type { Trace, TraceStep } from '../core/types'
import './Flowchart.css'

type Shape = 'pill' | 'rect' | 'diamond'
interface Box {
  x: number
  y: number
  w: number
  h: number
  shape: Shape
}

const W = 1120
const H = 412

/* Node centres and sizes. Row 1: the decision spine; row 2: outcomes; row 3: end-of-input. */
const LAYOUT: Record<FlowNodeId, Box> = {
  START: { x: 56, y: 56, w: 84, h: 38, shape: 'pill' },
  READ: { x: 178, y: 56, w: 112, h: 50, shape: 'rect' },
  IS_OPEN: { x: 338, y: 56, w: 136, h: 74, shape: 'diamond' },
  IS_CLOSE: { x: 518, y: 56, w: 136, h: 74, shape: 'diamond' },
  IS_EMPTY: { x: 698, y: 56, w: 136, h: 74, shape: 'diamond' },
  TOP_MATCH: { x: 878, y: 56, w: 136, h: 74, shape: 'diamond' },
  POP: { x: 1046, y: 56, w: 104, h: 46, shape: 'rect' },
  PUSH: { x: 338, y: 162, w: 104, h: 46, shape: 'rect' },
  IGNORE: { x: 518, y: 162, w: 104, h: 46, shape: 'rect' },
  ERR_UNMATCHED: { x: 698, y: 162, w: 150, h: 52, shape: 'rect' },
  ERR_WRONG: { x: 878, y: 162, w: 150, h: 52, shape: 'rect' },
  NEXT: { x: 338, y: 290, w: 104, h: 46, shape: 'rect' },
  END_INPUT: { x: 518, y: 290, w: 136, h: 74, shape: 'diamond' },
  FINAL_EMPTY: { x: 698, y: 290, w: 136, h: 74, shape: 'diamond' },
  ACCEPT: { x: 880, y: 290, w: 150, h: 46, shape: 'pill' },
  ERR_UNCLOSED: { x: 698, y: 378, w: 156, h: 50, shape: 'rect' },
}

/* Orthogonal edge routes. */
const ROUTES: Record<string, Array<[number, number]>> = {
  'START->READ': [
    [98, 56],
    [121, 56],
  ],
  'READ->IS_OPEN': [
    [234, 56],
    [269, 56],
  ],
  'IS_OPEN->PUSH': [
    [338, 93],
    [338, 138],
  ],
  'IS_OPEN->IS_CLOSE': [
    [406, 56],
    [449, 56],
  ],
  'IS_CLOSE->IGNORE': [
    [518, 93],
    [518, 138],
  ],
  'IS_CLOSE->IS_EMPTY': [
    [586, 56],
    [629, 56],
  ],
  'IS_EMPTY->ERR_UNMATCHED': [
    [698, 93],
    [698, 135],
  ],
  'IS_EMPTY->TOP_MATCH': [
    [766, 56],
    [809, 56],
  ],
  'TOP_MATCH->ERR_WRONG': [
    [878, 93],
    [878, 135],
  ],
  'TOP_MATCH->POP': [
    [946, 56],
    [993, 56],
  ],
  'PUSH->NEXT': [
    [338, 185],
    [338, 266],
  ],
  'IGNORE->NEXT': [
    [518, 185],
    [518, 220],
    [372, 220],
    [372, 266],
  ],
  'POP->NEXT': [
    [1046, 79],
    [1046, 234],
    [356, 234],
    [356, 266],
  ],
  'NEXT->END_INPUT': [
    [390, 290],
    [449, 290],
  ],
  'END_INPUT->READ': [
    [518, 327],
    [518, 400],
    [140, 400],
    [140, 82],
  ],
  'END_INPUT->FINAL_EMPTY': [
    [586, 290],
    [629, 290],
  ],
  'FINAL_EMPTY->ACCEPT': [
    [766, 290],
    [804, 290],
  ],
  'FINAL_EMPTY->ERR_UNCLOSED': [
    [698, 327],
    [698, 352],
  ],
}

function labelPos(points: Array<[number, number]>): { x: number; y: number; anchor: 'start' | 'middle' } {
  const [a, b] = points
  if (a[1] === b[1]) return { x: (a[0] + b[0]) / 2, y: a[1] - 7, anchor: 'middle' }
  return { x: a[0] + 7, y: a[1] + 17, anchor: 'start' }
}

function tierFor(step: TraceStep | null): { color: string; soft: string } {
  if (!step) return { color: 'var(--brand)', soft: 'var(--brand-soft)' }
  if (step.operation === 'ERROR' || step.operation === 'REJECT') return { color: 'var(--error-fill)', soft: 'var(--error-soft)' }
  if (step.operation === 'ACCEPT') return { color: 'var(--success-fill)', soft: 'var(--success-soft)' }
  if (step.operation === 'IGNORE') return { color: 'var(--ignored)', soft: 'var(--ignored-soft)' }
  const fam = step.char ? familyOf(step.char) : null
  return fam ? { color: `var(--${fam})`, soft: `var(--${fam}-soft)` } : { color: 'var(--brand)', soft: 'var(--brand-soft)' }
}

function Shape({ box, className, inflate = 0 }: { box: Box; className?: string; inflate?: number }) {
  const w = box.w + inflate * 2
  const h = box.h + inflate * 2
  const x = box.x - w / 2
  const y = box.y - h / 2
  if (box.shape === 'diamond') {
    const pts = `${box.x},${y} ${x + w},${box.y} ${box.x},${y + h} ${x},${box.y}`
    return <polygon points={pts} className={className} />
  }
  return <rect x={x} y={y} width={w} height={h} rx={box.shape === 'pill' ? h / 2 : 10 + inflate} className={className} />
}

interface FlowchartProps {
  trace: Trace
  /** Current step index (-1 = ready). */
  index: number
  className?: string
  compact?: boolean
}

export function Flowchart({ trace, index, className, compact }: FlowchartProps) {
  const uid = useId().replace(/:/g, '')
  const scroller = useRef<HTMLDivElement>(null)
  const step = index >= 0 ? trace.steps[index] : null

  // For each edge / node: the first step that used it (so the trail is O(edges) per render).
  const firstUse = useMemo(() => {
    const edges = new Map<string, number>()
    const nodes = new Map<FlowNodeId, number>()
    trace.steps.forEach((s, i) => {
      for (const e of edgesOfPath(s.flowPath)) if (!edges.has(e)) edges.set(e, i)
      for (const n of s.flowPath) if (!nodes.has(n)) nodes.set(n, i)
    })
    return { edges, nodes }
  }, [trace])

  const currentEdges = useMemo(() => new Set(step ? edgesOfPath(step.flowPath) : []), [step])
  const currentNodes = useMemo(() => new Set(step?.flowPath ?? []), [step])
  const active = step?.flowchartNodeId ?? (index < 0 ? 'START' : null)
  const tier = tierFor(step)

  // Keep the active node in view when the chart scrolls horizontally (mobile).
  useEffect(() => {
    const el = scroller.current
    if (!el || !active || el.scrollWidth <= el.clientWidth) return
    const x = (LAYOUT[active].x / W) * el.scrollWidth
    el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: 'smooth' })
  }, [active])

  const label = step
    ? `Flowchart. Step ${step.step}: ${FLOW_NODES[step.flowchartNodeId].label}${FLOW_NODES[step.flowchartNodeId].sub ? ' ' + FLOW_NODES[step.flowchartNodeId].sub : ''}.`
    : 'Flowchart of the balanced-brackets algorithm. Not started.'

  return (
    <div ref={scroller} className={['flowchart', compact ? 'flowchart--compact' : '', className ?? ''].filter(Boolean).join(' ')}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="flowchart__svg">
        <defs>
          {(['base', 'trail', 'current'] as const).map((k) => (
            <marker key={k} id={`${uid}-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className={`farrow farrow--${k}`} />
            </marker>
          ))}
        </defs>

        {FLOW_EDGES.map((e) => {
          const pts = ROUTES[e.id]
          const isCurrent = currentEdges.has(e.id)
          const used = firstUse.edges.get(e.id)
          const isTrail = !isCurrent && used !== undefined && used < index
          const kind = isCurrent ? 'current' : isTrail ? 'trail' : 'base'
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')
          const lp = e.label ? labelPos(pts) : null
          return (
            <g key={e.id} className={`fedge fedge--${kind}`}>
              <path d={d} markerEnd={`url(#${uid}-arrow-${kind})`} />
              {lp && (
                <text x={lp.x} y={lp.y} textAnchor={lp.anchor} className="fedge__label">
                  {e.label}
                </text>
              )}
            </g>
          )
        })}

        {(Object.keys(LAYOUT) as FlowNodeId[]).map((id) => {
          const node = FLOW_NODES[id]
          const box = LAYOUT[id]
          const isActive = id === active
          const onPath = currentNodes.has(id)
          const used = firstUse.nodes.get(id)
          const visited = used !== undefined && used < index
          const cls = ['fnode', `fnode--${node.kind}`, isActive ? 'is-active' : '', onPath ? 'is-path' : '', visited ? 'is-visited' : ''].filter(Boolean).join(' ')
          return (
            <g key={id} className={cls} style={isActive ? ({ ['--tier' as string]: tier.color, ['--tier-soft' as string]: tier.soft } as CSSProperties) : undefined}>
              {isActive && <Shape box={box} inflate={7} className="fnode__halo" />}
              <Shape box={box} className="fnode__shape" />
              <text x={box.x} y={node.sub ? box.y - 3 : box.y + 4.5} textAnchor="middle" className="fnode__label">
                {node.label}
              </text>
              {node.sub && (
                <text x={box.x} y={box.y + 12} textAnchor="middle" className="fnode__sub">
                  {node.sub}
                </text>
              )}
            </g>
          )
        })}

        {/* current character chip next to READ CHARACTER */}
        {step && step.char !== null && (
          <g className="fchip" transform="translate(194 118)">
            <rect x={-40} y={-15} width={80} height={30} rx={15} className={`fchip__bg fchip__bg--${familyOf(step.char) ?? 'ignored'}`} />
            <text x={0} y={5} textAnchor="middle" className="fchip__text">
              c = {step.char === ' ' ? '␠' : step.char === '\n' ? '↵' : step.char}
            </text>
          </g>
        )}
        {step && step.char === null && (
          <g className="fchip" transform="translate(194 118)">
            <rect x={-40} y={-15} width={80} height={30} rx={15} className="fchip__bg fchip__bg--ignored" />
            <text x={0} y={5} textAnchor="middle" className="fchip__text">
              end
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
