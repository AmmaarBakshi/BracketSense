import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useProgress } from '../app/progress'
import { Stacky } from '../components/art/Art'
import { AssetImage } from '../components/AssetImage'
import { Icon } from '../components/Icon'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { RichText } from '../components/RichText'
import { QuestionView, type AnswerRecord } from '../components/quiz/QuestionView'
import { CONCEPT_BY_ID, type ConceptId } from '../learning/concepts'
import { LESSON_BY_ID } from '../learning/lessons'
import { recordErrorFound, recordQuiz } from '../learning/progress'
import { buildQuizRun, QUIZ_LENGTH, type Question } from '../learning/quiz'
import '../components/compare/compare.css'
import './Quiz.css'

type Phase = 'start' | 'question' | 'result'

export default function QuizPage() {
  useDocumentTitle('Quiz')
  const { progress, update } = useProgress()
  const [phase, setPhase] = useState<Phase>('start')
  const [run, setRun] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [bestBefore, setBestBefore] = useState(0)

  const start = () => {
    setBestBefore(progress.quiz.bestScore)
    setRun(buildQuizRun())
    setIndex(0)
    setAnswers([])
    setPhase('question')
  }

  const onAnswered = (rec: AnswerRecord) => {
    setAnswers((a) => [...a, rec])
    if (rec.correct && run[index].kind === 'first-fail') update(recordErrorFound)
  }

  const onNext = () => {
    if (index < run.length - 1) {
      setIndex((i) => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const score = answers.filter((a) => a.correct).length
    update((p) => recordQuiz(p, { score, total: run.length, answers: run.map((q, i) => ({ concept: q.concept, correct: !!answers[i]?.correct })) }))
    setPhase('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <PageHeader
        tint="quiz"
        eyebrow={
          <>
            <Icon name="quiz" /> {QUIZ_LENGTH} questions · mixed types
          </>
        }
        title="Quiz"
        intro="Balanced or not, Stack tops, what happens on a character, the first failing bracket, operation order, quick fixes and complexity. Every answer is explained."
      />
      <div className="page quiz">
        {phase === 'start' && <QuizStart onStart={start} />}
        {phase === 'question' && run[index] && (
          <QuestionView key={run[index].id + index} question={run[index]} number={index + 1} total={run.length} onAnswered={onAnswered} onNext={onNext} isLast={index === run.length - 1} />
        )}
        {phase === 'result' && <QuizResult run={run} answers={answers} bestBefore={bestBefore} onRetry={start} />}
      </div>
    </>
  )
}

function QuizStart({ onStart }: { onStart: () => void }) {
  const { progress } = useProgress()
  const q = progress.quiz
  const accuracy = q.totalAnswered ? Math.round((q.totalCorrect / q.totalAnswered) * 100) : null
  return (
    <section className="qstart card">
      <div className="qstart__art">
        <AssetImage slot="mascot" alt="" fallback={<Stacky mood="think" />} />
      </div>
      <div className="qstart__body">
        <h2>Ready to test yourself?</h2>
        <ul className="qstart__list">
          <li>
            <Icon name="check" /> {QUIZ_LENGTH} questions per run, in random order with shuffled options
          </li>
          <li>
            <Icon name="check" /> Answers are checked by the same engine as the Visualizer
          </li>
          <li>
            <Icon name="check" /> Weak concepts link straight back to the right lesson
          </li>
        </ul>
        <dl className="qstart__stats">
          <div>
            <dt>Best score</dt>
            <dd>{q.runs ? `${q.bestScore} / ${q.bestTotal}` : '—'}</dd>
          </div>
          <div>
            <dt>Overall accuracy</dt>
            <dd>{accuracy !== null ? `${accuracy}%` : '—'}</dd>
          </div>
          <div>
            <dt>Runs</dt>
            <dd>{q.runs}</dd>
          </div>
        </dl>
        <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
          <Icon name="play" /> {q.runs ? 'Start a new quiz' : 'Start the quiz'}
        </button>
      </div>
    </section>
  )
}

function QuizResult({ run, answers, bestBefore, onRetry }: { run: Question[]; answers: AnswerRecord[]; bestBefore: number; onRetry: () => void }) {
  const { progress } = useProgress()
  const score = answers.filter((a) => a.correct).length
  const accuracy = Math.round((score / run.length) * 100)
  const newBest = score > bestBefore
  const weak = useMemo(() => {
    const map = new Map<ConceptId, number>()
    run.forEach((q, i) => {
      if (!answers[i]?.correct) map.set(q.concept, (map.get(q.concept) ?? 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [run, answers])

  return (
    <section className="qresult" aria-labelledby="qresult-title">
      <div className="qresult__hero card">
        <div className="qresult__art">
          <AssetImage slot="mascot" alt="" fallback={<Stacky mood={score >= 8 ? 'cheer' : score >= 5 ? 'happy' : 'think'} />} />
        </div>
        <div>
          <h2 id="qresult-title" className="qresult__score">
            {score} / {run.length}
          </h2>
          <p className="qresult__line">
            {accuracy}% accuracy{newBest && <span className="badge badge--success"><Icon name="trophy" /> New best score!</span>}
          </p>
          <p className="muted">
            Best score: <strong>{progress.quiz.bestScore} / {progress.quiz.bestTotal}</strong> · overall accuracy{' '}
            {progress.quiz.totalAnswered ? Math.round((progress.quiz.totalCorrect / progress.quiz.totalAnswered) * 100) : 0}% across {progress.quiz.runs} run
            {progress.quiz.runs === 1 ? '' : 's'}
          </p>
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <Icon name="rotate" /> Try a new quiz
            </button>
            <Link to="/challenges" className="btn">
              <Icon name="trophy" /> Go to Challenges
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">
          <Icon name="target" /> Concepts to review
        </h3>
        {weak.length === 0 ? (
          <p>No weak spots this time. Every concept was answered correctly.</p>
        ) : (
          <ul className="qweak">
            {weak.map(([concept, misses]) => {
              const c = CONCEPT_BY_ID[concept]
              const lesson = LESSON_BY_ID[c.lesson]
              return (
                <li key={concept}>
                  <span>
                    <strong>{c.label}</strong> <span className="small muted">({misses} missed)</span>
                  </span>
                  <Link to={`/learn/${lesson.id}`} className="btn btn--sm btn--soft">
                    Lesson {lesson.number}: {lesson.title} <Icon name="arrowRight" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="card__title">
          <Icon name="list" /> Review
        </h3>
        <ol className="qreview">
          {run.map((q, i) => {
            const a = answers[i]
            return (
              <li key={q.id} className={a?.correct ? 'is-right' : 'is-wrong'}>
                <Icon name={a?.correct ? 'checkCircle' : 'xCircle'} label={a?.correct ? 'correct' : 'incorrect'} />
                <span>
                  <RichText text={q.prompt} />
                  <span className="small muted qreview__given">
                    Your answer: <RichText text={a?.given || '—'} />
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
