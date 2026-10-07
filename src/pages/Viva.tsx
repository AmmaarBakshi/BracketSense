import { useState } from 'react'
import { useProgress } from '../app/progress'
import { Icon } from '../components/Icon'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { useVivaSearch } from '../components/viva/useVivaSearch'
import { VivaCardView } from '../components/viva/VivaCardView'
import { setVivaConfidence } from '../learning/progress'
import { VIVA_CARDS, VIVA_CATEGORIES, type VivaCategory } from '../learning/viva'
import './Viva.css'

export default function VivaPage() {
  useDocumentTitle('Viva')
  const { progress, update } = useProgress()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<VivaCategory | 'All'>('All')
  const [practice, setPractice] = useState(false)
  const cards = useVivaSearch(query, category)

  const rated = VIVA_CARDS.filter((c) => progress.viva[c.id])
  const confident = VIVA_CARDS.filter((c) => progress.viva[c.id] === 'confident').length
  const unsure = VIVA_CARDS.filter((c) => progress.viva[c.id] === 'unsure').length
  const again = VIVA_CARDS.filter((c) => progress.viva[c.id] === 'again').length

  return (
    <>
      <PageHeader
        tint="viva"
        eyebrow={
          <>
            <Icon name="cap" /> Exam prep · {VIVA_CARDS.length} cards
          </>
        }
        title="Viva Helper"
        intro="Short, exam-ready answers based on the report's own definitions. Use practice mode to hide the answers, say them out loud, then rate yourself."
      />
      <div className="page viva">
        <div className="viva__controls card">
          <label className="field viva__search">
            <span className="field__label">Search</span>
            <span className="viva__searchbox">
              <Icon name="search" />
              <input className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. queue, O(n), peek" />
            </span>
          </label>
          <div className="viva__cats" role="group" aria-label="Category">
            {(['All', ...VIVA_CATEGORIES] as const).map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="viva__practice">
            <label className="ptoolbar__switch">
              <input type="checkbox" checked={practice} onChange={(e) => setPractice(e.target.checked)} />
              <Icon name="target" /> Practice mode (hide answers, self-rate)
            </label>
            <div className="viva__conf" aria-label="Confidence so far">
              <span className="badge vconf--confident">
                <Icon name="checkCircle" /> {confident} confident
              </span>
              <span className="badge vconf--unsure">
                <Icon name="clock" /> {unsure} almost
              </span>
              <span className="badge vconf--again">
                <Icon name="alert" /> {again} need practice
              </span>
              <span className="small muted">
                {rated.length} of {VIVA_CARDS.length} rated
              </span>
            </div>
            <div className="pbar viva__bar" role="progressbar" aria-label="Cards rated confident" aria-valuemin={0} aria-valuemax={VIVA_CARDS.length} aria-valuenow={confident}>
              <div className="pbar__fill" style={{ width: `${(confident / VIVA_CARDS.length) * 100}%` }} />
            </div>
          </div>
        </div>

        <p className="small muted" aria-live="polite">
          {cards.length} card{cards.length === 1 ? '' : 's'}
          {query ? ` matching “${query}”` : ''}
        </p>
        <div className="viva__grid">
          {cards.map((card) => (
            <VivaCardView
              key={`${card.id}-${practice}`}
              card={card}
              practice={practice}
              confidence={progress.viva[card.id]}
              onRate={(level) => update((p) => setVivaConfidence(p, card.id, level))}
            />
          ))}
          {cards.length === 0 && <p>No cards match. Try another word or category.</p>}
        </div>
      </div>
    </>
  )
}
