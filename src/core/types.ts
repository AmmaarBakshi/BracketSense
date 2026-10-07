import type { CloseBracket, OpenBracket } from './bracketRules'
import type { FlowNodeId } from './flow'
import type { StackSnapshot } from './Stack'

export type CharKind = 'opening' | 'closing' | 'ignored' | 'end'
export type Operation = 'PUSH' | 'POP' | 'IGNORE' | 'ERROR' | 'ACCEPT' | 'REJECT'
export type ErrorType = 'WRONG_TYPE' | 'UNMATCHED_CLOSING' | 'UNCLOSED_OPENING'

/** What the Stack stores: the opening bracket and where it came from in the input. */
export interface StackItem {
  readonly char: OpenBracket
  readonly index: number
}

/** 1-based line and column of a character in the input. */
export interface Position {
  readonly line: number
  readonly col: number
}

export interface Counters {
  /** characters examined so far (brackets + ignored) */
  scanned: number
  /** bracket characters handled */
  processed: number
  /** non-bracket characters skipped */
  ignored: number
  pushes: number
  pops: number
  /** top-of-stack comparisons (peek + match check) */
  comparisons: number
  /** stack size after this step */
  size: number
  /** largest stack size so far: the k in O(k) space */
  maxSize: number
}

export interface BracketError {
  type: ErrorType
  /** Offending character. For UNCLOSED_OPENING: the top-most unclosed opener. */
  charIndex: number
  expected?: CloseBracket
  found?: string
  /** Top of the stack when the error happened (WRONG_TYPE only). */
  top?: StackItem
  /** Brackets still on the stack, bottom to top. */
  remaining: readonly StackItem[]
  remainingCount: number
  /** Exact user-facing message. */
  message: string
  position: Position
}

export interface ValidationResult {
  input: string
  balanced: boolean
  error?: BracketError
  counters: Counters
  /** True when the input was empty ("Nothing to check"). */
  empty: boolean
}

/** One deterministic snapshot per character, plus one for end-of-input. */
export interface TraceStep {
  /** 1-based step number */
  readonly step: number
  /** null on the end-of-input step */
  readonly char: string | null
  /** index into the input; equals input.length on the end-of-input step */
  readonly charIndex: number
  readonly kind: CharKind
  readonly operation: Operation
  /** Short decision label, e.g. "Closing bracket, top matches → POP". */
  readonly decision: string
  /** "What did the algorithm see?" */
  readonly seen: string
  /** "What must it do?" */
  readonly mustDo: string
  /** WHY-style plain-English explanation (backticks mark code). */
  readonly explanation: string
  /** One-line summary for screen-reader announcements. */
  readonly summary: string
  readonly before: StackSnapshot<StackItem>
  readonly after: StackSnapshot<StackItem>
  /** bottom → top */
  readonly stackBefore: readonly StackItem[]
  /** bottom → top */
  readonly stackAfter: readonly StackItem[]
  /** Top of the stack before this step (what a closing bracket is compared with). */
  readonly top?: StackItem
  readonly expected?: CloseBracket
  readonly found?: string
  readonly matchedOpenIndex?: number
  readonly flowchartNodeId: FlowNodeId
  /** Nodes visited during this step, in order. */
  readonly flowPath: readonly FlowNodeId[]
  readonly pseudocodeLine: number
  /** Pseudocode lines executed during this step, in order. */
  readonly pseudocodeLines: readonly number[]
  readonly counters: Readonly<Counters>
  readonly error?: BracketError
  readonly position: Position
}

export interface Trace {
  readonly input: string
  readonly steps: readonly TraceStep[]
  readonly balanced: boolean
  readonly error?: BracketError
  readonly counters: Readonly<Counters>
  /** [openIndex, closeIndex] for every matched pair, in the order they were closed. */
  readonly pairs: ReadonlyArray<readonly [number, number]>
  readonly empty: boolean
  /** Index of the step that decides the verdict (error step or the final step). */
  readonly verdictStep: number
}
