/**
 * The decision flowchart (SPEC 4.4), as data. The trace engine tags every step
 * with the nodes it visits; the Flowchart component only decides where to draw them.
 */

export type FlowNodeId =
  | 'START'
  | 'READ'
  | 'IS_OPEN'
  | 'PUSH'
  | 'IS_CLOSE'
  | 'IGNORE'
  | 'IS_EMPTY'
  | 'ERR_UNMATCHED'
  | 'TOP_MATCH'
  | 'ERR_WRONG'
  | 'POP'
  | 'NEXT'
  | 'END_INPUT'
  | 'FINAL_EMPTY'
  | 'ACCEPT'
  | 'ERR_UNCLOSED'

export type FlowNodeKind = 'terminal' | 'process' | 'decision' | 'error' | 'success'

export interface FlowNode {
  id: FlowNodeId
  label: string
  /** Optional second line */
  sub?: string
  kind: FlowNodeKind
}

export const FLOW_NODES: Readonly<Record<FlowNodeId, FlowNode>> = {
  START: { id: 'START', label: 'START', kind: 'terminal' },
  READ: { id: 'READ', label: 'READ', sub: 'CHARACTER', kind: 'process' },
  IS_OPEN: { id: 'IS_OPEN', label: 'OPENING', sub: 'BRACKET?', kind: 'decision' },
  PUSH: { id: 'PUSH', label: 'PUSH', kind: 'process' },
  IS_CLOSE: { id: 'IS_CLOSE', label: 'CLOSING', sub: 'BRACKET?', kind: 'decision' },
  IGNORE: { id: 'IGNORE', label: 'IGNORE', kind: 'process' },
  IS_EMPTY: { id: 'IS_EMPTY', label: 'STACK', sub: 'EMPTY?', kind: 'decision' },
  ERR_UNMATCHED: { id: 'ERR_UNMATCHED', label: 'ERROR', sub: 'unmatched closing', kind: 'error' },
  TOP_MATCH: { id: 'TOP_MATCH', label: 'TOP', sub: 'MATCHES?', kind: 'decision' },
  ERR_WRONG: { id: 'ERR_WRONG', label: 'ERROR', sub: 'wrong type', kind: 'error' },
  POP: { id: 'POP', label: 'POP', kind: 'process' },
  NEXT: { id: 'NEXT', label: 'NEXT', kind: 'process' },
  END_INPUT: { id: 'END_INPUT', label: 'END OF', sub: 'INPUT?', kind: 'decision' },
  FINAL_EMPTY: { id: 'FINAL_EMPTY', label: 'STACK', sub: 'EMPTY?', kind: 'decision' },
  ACCEPT: { id: 'ACCEPT', label: 'BALANCED ✓', kind: 'success' },
  ERR_UNCLOSED: { id: 'ERR_UNCLOSED', label: 'ERROR', sub: 'unclosed opening', kind: 'error' },
}

export interface FlowEdge {
  id: string
  from: FlowNodeId
  to: FlowNodeId
  label?: 'YES' | 'NO'
}

const edge = (from: FlowNodeId, to: FlowNodeId, label?: 'YES' | 'NO'): FlowEdge => ({ id: `${from}->${to}`, from, to, label })

export const FLOW_EDGES: readonly FlowEdge[] = [
  edge('START', 'READ'),
  edge('READ', 'IS_OPEN'),
  edge('IS_OPEN', 'PUSH', 'YES'),
  edge('IS_OPEN', 'IS_CLOSE', 'NO'),
  edge('PUSH', 'NEXT'),
  edge('IS_CLOSE', 'IGNORE', 'NO'),
  edge('IS_CLOSE', 'IS_EMPTY', 'YES'),
  edge('IGNORE', 'NEXT'),
  edge('IS_EMPTY', 'ERR_UNMATCHED', 'YES'),
  edge('IS_EMPTY', 'TOP_MATCH', 'NO'),
  edge('TOP_MATCH', 'ERR_WRONG', 'NO'),
  edge('TOP_MATCH', 'POP', 'YES'),
  edge('POP', 'NEXT'),
  edge('NEXT', 'END_INPUT'),
  edge('END_INPUT', 'READ', 'NO'),
  edge('END_INPUT', 'FINAL_EMPTY', 'YES'),
  edge('FINAL_EMPTY', 'ACCEPT', 'YES'),
  edge('FINAL_EMPTY', 'ERR_UNCLOSED', 'NO'),
]

const EDGE_IDS = new Set(FLOW_EDGES.map((e) => e.id))

/** Edge ids traversed by a node path (consecutive pairs that are real edges). */
export function edgesOfPath(path: readonly FlowNodeId[]): string[] {
  const out: string[] = []
  for (let i = 1; i < path.length; i++) {
    const id = `${path[i - 1]}->${path[i]}`
    if (EDGE_IDS.has(id)) out.push(id)
  }
  return out
}
