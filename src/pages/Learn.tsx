import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useProgress } from '../app/progress'
import { useToast } from '../app/toast'
import { assetUrl, type AssetSlot } from '../config/assets'
import { LessonArt } from '../components/art/Art'
import { AssetImage } from '../components/AssetImage'
import { Icon } from '../components/Icon'
import { ComplexityLab } from '../components/lab/ComplexityLab'
import { ApproachesWidget } from '../components/learn/ApproachesWidget'
import { MiniTraceWidget } from '../components/learn/MiniTraceWidget'
import { OperationsWidget } from '../components/learn/OperationsWidget'
import { PlatesWidget } from '../components/learn/PlatesWidget'
import { PracticeWidget } from '../components/learn/PracticeWidget'
import { StackPlaygroundWidget } from '../components/learn/StackPlaygroundWidget'
import { WhoClosesWidget } from '../components/learn/WhoClosesWidget'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { RichText } from '../components/RichText'
import { CONCEPT_BY_ID, type LessonId } from '../learning/concepts'
import { LESSON_BY_ID, LESSONS, type Lesson, type WidgetId } from '../learning/lessons'
import { completeLesson } from '../learning/progress'
import '../components/learn/learn.css'
import './Learn.css'

const WIDGETS: Record<WidgetId, () => ReactNode> = {
  'stack-playground': () => <StackPlaygroundWidget />,
  plates: () => <PlatesWidget />,
  operations: () => <OperationsWidget />,
  'who-closes': () => <WhoClosesWidget />,
  'mini-trace': () => <MiniTraceWidget />,
  complexity: () => <ComplexityLab compact />,
  approaches: () => <ApproachesWidget />,
  practice: () => <PracticeWidget />,
}

const lessonSlot = (n: number) => `lesson-0${n}` as AssetSlot

export default function LearnPage() {
  const { lessonId } = useParams()
  if (!lessonId) return <CourseOverview />
  const lesson = LESSON_BY_ID[lessonId as LessonId]
  if (!lesson) return <Navigate to="/learn" replace />
  return <LessonView key={lesson.id} lesson={lesson} />
}

function CourseOverview() {
  useDocumentTitle('Learn')
  const { progress } = useProgress()
  const done = LESSONS.filter((l) => progress.lessons[l.id]?.completed).length
  const next = LESSONS.find((l) => !progress.lessons[l.id]?.completed) ?? LESSONS[0]
  return (
    <>
      <PageHeader
        tint="learn"
        eyebrow={
          <>
            <Icon name="book" /> Mini-course · 8 lessons · about 40 minutes
          </>
        }
        title="Learn how a Stack checks brackets"
        intro="Each lesson is short: an explanation in the report's own words, one hands-on widget, and a quick check. Learn → Predict → Visualize → Explain."
        actions={
          <Link className="btn btn--primary btn--lg" to={`/learn/${next.id}`}>
            {done === 0 ? 'Start Lesson 1' : done === LESSONS.length ? 'Review the course' : `Continue: Lesson ${next.number}`} <Icon name="arrowRight" />
          </Link>
        }
        art={<AssetImage slot="lesson-01" alt="" fallback={<LessonArt lesson={1} />} />}
      />
      <div className="page">
        <div className="learn-progress">
          <span>
            <strong>{done}</strong> of {LESSONS.length} lessons completed
          </span>
          <div className="pbar" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={LESSONS.length} aria-valuenow={done}>
            <div className="pbar__fill" style={{ width: `${(done / LESSONS.length) * 100}%` }} />
          </div>
        </div>
        <ol className="lesson-cards">
          {LESSONS.map((l) => {
            const completed = !!progress.lessons[l.id]?.completed
            return (
              <li key={l.id}>
                <Link to={`/learn/${l.id}`} className={`lesson-card lesson-card--${l.color}`}>
                  <span className="lesson-card__art">
                    <AssetImage slot={lessonSlot(l.number)} alt="" fallback={<LessonArt lesson={l.number} />} />
                  </span>
                  <span className="lesson-card__body">
                    <span className="lesson-card__num">Lesson {String(l.number).padStart(2, '0')}</span>
                    <span className="lesson-card__title">{l.title}</span>
                    <span className="lesson-card__summary">{l.summary}</span>
                    <span className="lesson-card__meta">
                      <span>
                        <Icon name="clock" /> {l.minutes} min
                      </span>
                      <span className={`badge ${completed ? 'badge--success' : ''}`}>
                        <Icon name={completed ? 'check' : 'target'} /> {completed ? 'Completed' : 'Not started'}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </>
  )
}

function LessonSidebar({ current }: { current: LessonId }) {
  const { progress } = useProgress()
  const done = LESSONS.filter((l) => progress.lessons[l.id]?.completed).length
  const list = (
    <ol className="lsidebar__list">
      {LESSONS.map((l) => {
        const completed = !!progress.lessons[l.id]?.completed
        return (
          <li key={l.id}>
            <Link to={`/learn/${l.id}`} className={`lsidebar__link ${l.id === current ? 'is-current' : ''}`} aria-current={l.id === current ? 'page' : undefined}>
              <span className={`lsidebar__num ${completed ? 'is-done' : ''}`} aria-hidden="true">
                {completed ? <Icon name="check" /> : l.number}
              </span>
              <span className="lsidebar__title">
                {l.title}
                {completed && <span className="sr-only"> (completed)</span>}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
  return (
    <nav className="lsidebar" aria-label="Lessons">
      <div className="lsidebar__desktop">
        <div className="lsidebar__head">
          <Link to="/learn" className="lsidebar__course">
            <Icon name="book" /> Course
          </Link>
          <span className="small muted">
            {done}/{LESSONS.length} done
          </span>
        </div>
        <div className="pbar">
          <div className="pbar__fill" style={{ width: `${(done / LESSONS.length) * 100}%` }} />
        </div>
        {list}
      </div>
      <details className="lsidebar__mobile">
        <summary>
          <Icon name="list" /> All lessons ({done}/{LESSONS.length} done)
        </summary>
        {list}
      </details>
    </nav>
  )
}

function LessonCheck({ lesson, onResult }: { lesson: Lesson; onResult: (correct: boolean) => void }) {
  const [choice, setChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = choice === lesson.check.answer
  const name = `check-${lesson.id}`
  return (
    <section className="lcheck" aria-labelledby={`${name}-title`}>
      <h2 id={`${name}-title`} className="lcheck__title">
        <Icon name="target" /> Check your understanding
      </h2>
      <fieldset className="lcheck__set">
        <legend className="lcheck__q">
          <RichText text={lesson.check.question} />
        </legend>
        {lesson.check.options.map((opt, i) => {
          const state = checked && choice === i ? (correct ? 'is-right' : 'is-wrong') : checked && i === lesson.check.answer && correct ? 'is-right' : ''
          return (
            <label key={i} className={`lcheck__opt ${state}`}>
              <input
                type="radio"
                name={name}
                checked={choice === i}
                onChange={() => {
                  setChoice(i)
                  setChecked(false)
                }}
              />
              <span>
                <RichText text={opt} />
              </span>
              {state === 'is-right' && <Icon name="checkCircle" label="correct" />}
              {state === 'is-wrong' && <Icon name="xCircle" label="incorrect" />}
            </label>
          )
        })}
      </fieldset>
      <div className="row">
        <button
          type="button"
          className="btn btn--primary"
          disabled={choice === null}
          onClick={() => {
            setChecked(true)
            onResult(correct)
          }}
        >
          Check answer
        </button>
      </div>
      {checked && (
        <p className={`callout ${correct ? 'callout--success' : 'callout--warning'}`} role="status">
          <Icon name={correct ? 'checkCircle' : 'info'} />
          <span>
            <strong>{correct ? 'Correct. ' : 'Not quite. '}</strong>
            {correct ? <RichText text={lesson.check.explain} /> : 'Re-read the explanation above and try another option.'}
          </span>
        </p>
      )}
    </section>
  )
}

function LessonView({ lesson }: { lesson: Lesson }) {
  useDocumentTitle(`Lesson ${lesson.number}: ${lesson.title}`)
  const { progress, update } = useProgress()
  const toast = useToast()
  const navigate = useNavigate()
  const [checkCorrect, setCheckCorrect] = useState(false)
  const completed = !!progress.lessons[lesson.id]?.completed
  const prev = LESSONS[lesson.number - 2]
  const next = LESSONS[lesson.number]
  const concept = CONCEPT_BY_ID[lesson.concept]

  const markComplete = () => {
    update((p) => completeLesson(p, lesson.id, checkCorrect))
    toast({ title: `Lesson ${lesson.number} complete`, body: next ? `Up next: ${next.title}` : 'You finished the course!', icon: 'checkCircle', tone: 'success' })
  }

  return (
    <div className="learn">
      <div className={`lhead lhead--${lesson.color}`}>
        <div className="lhead__inner">
          <div className="lhead__text">
            <span className="eyebrow">
              Lesson {lesson.number} of {LESSONS.length} · {lesson.reportRef}
            </span>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
            <div className="lhead__meta">
              <span className="badge">
                <Icon name="clock" /> {lesson.minutes} min
              </span>
              <span className="badge">
                <Icon name="target" /> {concept.label}
              </span>
              {completed && (
                <span className="badge badge--success">
                  <Icon name="check" /> Completed
                </span>
              )}
            </div>
          </div>
          <div className="lhead__art">
            <AssetImage slot={lessonSlot(lesson.number)} alt={assetUrl(lessonSlot(lesson.number)) ? `Lesson ${lesson.number} illustration` : ''} fallback={<LessonArt lesson={lesson.number} />} />
          </div>
        </div>
      </div>

      <div className="learn__layout page">
        <LessonSidebar current={lesson.id} />
        <article className="learn__main">
          {lesson.sections.map((s, i) => (
            <section key={i} className="lsection">
              {s.heading && <h2>{s.heading}</h2>}
              {s.paragraphs?.map((p, j) => (
                <p key={j}>
                  <RichText text={p} />
                </p>
              ))}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b, j) => (
                    <li key={j}>
                      <RichText text={b} />
                    </li>
                  ))}
                </ul>
              )}
              {s.table && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        {s.table.head.map((h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, k) =>
                            k === 0 ? (
                              <th key={k} scope="row" className="mono">
                                <RichText text={cell} />
                              </th>
                            ) : (
                              <td key={k}>
                                <RichText text={cell} />
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          <section className="lwidget" aria-labelledby="widget-title">
            <h2 id="widget-title" className="lwidget__title">
              <Icon name="flask" /> {lesson.widgetTitle}
            </h2>
            {WIDGETS[lesson.widget]()}
          </section>

          {lesson.figure && (
            <figure className="lfigure">
              <AssetImage slot={lesson.figure.slot} alt={lesson.figure.caption} fallback={<LessonArt lesson={lesson.number} />} className="lfigure__img" />
              <figcaption className="small muted">{lesson.figure.caption}</figcaption>
            </figure>
          )}

          <LessonCheck lesson={lesson} onResult={setCheckCorrect} />

          <nav className="lnav" aria-label="Lesson navigation">
            {prev ? (
              <Link className="btn" to={`/learn/${prev.id}`}>
                <Icon name="arrowLeft" /> Lesson {prev.number}
              </Link>
            ) : (
              <Link className="btn" to="/learn">
                <Icon name="arrowLeft" /> Course overview
              </Link>
            )}
            <span className="spacer" />
            <button type="button" className={`btn ${completed ? 'btn--soft' : 'btn--success'}`} onClick={markComplete}>
              <Icon name="check" /> {completed ? 'Completed (mark again)' : 'Mark complete'}
            </button>
            {next ? (
              <button
                type="button"
                className={`btn ${completed ? 'btn--primary' : ''}`}
                onClick={() => {
                  if (!completed) markComplete()
                  navigate(`/learn/${next.id}`)
                }}
              >
                {completed ? 'Next' : 'Complete & next'}: Lesson {next.number} <Icon name="arrowRight" />
              </button>
            ) : (
              <Link className="btn btn--primary" to="/quiz">
                Take the quiz <Icon name="arrowRight" />
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  )
}
