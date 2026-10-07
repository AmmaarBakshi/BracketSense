import { describe, expect, it } from 'vitest'
import { buildTrace } from '../src/core/traceEngine'
import { CHALLENGE_COUNT, checkBugFix, CHALLENGES, scoreFor, starsFor } from '../src/learning/challenges'
import {
  completeLesson,
  conceptLevels,
  defaultProgress,
  exportProgress,
  importProgress,
  parseProgress,
  PROGRESS_VERSION,
  recordChallenge,
  recordPrediction,
  recordQuiz,
  touchStreak,
  withAchievements,
} from '../src/learning/progress'

describe('progress storage', () => {
  it('parses garbage safely to defaults', () => {
    for (const bad of [null, undefined, 42, 'x', [], { lessons: 'nope', quiz: 7 }]) {
      expect(parseProgress(bad)).toEqual(defaultProgress())
    }
  })

  it('ignores data from a newer version (migration guard)', () => {
    expect(parseProgress({ version: PROGRESS_VERSION + 1, runs: 99 }).runs).toBe(0)
  })

  it('migrates the legacy v0 shape', () => {
    const p = parseProgress({ lessonsCompleted: ['lifo', 'bogus'], quizBest: 7 })
    expect(p.lessons.lifo?.completed).toBe(true)
    expect(p.quiz.bestScore).toBe(7)
  })

  it('round-trips through export/import', () => {
    let p = completeLesson(defaultProgress(), 'what-is-a-stack', true)
    p = recordQuiz(p, { score: 8, total: 10, answers: [{ concept: 'lifo', correct: true }] })
    const back = importProgress(exportProgress(p))
    expect(back.ok).toBe(true)
    if (back.ok) expect(back.state).toEqual(p)
    expect(importProgress('{not json').ok).toBe(false)
  })
})

describe('progress updates', () => {
  it('keeps the best quiz score (acceptance test 9)', () => {
    let p = recordQuiz(defaultProgress(), { score: 7, total: 10, answers: [] })
    p = recordQuiz(p, { score: 5, total: 10, answers: [] })
    expect(p.quiz.bestScore).toBe(7)
    expect(p.quiz.lastScore).toBe(5)
    expect(p.quiz.totalAnswered).toBe(20)
    expect(parseProgress(JSON.parse(JSON.stringify(p))).quiz.bestScore).toBe(7)
  })

  it('counts day streaks', () => {
    let p = touchStreak(defaultProgress(), '2026-10-01')
    p = touchStreak(p, '2026-10-02')
    p = touchStreak(p, '2026-10-02')
    expect(p.streak.current).toBe(2)
    p = touchStreak(p, '2026-10-05')
    expect(p.streak).toMatchObject({ current: 1, best: 2 })
  })

  it('tracks prediction streaks and unlocks Perfect Prediction', () => {
    let p = defaultProgress()
    for (let i = 0; i < 3; i++) p = recordPrediction(p, true)
    p = withAchievements(p, CHALLENGE_COUNT)
    expect(p.achievements['perfect-prediction']).toBeTruthy()
  })

  it('unlocks Stack Beginner after lesson 1', () => {
    const p = withAchievements(completeLesson(defaultProgress(), 'what-is-a-stack', true), CHALLENGE_COUNT)
    expect(p.achievements['stack-beginner']).toBeTruthy()
    expect(p.achievements['lifo-master']).toBeUndefined()
  })

  it('never loses a better challenge result', () => {
    let p = recordChallenge(defaultProgress(), 'b1', { completed: true, stars: 3, points: 10, attempts: 1 })
    p = recordChallenge(p, 'b1', { completed: true, stars: 1, points: 3, attempts: 4 })
    expect(p.challenges.b1).toMatchObject({ stars: 3, points: 10 })
  })

  it('derives concept mastery from lessons and quiz accuracy', () => {
    let p = completeLesson(defaultProgress(), 'lifo', true)
    expect(conceptLevels(p).lifo).toBe('mastered')
    const wrong = { concept: 'lifo' as const, correct: false }
    p = recordQuiz(p, { score: 0, total: 3, answers: [wrong, wrong, wrong] })
    expect(conceptLevels(p).lifo).toBe('learning')
    expect(conceptLevels(p).complexity).toBe('new')
  })
})

describe('challenges', () => {
  it('scores drop with attempts and hints but never below 25%', () => {
    expect(scoreFor(40, 1, 0)).toBe(40)
    expect(scoreFor(40, 2, 1)).toBe(22)
    expect(scoreFor(40, 9, 2)).toBe(10)
    expect(starsFor(1, 0)).toBe(3)
    expect(starsFor(2, 1)).toBe(2)
    expect(starsFor(3, 0)).toBe(1)
  })

  it('bug challenges are broken as given and fixable by changing brackets only', () => {
    for (const c of CHALLENGES) {
      if (c.kind !== 'bug') continue
      expect(buildTrace(c.code).balanced).toBe(false)
      expect(checkBugFix(c.code, c.code).ok).toBe(false)
    }
    const js = CHALLENGES.find((c) => c.id === 'h3')!
    if (js.kind === 'bug') {
      expect(checkBugFix(js.code, js.code.replace('nums[i);', 'nums[i];')).ok).toBe(true)
      expect(checkBugFix(js.code, js.code.replace('nums[i);', 'nums[j];')).ok).toBe(false)
    }
  })

  it('the build challenge accepts a valid answer and rejects others', () => {
    const build = CHALLENGES.find((c) => c.kind === 'build')!
    if (build.kind !== 'build') return
    const ok = (s: string) => build.constraints.every((k) => k.test(s))
    expect(ok('{[()]}()[]')).toBe(true)
    expect(ok('{[()]}')).toBe(false) // only 6 brackets
    expect(ok('(((())))[]{}')).toBe(false) // depth 4
  })

  it('trace challenges have the expected verdicts', () => {
    const verdicts = Object.fromEntries(CHALLENGES.flatMap((c) => (c.kind === 'trace' ? [[c.id, buildTrace(c.input).balanced]] : [])))
    expect(verdicts).toEqual({ b1: true, b2: true, b3: true, e1: true, e2: false, m1: true, m2: false, h1: true, h2: false, x1: true, x2: false })
  })
})
