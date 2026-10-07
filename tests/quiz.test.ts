import { describe, expect, it } from 'vitest'
import { BANK, buildQuizRun, CORE, gradeChoice, gradeFirstFail, gradeFix, gradeOrder, QUIZ_LENGTH, type Question } from '../src/learning/quiz'

const all: Question[] = [...CORE, ...BANK]

describe('quiz bank', () => {
  it('has six core questions covering the required topics', () => {
    expect(CORE).toHaveLength(6)
    expect(CORE.every((q) => q.core)).toBe(true)
  })

  it('every choice question has its answer among the options', () => {
    for (const q of all) {
      if (q.kind !== 'choice') continue
      expect(q.options.some((o) => o.id === q.answer), q.id).toBe(true)
      expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length)
    }
  })

  it('engine-computed answers are right', () => {
    const byId = Object.fromEntries(all.map((q) => [q.id, q]))
    const ch = (id: string) => byId[id] as Extract<Question, { kind: 'choice' }>
    expect(gradeChoice(ch('core-balanced'), 'yes')).toBe(true)
    expect(gradeChoice(ch('core-top'), '{')).toBe(true)
    expect(gradeChoice(ch('core-action'), 'POP')).toBe(true)
    expect(gradeChoice(ch('t-2'), 'empty')).toBe(true)
    expect(gradeChoice(ch('a-ignore'), 'IGNORE')).toBe(true)
    expect(gradeChoice(ch('a-error'), 'ERROR')).toBe(true)
    expect(gradeFirstFail(byId['core-firstfail'] as Extract<Question, { kind: 'first-fail' }>, 2)).toBe(true)
    expect(gradeFirstFail(byId['f-3'] as Extract<Question, { kind: 'first-fail' }>, 3)).toBe(true)
  })

  it('order questions accept exactly the engine order', () => {
    const q = BANK.find((x) => x.id === 'o-1')!
    if (q.kind !== 'order') throw new Error('expected order')
    expect(q.items).toEqual(['push (', 'push [', 'pop [', 'pop ('])
    expect(gradeOrder(q, q.items)).toBe(true)
    expect(gradeOrder(q, [...q.items].reverse())).toBe(false)
  })

  it('fix questions are solvable within the allowed changes', () => {
    const solutions: Record<string, string> = { 'x-1': '([])', 'x-2': '{[]}', 'x-3': '()' }
    for (const q of BANK) {
      if (q.kind !== 'fix') continue
      expect(gradeFix(q, solutions[q.id]).ok, q.id).toBe(true)
      expect(gradeFix(q, q.input).ok).toBe(false)
    }
  })

  it('predict-the-stack questions offer four distinct pictures', () => {
    for (const q of BANK) {
      if (q.kind !== 'choice' || !q.stackOptions) continue
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.stack)).size).toBe(4)
    }
  })
})

describe('quiz runs', () => {
  it('contain 10 unique questions including all six core ones', () => {
    for (let seed = 1; seed < 30; seed++) {
      const run = buildQuizRun(seed)
      expect(run).toHaveLength(QUIZ_LENGTH)
      expect(new Set(run.map((q) => q.id)).size).toBe(QUIZ_LENGTH)
      for (const c of CORE) expect(run.some((q) => q.id === c.id)).toBe(true)
    }
  })

  it('randomizes order between runs', () => {
    const a = buildQuizRun(1).map((q) => q.id).join()
    const b = buildQuizRun(2).map((q) => q.id).join()
    expect(a).not.toBe(b)
  })
})
