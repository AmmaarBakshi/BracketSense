import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { copyText, decodeShare, encodeShare } from '../../app/share'
import { useToast } from '../../app/toast'
import { closerFor } from '../../core/bracketRules'
import { suggestFixes } from '../../core/fixes'
import { createPositionLookup, formatPosition } from '../../core/position'
import { buildTrace } from '../../core/traceEngine'
import { useBracketMatcher } from '../../hooks/useBracketMatcher'
import { EXAMPLES } from '../../learning/examples'
import { readString, writeString } from '../../learning/storage'
import { CodeEditor, type EditorMark } from '../editor/CodeEditor'
import { Icon } from '../Icon'
import { Glyph, RichText } from '../RichText'
import { MatchStatus } from '../visualizer/MatchStatus'

const KEY = 'bracketsense:playground'
const MAX_UPLOAD = 1_000_000
const DEFAULT = `// Paste any code. Only ( ) [ ] { } are checked.
function total(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * (1 + item.tax[0];
  }, 0);
}`

/** Free sandbox: paste or upload code, see live stats, matching pairs and verified fixes. */
export function Sandbox() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const [input, setInput] = useState(() => {
    const shared = params.get('code')
    return (shared && decodeShare(shared)) ?? readString(KEY) ?? DEFAULT
  })
  const deferred = useDeferredValue(input)
  const trace = useMemo(() => buildTrace(deferred), [deferred])
  const matcher = useBracketMatcher(deferred)
  const position = useMemo(() => createPositionLookup(deferred), [deferred])
  const fixes = useMemo(() => suggestFixes(deferred, trace), [deferred, trace])
  const file = useRef<HTMLInputElement>(null)
  const [showAllPairs, setShowAllPairs] = useState(false)

  // A shared link was opened: consume the param so edits are not overwritten on refresh.
  useEffect(() => {
    if (params.has('code')) {
      setParams(
        (p) => {
          p.delete('code')
          return p
        },
        { replace: true },
      )
    }
  }, [params, setParams])

  useEffect(() => {
    const id = window.setTimeout(() => writeString(KEY, input), 300)
    return () => window.clearTimeout(id)
  }, [input])

  const err = trace.error
  const marks = useMemo<EditorMark[]>(() => {
    if (!err) return []
    if (err.type === 'UNCLOSED_OPENING') return err.remaining.map((it, k) => ({ index: it.index, message: `Unclosed ${it.char}: needs ${closerFor(it.char)}`, primary: k === err.remaining.length - 1 }))
    return [{ index: err.charIndex, message: err.type === 'WRONG_TYPE' ? `Expected ${err.expected}, found ${err.found}` : `Unmatched ${err.found}: nothing to match`, primary: true }]
  }, [err])

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/playground?code=${encodeShare(input)}`
    const ok = await copyText(url)
    toast(ok ? { title: 'Share link copied', body: 'Anyone with the link opens this exact code.', icon: 'link', tone: 'success' } : { title: 'Could not copy', body: url, icon: 'alert', tone: 'error' })
  }

  const upload = async (f: File) => {
    if (f.size > MAX_UPLOAD) return toast({ title: 'File too large', body: 'Please choose a file under 1 MB.', icon: 'alert', tone: 'error' })
    setInput(await f.text())
    toast({ title: `Loaded ${f.name}`, body: `${f.size.toLocaleString()} bytes, read in your browser (nothing is uploaded).`, icon: 'file', tone: 'success' })
  }

  const unmatched = [...matcher.map.status.entries()].filter(([, s]) => s !== 'matched').sort((a, b) => a[0] - b[0])
  const pairs = matcher.map.pairs
  const shownPairs = showAllPairs ? pairs.slice(0, 500) : pairs.slice(0, 12)

  return (
    <div className="sandbox">
      <div className="sandbox__bar">
        <button type="button" className="btn" onClick={() => file.current?.click()}>
          <Icon name="upload" /> Upload file
        </button>
        <input
          ref={file}
          type="file"
          accept=".js,.jsx,.ts,.tsx,.c,.h,.cpp,.java,.py,.txt,.json,.cs,.go,.rs,text/plain"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) upload(f)
          }}
        />
        <button type="button" className="btn" onClick={share}>
          <Icon name="link" /> Copy share link
        </button>
        <Link className="btn" to={`/visualizer?input=${encodeURIComponent(input.slice(0, 20000))}`}>
          <Icon name="layers" /> Trace it in the Visualizer
        </Link>
        <label className="sandbox__examples">
          <span className="sr-only">Load an example</span>
          <select
            className="select"
            value=""
            onChange={(e) => {
              const ex = EXAMPLES.find((x) => x.id === e.target.value)
              if (ex) setInput(ex.input)
            }}
          >
            <option value="">Load an example…</option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label} ({ex.note})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn--ghost" onClick={() => setInput('')}>
          <Icon name="eraser" /> Clear
        </button>
      </div>

      <div className="sandbox__grid">
        <div className="sandbox__editor">
          <CodeEditor
            value={input}
            onChange={setInput}
            label="Playground code"
            errors={marks}
            showErrorTooltip={!!err}
            scrollToError={false}
            pair={matcher.pair}
            pairOk={matcher.info?.ok ?? true}
            onBracketFocus={matcher.setFocus}
            follow={false}
            minLines={14}
            maxLines={24}
            placeholder="Paste code or type brackets…"
          />
          <MatchStatus info={matcher.info} input={deferred} />
        </div>

        <aside className="sandbox__side">
          <section className={`sverdict ${trace.balanced ? 'sverdict--ok' : 'sverdict--bad'}`} aria-live="polite">
            <h3 className="sverdict__title">
              <Icon name={trace.balanced ? 'checkCircle' : 'xCircle'} />
              {trace.empty ? 'Nothing to check' : trace.balanced ? 'Balanced' : 'Not balanced'}
            </h3>
            {err ? (
              <>
                <p>
                  <RichText text={err.message} />
                </p>
                <p className="small muted">At {formatPosition(err.position)}.</p>
              </>
            ) : (
              <p className="small">{trace.empty ? 'The input is empty.' : 'Every bracket is matched by the right partner, in the right order.'}</p>
            )}
          </section>

          <dl className="sstats">
            <div>
              <dt>Characters</dt>
              <dd>{deferred.length.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Brackets processed</dt>
              <dd>{trace.counters.processed.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Ignored</dt>
              <dd>{trace.counters.ignored.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Max depth (k)</dt>
              <dd>{trace.counters.maxSize.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Matched pairs</dt>
              <dd>{pairs.length.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Lines</dt>
              <dd>{(deferred.match(/\n/g)?.length ?? 0) + 1}</dd>
            </div>
          </dl>

          {fixes.length > 0 && (
            <section className="fixes" aria-labelledby="fixes-title">
              <h3 id="fixes-title" className="fixes__title">
                <Icon name="wrench" /> Fix suggestions
              </h3>
              <ul className="fixes__list">
                {fixes.map((f) => (
                  <li key={f.id} className="fix">
                    <div className="fix__text">
                      <strong>
                        <RichText text={f.title} />
                      </strong>
                      <span className="small muted">
                        <RichText text={f.detail} />
                      </span>
                      <span className={`badge ${f.resolves === 'all' ? 'badge--success' : 'badge--warning'}`}>
                        <Icon name={f.resolves === 'all' ? 'check' : 'info'} /> {f.resolves === 'all' ? 'Makes it balanced' : 'Fixes this error; another remains'}
                      </span>
                    </div>
                    <button type="button" className="btn btn--sm btn--soft" onClick={() => setInput(f.result)}>
                      Apply
                    </button>
                  </li>
                ))}
              </ul>
              <p className="small muted">Every suggestion is checked by running the real validator on the fixed text.</p>
            </section>
          )}
        </aside>
      </div>

      <section className="explorer" aria-labelledby="explorer-title">
        <h3 id="explorer-title" className="explorer__title">
          <Icon name="link" /> Matching-bracket explorer
        </h3>
        <p className="small muted">Click a pair to highlight it in the editor. Problems are listed first.</p>
        <div className="explorer__cols">
          <div>
            <h4 className="small">Problems ({unmatched.length})</h4>
            {unmatched.length === 0 ? (
              <p className="small muted">None: every bracket has a partner.</p>
            ) : (
              <ul className="explorer__list">
                {unmatched.slice(0, 50).map(([idx, status]) => (
                  <li key={idx}>
                    <button type="button" className="explorer__item explorer__item--bad" onClick={() => matcher.setFocus(idx)}>
                      <Glyph char={deferred[idx]} /> <span>{formatPosition(position(idx))}</span>
                      <span className="badge badge--warning">{status === 'unclosed' ? 'never closed' : status === 'mismatch' ? 'wrong type' : 'nothing to match'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="small">Matched pairs ({pairs.length})</h4>
            <ul className="explorer__list">
              {shownPairs.map(([a, b]) => (
                <li key={a}>
                  <button type="button" className="explorer__item" onClick={() => matcher.setFocus(a)}>
                    <Glyph char={deferred[a]} /> <span className="small">L{position(a).line}</span> ↔ <Glyph char={deferred[b]} />{' '}
                    <span className="small">L{position(b).line}</span>
                  </button>
                </li>
              ))}
            </ul>
            {pairs.length > 12 && (
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setShowAllPairs((s) => !s)}>
                {showAllPairs ? 'Show fewer' : `Show all ${pairs.length.toLocaleString()}${pairs.length > 500 ? ' (first 500)' : ''}`}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
