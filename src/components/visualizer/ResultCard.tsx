import { formatPosition } from '../../core/position'
import type { Trace } from '../../core/types'
import { Stacky } from '../art/Art'
import { AssetImage } from '../AssetImage'
import { Icon } from '../Icon'
import { Glyph, RichText } from '../RichText'

export type Prediction = 'balanced' | 'not-balanced'

interface ResultCardProps {
  trace: Trace
  prediction?: Prediction | null
  onRunAgain: () => void
  onSeeTrace: () => void
  onTrySimilar: () => void
  onLearnWhy: () => void
  onInspectError: () => void
  onRestart: () => void
  onNesting: () => void
}

/** Shown once the trace reaches its verdict. */
export function ResultCard({ trace, prediction, onRunAgain, onSeeTrace, onTrySimilar, onLearnWhy, onInspectError, onRestart, onNesting }: ResultCardProps) {
  const ok = trace.balanced
  const c = trace.counters
  const e = trace.error
  const predictedRight = prediction ? (prediction === 'balanced') === ok : null

  return (
    <section className={`result result--${ok ? 'ok' : 'bad'}`} aria-labelledby="result-title">
      <div className="result__art">
        <AssetImage slot="mascot" alt="" fallback={<Stacky mood={ok ? 'cheer' : 'oops'} />} />
      </div>
      <div className="result__body">
        <h2 id="result-title" className="result__title">
          <Icon name={ok ? 'checkCircle' : 'xCircle'} />
          {ok ? 'Balanced' : 'Not balanced'}
        </h2>

        {prediction && (
          <div className={`callout ${predictedRight ? 'callout--success' : 'callout--warning'} result__prediction`}>
            <Icon name={predictedRight ? 'target' : 'alert'} />
            <div>
              <p>
                <strong>Your prediction vs actual:</strong> you said <strong>{prediction === 'balanced' ? 'Balanced' : 'Not balanced'}</strong>, the Stack
                says <strong>{ok ? 'Balanced' : 'Not balanced'}</strong> {predictedRight ? '✓' : '✕'}
              </p>
              {!predictedRight && <p>Don't worry. Now let's inspect the exact step where the prediction failed.</p>}
            </div>
          </div>
        )}

        {ok ? (
          <>
            <p>
              {trace.empty
                ? 'Nothing to check: the input is empty, so it is balanced.'
                : 'Every opening bracket was closed by the right partner in the right order, and the Stack ended empty.'}
            </p>
            <dl className="result__stats">
              <div>
                <dt>Pushes</dt>
                <dd>{c.pushes}</dd>
              </div>
              <div>
                <dt>Pops</dt>
                <dd>{c.pops}</dd>
              </div>
              <div>
                <dt>Max stack</dt>
                <dd>{c.maxSize}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>O(n), n = {trace.input.length}</dd>
              </div>
              <div>
                <dt>Space</dt>
                <dd>O(k), k = {c.maxSize}</dd>
              </div>
            </dl>
          </>
        ) : (
          e && (
            <>
              <p className="result__msg">
                <RichText text={e.message} />
              </p>
              <dl className="result__stats">
                <div>
                  <dt>{e.type === 'UNCLOSED_OPENING' ? 'Unclosed at' : 'Mismatch at'}</dt>
                  <dd>
                    {formatPosition(e.position)} (index {e.charIndex})
                  </dd>
                </div>
                <div>
                  <dt>Expected</dt>
                  <dd>{e.expected ? <Glyph char={e.expected} /> : e.type === 'UNMATCHED_CLOSING' ? 'an opening bracket first' : '—'}</dd>
                </div>
                <div>
                  <dt>Found</dt>
                  <dd>{e.found ? <Glyph char={e.found} /> : 'end of input'}</dd>
                </div>
                <div>
                  <dt>Stack contents</dt>
                  <dd className="result__stack">
                    {e.remaining.length === 0 ? (
                      <span className="muted">empty</span>
                    ) : (
                      <>
                        {e.remaining.slice(-12).map((it) => (
                          <Glyph key={it.index} char={it.char} />
                        ))}
                        {e.remaining.length > 12 && <span className="muted small">+{e.remaining.length - 12} more</span>}
                        <span className="muted small">(bottom → top)</span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </>
          )
        )}

        <div className="result__actions">
          {ok ? (
            <>
              <button type="button" className="btn btn--primary" onClick={onRunAgain}>
                <Icon name="rotate" /> Run Again
              </button>
              <button type="button" className="btn" onClick={onSeeTrace}>
                <Icon name="table" /> See Trace
              </button>
              {c.maxSize >= 2 && (
                <button type="button" className="btn" onClick={onNesting}>
                  <Icon name="fold" /> Visualize Nesting
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" className="btn btn--danger" onClick={onInspectError}>
                <Icon name="search" /> Inspect Error
              </button>
              <button type="button" className="btn" onClick={onRestart}>
                <Icon name="restart" /> Restart
              </button>
            </>
          )}
          <button type="button" className="btn" onClick={onTrySimilar}>
            <Icon name="shuffle" /> Try Similar
          </button>
          <button type="button" className="btn btn--soft" onClick={onLearnWhy}>
            <Icon name="bulb" /> Learn Why
          </button>
        </div>
      </div>
    </section>
  )
}
