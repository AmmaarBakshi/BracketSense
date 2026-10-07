import { ACHIEVEMENTS, type AchievementId } from './achievements'
import { CONCEPTS, LESSON_ORDER, type ConceptId, type LessonId } from './concepts'
import { readJson, writeJson } from './storage'

/**
 * Learner progress, stored in localStorage under a versioned key.
 * `parseProgress` never throws: unknown or corrupt data falls back to defaults,
 * older versions are migrated, and data from a newer app version is not
 * overwritten (it is kept under a backup key).
 */

export const PROGRESS_KEY = 'bracketsense:progress'
export const PROGRESS_VERSION = 1
export const LAST_INPUT_KEY = 'bracketsense:lastInput'

export type Confidence = 'again' | 'unsure' | 'confident'

export interface ChallengeRecord {
  completed: boolean
  skipped: boolean
  stars: number
  points: number
  attempts: number
  hintsUsed: number
  completedAt?: string
}

export interface ConceptStat {
  correct: number
  total: number
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION
  lessons: Partial<Record<LessonId, { completed: boolean; checkCorrect: boolean; completedAt?: string }>>
  quiz: {
    runs: number
    bestScore: number
    bestTotal: number
    lastScore: number
    lastTotal: number
    totalCorrect: number
    totalAnswered: number
    concepts: Partial<Record<ConceptId, ConceptStat>>
  }
  challenges: Record<string, ChallengeRecord>
  predictions: { correct: number; total: number; streak: number; bestStreak: number }
  /** Times the learner located the exact failing bracket. */
  errorsFound: number
  /** Traces run to a verdict in the Visualizer. */
  runs: number
  streak: { current: number; best: number; lastDay: string | null }
  achievements: Partial<Record<AchievementId, string>>
  viva: Record<string, Confidence>
  lastVisited: { path: string; label: string; at: string } | null
  introSeen: boolean
}

export function defaultProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    lessons: {},
    quiz: { runs: 0, bestScore: 0, bestTotal: 10, lastScore: 0, lastTotal: 0, totalCorrect: 0, totalAnswered: 0, concepts: {} },
    challenges: {},
    predictions: { correct: 0, total: 0, streak: 0, bestStreak: 0 },
    errorsFound: 0,
    runs: 0,
    streak: { current: 0, best: 0, lastDay: null },
    achievements: {},
    viva: {},
    lastVisited: null,
    introSeen: false,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback)
const bool = (v: unknown) => v === true
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

/** Pre-release shape (v0) used a flat list of completed lessons. */
interface LegacyV0 {
  lessonsCompleted?: unknown
  quizBest?: unknown
}

function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.version === undefined) {
    const legacy = raw as LegacyV0
    const lessons: Record<string, unknown> = {}
    if (Array.isArray(legacy.lessonsCompleted)) for (const id of legacy.lessonsCompleted) if (typeof id === 'string') lessons[id] = { completed: true, checkCorrect: true }
    return { ...raw, version: 1, lessons, quiz: { bestScore: num(legacy.quizBest) } }
  }
  return raw
}

/** Validate and normalise anything read from storage or an imported file. */
export function parseProgress(input: unknown): ProgressState {
  const base = defaultProgress()
  if (!isObj(input)) return base
  if (typeof input.version === 'number' && input.version > PROGRESS_VERSION) return base
  const raw = migrate(input)

  const lessons: ProgressState['lessons'] = {}
  if (isObj(raw.lessons)) {
    for (const id of LESSON_ORDER) {
      const l = raw.lessons[id]
      if (isObj(l)) lessons[id] = { completed: bool(l.completed), checkCorrect: bool(l.checkCorrect), completedAt: str(l.completedAt) }
    }
  }

  const q = isObj(raw.quiz) ? raw.quiz : {}
  const concepts: ProgressState['quiz']['concepts'] = {}
  if (isObj(q.concepts)) {
    for (const c of CONCEPTS) {
      const s = q.concepts[c.id]
      if (isObj(s)) concepts[c.id] = { correct: num(s.correct), total: Math.max(num(s.total), num(s.correct)) }
    }
  }

  const challenges: ProgressState['challenges'] = {}
  if (isObj(raw.challenges)) {
    for (const [id, c] of Object.entries(raw.challenges)) {
      if (!isObj(c)) continue
      challenges[id] = {
        completed: bool(c.completed),
        skipped: bool(c.skipped),
        stars: Math.min(3, num(c.stars)),
        points: num(c.points),
        attempts: num(c.attempts),
        hintsUsed: num(c.hintsUsed),
        completedAt: str(c.completedAt),
      }
    }
  }

  const p = isObj(raw.predictions) ? raw.predictions : {}
  const s = isObj(raw.streak) ? raw.streak : {}
  const achievements: ProgressState['achievements'] = {}
  if (isObj(raw.achievements)) for (const a of ACHIEVEMENTS) if (typeof raw.achievements[a.id] === 'string') achievements[a.id] = raw.achievements[a.id] as string

  const viva: ProgressState['viva'] = {}
  if (isObj(raw.viva)) for (const [id, v] of Object.entries(raw.viva)) if (v === 'again' || v === 'unsure' || v === 'confident') viva[id] = v

  const lv = isObj(raw.lastVisited) ? raw.lastVisited : null

  return {
    version: PROGRESS_VERSION,
    lessons,
    quiz: {
      runs: num(q.runs),
      bestScore: num(q.bestScore),
      bestTotal: num(q.bestTotal, 10) || 10,
      lastScore: num(q.lastScore),
      lastTotal: num(q.lastTotal),
      totalCorrect: num(q.totalCorrect),
      totalAnswered: Math.max(num(q.totalAnswered), num(q.totalCorrect)),
      concepts,
    },
    challenges,
    predictions: { correct: num(p.correct), total: Math.max(num(p.total), num(p.correct)), streak: num(p.streak), bestStreak: num(p.bestStreak) },
    errorsFound: num(raw.errorsFound),
    runs: num(raw.runs),
    streak: { current: num(s.current), best: num(s.best), lastDay: str(s.lastDay) ?? null },
    achievements,
    viva,
    lastVisited: lv && typeof lv.path === 'string' && typeof lv.label === 'string' ? { path: lv.path, label: lv.label, at: str(lv.at) ?? '' } : null,
    introSeen: bool(raw.introSeen),
  }
}

export function loadProgress(): ProgressState {
  const raw = readJson<unknown>(PROGRESS_KEY)
  if (isObj(raw) && typeof raw.version === 'number' && raw.version > PROGRESS_VERSION) {
    // Written by a newer version: keep a copy instead of silently discarding it.
    writeJson(`${PROGRESS_KEY}:backup`, raw)
  }
  return parseProgress(raw)
}

export function saveProgress(state: ProgressState): void {
  writeJson(PROGRESS_KEY, state)
}

/* ---------------- pure updates ---------------- */

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Count a day of learning: consecutive days grow the streak. */
export function touchStreak(state: ProgressState, today: string = dayKey()): ProgressState {
  const { lastDay, current, best } = state.streak
  if (lastDay === today) return state
  const y = new Date(`${today}T12:00:00`)
  y.setDate(y.getDate() - 1)
  const next = lastDay === dayKey(y) ? current + 1 : 1
  return { ...state, streak: { current: next, best: Math.max(best, next), lastDay: today } }
}

export function completeLesson(state: ProgressState, id: LessonId, checkCorrect: boolean): ProgressState {
  const prev = state.lessons[id]
  return touchStreak({
    ...state,
    lessons: { ...state.lessons, [id]: { completed: true, checkCorrect: checkCorrect || !!prev?.checkCorrect, completedAt: prev?.completedAt ?? new Date().toISOString() } },
  })
}

export interface QuizRunResult {
  score: number
  total: number
  answers: Array<{ concept: ConceptId; correct: boolean }>
}

export function recordQuiz(state: ProgressState, run: QuizRunResult): ProgressState {
  const concepts = { ...state.quiz.concepts }
  for (const a of run.answers) {
    const c = concepts[a.concept] ?? { correct: 0, total: 0 }
    concepts[a.concept] = { correct: c.correct + (a.correct ? 1 : 0), total: c.total + 1 }
  }
  const better = run.score > state.quiz.bestScore
  return touchStreak({
    ...state,
    quiz: {
      runs: state.quiz.runs + 1,
      bestScore: better ? run.score : state.quiz.bestScore,
      bestTotal: better ? run.total : state.quiz.bestTotal,
      lastScore: run.score,
      lastTotal: run.total,
      totalCorrect: state.quiz.totalCorrect + run.score,
      totalAnswered: state.quiz.totalAnswered + run.total,
      concepts,
    },
  })
}

export function recordChallenge(state: ProgressState, id: string, update: Partial<ChallengeRecord>): ProgressState {
  const prev = state.challenges[id] ?? { completed: false, skipped: false, stars: 0, points: 0, attempts: 0, hintsUsed: 0 }
  const next: ChallengeRecord = { ...prev, ...update }
  // never lose a better earlier result
  if (prev.completed) {
    next.completed = true
    next.stars = Math.max(prev.stars, next.stars)
    next.points = Math.max(prev.points, next.points)
    next.completedAt = prev.completedAt
    next.skipped = false
  }
  if (next.completed && !next.completedAt) next.completedAt = new Date().toISOString()
  const state2 = { ...state, challenges: { ...state.challenges, [id]: next } }
  return update.completed ? touchStreak(state2) : state2
}

export function recordPrediction(state: ProgressState, correct: boolean): ProgressState {
  const p = state.predictions
  const streak = correct ? p.streak + 1 : 0
  return { ...state, predictions: { correct: p.correct + (correct ? 1 : 0), total: p.total + 1, streak, bestStreak: Math.max(p.bestStreak, streak) } }
}

export function recordErrorFound(state: ProgressState): ProgressState {
  return { ...state, errorsFound: state.errorsFound + 1 }
}

export function recordRun(state: ProgressState): ProgressState {
  return touchStreak({ ...state, runs: state.runs + 1 })
}

/** Add any achievements whose conditions are now met. */
export function withAchievements(state: ProgressState, totalChallenges: number, now = new Date().toISOString()): ProgressState {
  let achievements = state.achievements
  for (const a of ACHIEVEMENTS) {
    if (!achievements[a.id] && a.earned(state, totalChallenges)) achievements = { ...achievements, [a.id]: now }
  }
  return achievements === state.achievements ? state : { ...state, achievements }
}

/* ---------------- derived views ---------------- */

export type ConceptLevel = 'mastered' | 'learning' | 'new'

/** Mastered = lesson done and (no quiz data yet or ≥ 60% correct on that concept in quizzes). */
export function conceptLevels(state: ProgressState): Record<ConceptId, ConceptLevel> {
  const out = {} as Record<ConceptId, ConceptLevel>
  for (const c of CONCEPTS) {
    const lesson = state.lessons[c.lesson]
    const stat = state.quiz.concepts[c.id]
    const quizOk = !stat || stat.total === 0 || stat.correct / stat.total >= 0.6
    const quizStrong = !!stat && stat.total >= 2 && stat.correct / stat.total >= 0.8
    out[c.id] = (lesson?.completed && quizOk) || quizStrong ? 'mastered' : lesson?.completed || (stat && stat.total > 0) ? 'learning' : 'new'
  }
  return out
}

export function totalScore(state: ProgressState): { total: number; lessons: number; quiz: number; challenges: number } {
  const lessons = Object.values(state.lessons).filter((l) => l?.completed).length * 20
  const quiz = state.quiz.bestScore * 10
  const challenges = Object.values(state.challenges).reduce((s, c) => s + (c.completed ? c.points : 0), 0)
  return { total: lessons + quiz + challenges, lessons, quiz, challenges }
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify({ app: 'BracketSense', exportedAt: new Date().toISOString(), progress: state }, null, 2)
}

/** Parse an exported file. Accepts the export wrapper or a bare progress object. */
export function importProgress(json: string): { ok: true; state: ProgressState } | { ok: false; error: string } {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  const body = isObj(data) && isObj(data.progress) ? data.progress : data
  if (!isObj(body) || (body.version !== undefined && typeof body.version !== 'number')) return { ok: false, error: 'That file does not look like BracketSense progress.' }
  if (typeof body.version === 'number' && body.version > PROGRESS_VERSION) return { ok: false, error: 'That file was made by a newer version of BracketSense.' }
  return { ok: true, state: parseProgress(body) }
}
