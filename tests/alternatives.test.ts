import { describe, expect, it } from 'vitest'
import { exposingCases, findDivergence, runStrategy } from '../src/core/alternatives'
import { Queue } from '../src/core/Queue'

describe('Queue', () => {
  it('is FIFO', () => {
    const q = new Queue<string>()
    q.enqueue('(')
    q.enqueue('[')
    expect(q.front()).toBe('(')
    expect(q.dequeue()).toBe('(')
    expect(q.toArray()).toEqual(['['])
    q.dequeue()
    expect(q.isEmpty()).toBe(true)
    expect(() => q.dequeue()).toThrow()
  })
})

describe('Compare: Stack vs Counter vs Queue (acceptance test 8)', () => {
  it('on ([)]: Stack is correct, Counter wrong, Queue wrong', () => {
    const stack = runStrategy('([)]', 'stack')
    const counter = runStrategy('([)]', 'counter')
    const queue = runStrategy('([)]', 'queue')
    expect(stack.balanced).toBe(false)
    expect(stack.rejectedAt).toBe(2)
    expect(counter.balanced).toBe(true) // wrongly says balanced
    expect(queue.balanced).toBe(true) // wrongly says balanced
  })

  it('counter shows ( →1, [ →2, ) →1, ] →0', () => {
    const counter = runStrategy('([)]', 'counter')
    expect(counter.steps.slice(0, 4).map((s) => s.counter)).toEqual([1, 2, 1, 0])
  })

  it('stack detects ([)] at ) while [ is on top', () => {
    const stack = runStrategy('([)]', 'stack')
    const fail = stack.steps.find((s) => !s.ok)!
    expect(fail.char).toBe(')')
    expect(fail.structure).toEqual(['(', '['])
  })

  it('queue rejects the valid nested input {[()]} (front is {, but ) arrives first)', () => {
    const queue = runStrategy('{[()]}', 'queue')
    expect(queue.balanced).toBe(false)
    expect(queue.rejectedAt).toBe(3)
    expect(runStrategy('{[()]}', 'counter').balanced).toBe(true)
    expect(runStrategy('{[()]}', 'stack').balanced).toBe(true)
  })

  it('counter accepts the invalid input (]', () => {
    expect(runStrategy('(]', 'counter').balanced).toBe(true)
    expect(runStrategy('(]', 'stack').balanced).toBe(false)
  })
})

describe('Break the Algorithm variants', () => {
  const cases = ['([)]', '))', '((', '{[()]}', '(]', ')(', '[(])', '()']

  it('ignore-types misses wrong types but still catches empty-stack closers', () => {
    expect(runStrategy('([)]', 'ignore-types').balanced).toBe(true)
    expect(runStrategy('))', 'ignore-types').balanced).toBe(false)
  })

  it('skip-top-check also lets unmatched closers through', () => {
    expect(runStrategy('))', 'skip-top-check').balanced).toBe(true)
    expect(runStrategy('([)]', 'skip-top-check').balanced).toBe(true)
  })

  it('pop-bottom compares with the oldest bracket', () => {
    expect(runStrategy('{[()]}', 'pop-bottom').balanced).toBe(false)
    expect(runStrategy('([)]', 'pop-bottom').balanced).toBe(true)
  })

  it('skip-end-check accepts unclosed brackets', () => {
    expect(runStrategy('((', 'skip-end-check').balanced).toBe(true)
    expect(runStrategy('([)]', 'skip-end-check').balanced).toBe(false)
  })

  it('finds the exact divergence step', () => {
    const d = findDivergence(runStrategy('([)]', 'stack'), runStrategy('([)]', 'ignore-types'))
    expect(d?.index).toBe(2)
    expect(findDivergence(runStrategy('()', 'stack'), runStrategy('()', 'ignore-types'))).toBeNull()
  })

  it('lists the test cases that expose each bug', () => {
    expect(exposingCases('counter', cases)).toEqual(['([)]', '(]', '[(])'])
    expect(exposingCases('queue', cases)).toContain('{[()]}')
    expect(exposingCases('skip-end-check', cases)).toEqual(['(('])
    expect(exposingCases('stack', cases)).toEqual([])
  })
})
