import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { Annotation, Compartment, EditorState, RangeSetBuilder, StateEffect, StateField, type Extension } from '@codemirror/state'
import {
  Decoration,
  drawSelection,
  EditorView,
  gutter,
  GutterMarker,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as cmPlaceholder,
  showTooltip,
  tooltips,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { useEffect, useRef } from 'react'
import { familyOf, isBracket } from '../../core/bracketRules'
import './CodeEditor.css'

export interface EditorMark {
  index: number
  message: string
  primary?: boolean
}

interface Runtime {
  current: number | null
  errors: readonly EditorMark[]
  tooltip: boolean
  pair: readonly number[] | null
  pairOk: boolean
}

const EMPTY: Runtime = { current: null, errors: [], tooltip: false, pair: null, pairOk: true }
const MAX_ERROR_MARKS = 200

/* ---------- runtime state (current char, errors, matched pair) ---------- */

const setRuntime = StateEffect.define<Runtime>()
const External = Annotation.define<boolean>()

const runtimeField = StateField.define<Runtime>({
  create: () => EMPTY,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setRuntime)) return e.value
    // Positions are stale once the text changes; the page sends fresh ones.
    return tr.docChanged ? EMPTY : value
  },
})

const runtimeDecorations = EditorView.decorations.compute([runtimeField], (state) => {
  const r = state.field(runtimeField)
  const len = state.doc.length
  const ranges = []
  if (r.pair) {
    for (const p of r.pair) {
      if (p >= 0 && p < len) ranges.push(Decoration.mark({ class: r.pairOk ? 'cm-bs-pair' : 'cm-bs-pair cm-bs-pair--bad' }).range(p, p + 1))
    }
  }
  for (const e of r.errors) {
    if (e.index >= 0 && e.index < len) {
      ranges.push(
        Decoration.mark({
          class: e.primary ? 'cm-bs-error cm-bs-error--primary' : 'cm-bs-error',
          attributes: { title: e.message, 'aria-invalid': 'true' },
        }).range(e.index, e.index + 1),
      )
    }
  }
  if (r.current != null && r.current >= 0 && r.current < len) {
    ranges.push(Decoration.mark({ class: 'cm-bs-current', attributes: { 'aria-current': 'true' } }).range(r.current, r.current + 1))
  }
  return Decoration.set(ranges, true)
})

class ErrorGutterMarker extends GutterMarker {
  readonly message: string
  constructor(message: string) {
    super()
    this.message = message
  }
  eq(other: ErrorGutterMarker) {
    return other.message === this.message
  }
  toDOM() {
    const el = document.createElement('span')
    el.className = 'cm-bs-gutter-err'
    el.textContent = '✕'
    el.title = this.message
    return el
  }
}

const errorGutter = gutter({
  class: 'cm-bs-err-gutter',
  lineMarker(view, line) {
    const r = view.state.field(runtimeField)
    const hit = r.errors.find((e) => e.index >= line.from && e.index <= line.to)
    return hit ? new ErrorGutterMarker(hit.message) : null
  },
  lineMarkerChange: (u) => u.docChanged || u.transactions.some((tr) => tr.effects.some((e) => e.is(setRuntime))),
  initialSpacer: () => new ErrorGutterMarker(''),
})

const errorTooltip = showTooltip.compute([runtimeField], (state) => {
  const r = state.field(runtimeField)
  if (!r.tooltip) return null
  const primary = r.errors.find((e) => e.primary)
  if (!primary || primary.index >= state.doc.length) return null
  return {
    pos: primary.index,
    above: true,
    arrow: true,
    create: () => {
      const dom = document.createElement('div')
      dom.className = 'cm-bs-tooltip'
      dom.setAttribute('role', 'tooltip')
      dom.textContent = primary.message
      return { dom }
    },
  }
})

/* ---------- bracket colouring for the visible range ---------- */

const BRACKET_MARKS = {
  round: Decoration.mark({ class: 'cm-br cm-br-round' }),
  square: Decoration.mark({ class: 'cm-br cm-br-square' }),
  curly: Decoration.mark({ class: 'cm-br cm-br-curly' }),
}

function colourBrackets(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>()
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)
    for (let i = 0; i < text.length; i++) {
      const f = familyOf(text[i])
      if (f) b.add(from + i, from + i + 1, BRACKET_MARKS[f])
    }
  }
  return b.finish()
}

const bracketColours = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = colourBrackets(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = colourBrackets(u.view)
    }
  },
  { decorations: (v) => v.decorations },
)

/* ---------- finding the bracket under the mouse / next to the cursor ---------- */

function bracketAtCoords(view: EditorView, x: number, y: number): number | null {
  const pos = view.posAtCoords({ x, y })
  if (pos == null) return null
  const doc = view.state.doc
  for (const p of [pos, pos - 1]) {
    if (p < 0 || p >= doc.length || !isBracket(doc.sliceString(p, p + 1))) continue
    const start = view.coordsAtPos(p, 1)
    const end = view.coordsAtPos(p + 1, -1)
    if (!start || !end) continue
    const right = end.left > start.left ? end.left : start.left + 10
    if (x >= start.left - 1 && x <= right + 1 && y >= start.top - 2 && y <= start.bottom + 2) return p
  }
  return null
}

function bracketAtCursor(state: EditorState): number | null {
  const sel = state.selection.main
  if (!sel.empty) return null
  const doc = state.doc
  const p = sel.head
  if (p > 0 && isBracket(doc.sliceString(p - 1, p))) return p - 1
  if (p < doc.length && isBracket(doc.sliceString(p, p + 1))) return p
  return null
}

/* ---------- component ---------- */

export interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  /** Accessible name for the editor. */
  label: string
  readOnly?: boolean
  /** Character currently being processed (highlighted). */
  current?: number | null
  errors?: readonly EditorMark[]
  /** Show the primary error message as a tooltip. */
  showErrorTooltip?: boolean
  /** Scroll the primary error into view when it appears (default true). */
  scrollToError?: boolean
  /** Bracket pair to highlight (from the matcher). */
  pair?: readonly number[] | null
  pairOk?: boolean
  /** Bracket under the mouse or next to the cursor (null when none). */
  onBracketFocus?: (index: number | null) => void
  placeholder?: string
  className?: string
  /** Visible lines (min height). */
  minLines?: number
  /** Max height in lines before scrolling. */
  maxLines?: number
  /** Scroll the current character into view as it moves (default true). */
  follow?: boolean
}

export function CodeEditor({
  value,
  onChange,
  label,
  readOnly = false,
  current = null,
  errors,
  showErrorTooltip = false,
  scrollToError = true,
  pair = null,
  pairOk = true,
  onBracketFocus,
  placeholder,
  className,
  minLines = 6,
  maxLines = 18,
  follow = true,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const readOnlyComp = useRef(new Compartment())
  const onChangeRef = useRef(onChange)
  const onFocusRef = useRef(onBracketFocus)
  const hovering = useRef<number | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
    onFocusRef.current = onBracketFocus
  })

  // create once
  useEffect(() => {
    if (!host.current) return
    const report = (idx: number | null) => onFocusRef.current?.(idx)
    const extensions: Extension[] = [
      lineNumbers(),
      errorGutter,
      highlightActiveLineGutter(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      bracketColours,
      runtimeField,
      runtimeDecorations,
      errorTooltip,
      // Render tooltips at the body so the editor's rounded frame never clips them.
      tooltips({ parent: document.body }),
      readOnlyComp.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
      EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
      cmPlaceholder(placeholder ?? 'Type brackets like {[()]} or paste code…'),
      EditorView.updateListener.of((u) => {
        if (u.docChanged && !u.transactions.some((tr) => tr.annotation(External))) onChangeRef.current?.(u.state.doc.toString())
        if ((u.selectionSet || u.docChanged) && hovering.current == null && u.view.hasFocus) report(bracketAtCursor(u.state))
      }),
      EditorView.domEventHandlers({
        mousemove(e, v) {
          const idx = bracketAtCoords(v, e.clientX, e.clientY)
          if (idx !== hovering.current) {
            hovering.current = idx
            report(idx ?? (v.hasFocus ? bracketAtCursor(v.state) : null))
          }
        },
        mouseleave(_e, v) {
          hovering.current = null
          report(v.hasFocus ? bracketAtCursor(v.state) : null)
        },
        blur() {
          if (hovering.current == null) report(null)
        },
      }),
    ]
    const v = new EditorView({ parent: host.current, state: EditorState.create({ doc: value, extensions }) })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // The editor is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // external value changes (examples, uploads, fixes)
  useEffect(() => {
    const v = view.current
    if (!v) return
    const doc = v.state.doc.toString()
    if (doc !== value) v.dispatch({ changes: { from: 0, to: doc.length, insert: value }, annotations: External.of(true) })
  }, [value])

  useEffect(() => {
    view.current?.dispatch({
      effects: readOnlyComp.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
    })
  }, [readOnly])

  // runtime decorations + scrolling
  const errorsKey = errors ? errors.slice(0, MAX_ERROR_MARKS).map((e) => `${e.index}:${e.primary ? 1 : 0}:${e.message}`).join('|') : ''
  const pairKey = pair ? pair.join(',') : ''
  useEffect(() => {
    const v = view.current
    if (!v) return
    const errs = errors ? errors.slice(0, MAX_ERROR_MARKS) : []
    const runtime: Runtime = { current, errors: errs, tooltip: showErrorTooltip, pair, pairOk }
    const effects: StateEffect<unknown>[] = [setRuntime.of(runtime)]
    const len = v.state.doc.length
    const primary = errs.find((e) => e.primary)
    if (showErrorTooltip && scrollToError && primary && primary.index < len) effects.push(EditorView.scrollIntoView(primary.index, { y: 'center' }))
    else if (follow && current != null && current >= 0 && current < len) effects.push(EditorView.scrollIntoView(current, { y: 'nearest', yMargin: 48 }))
    v.dispatch({ effects })
    // errorsKey / pairKey capture the contents of errors / pair
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, errorsKey, showErrorTooltip, scrollToError, pairKey, pairOk, follow])

  const style = {
    ['--editor-min' as string]: `${minLines * 1.6 + 1.2}em`,
    ['--editor-max' as string]: `${maxLines * 1.6 + 1.2}em`,
  }

  return <div ref={host} className={['code-editor', readOnly ? 'code-editor--ro' : '', className ?? ''].filter(Boolean).join(' ')} style={style} />
}
