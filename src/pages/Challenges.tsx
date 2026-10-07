import { useSearchParams } from 'react-router'
import { useProgress } from '../app/progress'
import { ChallengePlayer } from '../components/challenges/ChallengePlayer'
import { Icon } from '../components/Icon'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { ColoredCode } from '../components/RichText'
import { CHALLENGES, LEVELS, levelOf } from '../learning/challenges'
import '../pages/Quiz.css'
import './Challenges.css'

export default function ChallengesPage() {
  useDocumentTitle('Challenges')
  const { progress } = useProgress()
  const [params, setParams] = useSearchParams()
  const unlocked = (i: number) => i === 0 || !!progress.challenges[CHALLENGES[i - 1].id]?.completed || !!progress.challenges[CHALLENGES[i - 1].id]?.skipped
  const open = (id: string | null) => {
    setParams((p) => {
      if (id) p.set('c', id)
      else p.delete('c')
      return p
    })
    window.scrollTo({ top: 0 })
  }

  // A locked challenge in the URL simply shows the list.
  const requested = CHALLENGES.findIndex((c) => c.id === params.get('c'))
  const selected = requested >= 0 && unlocked(requested) ? CHALLENGES[requested] : undefined

  const done = CHALLENGES.filter((c) => progress.challenges[c.id]?.completed).length
  const stars = CHALLENGES.reduce((s, c) => s + (progress.challenges[c.id]?.stars ?? 0), 0)
  const points = CHALLENGES.reduce((s, c) => s + (progress.challenges[c.id]?.completed ? progress.challenges[c.id].points : 0), 0)

  if (selected) {
    const i = requested
    const next = CHALLENGES[i + 1]
    return (
      <>
        <PageHeader tint="challenges" eyebrow={<><Icon name="trophy" /> Challenge {i + 1} of {CHALLENGES.length}</>} title="Challenges" />
        <div className="page challenges">
          <ChallengePlayer key={selected.id} challenge={selected} onDone={() => open(null)} nextTitle={next?.title} onNext={next ? () => open(next.id) : undefined} />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        tint="challenges"
        eyebrow={
          <>
            <Icon name="trophy" /> Five levels · {CHALLENGES.length} challenges
          </>
        }
        title="Challenges"
        intro="Predict, locate the exact failing bracket, build strings that meet rules, and fix real code. Points drop with attempts and hints; skip unlocks after three tries."
      />
      <div className="page challenges">
        <dl className="csummary">
          <div>
            <dt>Completed</dt>
            <dd>
              {done} / {CHALLENGES.length}
            </dd>
          </div>
          <div>
            <dt>Stars</dt>
            <dd>
              <Icon name="starFilled" className="star-on" /> {stars} / {CHALLENGES.length * 3}
            </dd>
          </div>
          <div>
            <dt>Points</dt>
            <dd>{points}</dd>
          </div>
        </dl>

        {LEVELS.map((level) => (
          <section key={level.id} className="clevel" aria-labelledby={`lvl-${level.id}`}>
            <h2 id={`lvl-${level.id}`} className="clevel__title">
              <span className={`badge cbadge--${level.color}`}>{level.label}</span>
              <span className="small muted">{level.points} points each</span>
            </h2>
            <ul className="ccards">
              {CHALLENGES.map((c, i) => ({ c, i }))
                .filter(({ c }) => c.level === level.id)
                .map(({ c, i }) => {
                  const rec = progress.challenges[c.id]
                  const isOpen = unlocked(i)
                  return (
                    <li key={c.id}>
                      <button type="button" className={`ccard ${rec?.completed ? 'is-done' : ''} ${!isOpen ? 'is-locked' : ''}`} onClick={() => isOpen && open(c.id)} disabled={!isOpen}>
                        <span className="ccard__top">
                          <span className="badge">{c.kind === 'trace' ? 'Predict & trace' : c.kind === 'build' ? 'Build' : 'Find the bug'}</span>
                          <span className="ccard__status">
                            {rec?.completed ? (
                              <span role="img" aria-label={`${rec.stars} of 3 stars`}>
                                {[1, 2, 3].map((n) => (
                                  <Icon key={n} name={n <= rec.stars ? 'starFilled' : 'star'} className={n <= rec.stars ? 'star-on' : 'star-off'} />
                                ))}
                              </span>
                            ) : rec?.skipped ? (
                              <span className="badge badge--warning">Skipped</span>
                            ) : !isOpen ? (
                              <span className="badge">
                                <Icon name="lock" /> Locked
                              </span>
                            ) : (
                              <span className="badge badge--brand">Open</span>
                            )}
                          </span>
                        </span>
                        <span className="ccard__title">{c.title}</span>
                        {c.kind === 'trace' && c.input.length <= 24 ? (
                          <ColoredCode text={c.input} className="ccard__input" />
                        ) : (
                          <span className="small muted ccard__intro">{c.intro}</span>
                        )}
                        <span className="ccard__meta small">
                          {rec?.completed ? `${rec.points} / ${levelOf(c.level).points} pts · ${rec.attempts} attempt${rec.attempts === 1 ? '' : 's'}` : `${levelOf(c.level).points} pts`}
                          {rec && !rec.completed && rec.attempts > 0 ? ` · ${rec.attempts} attempt${rec.attempts === 1 ? '' : 's'} so far` : ''}
                        </span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
