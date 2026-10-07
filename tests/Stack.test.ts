import { describe, expect, it } from 'vitest'
import { Stack, StackOverflowError, StackSnapshot, StackUnderflowError } from '../src/core/Stack'

describe('Stack', () => {
  it('starts empty', () => {
    const s = new Stack<string>()
    expect(s.isEmpty()).toBe(true)
    expect(s.size()).toBe(0)
    expect(s.peek()).toBeUndefined()
    expect(s.toArray()).toEqual([])
  })

  it('is LIFO: the last element pushed is the first popped', () => {
    const s = new Stack<string>()
    s.push('A')
    s.push('B')
    s.push('C')
    expect(s.size()).toBe(3)
    expect(s.peek()).toBe('C')
    expect(s.pop()).toBe('C')
    expect(s.pop()).toBe('B')
    expect(s.pop()).toBe('A')
    expect(s.isEmpty()).toBe(true)
  })

  it('peek does not remove the top', () => {
    const s = new Stack<number>()
    s.push(1)
    s.push(2)
    expect(s.peek()).toBe(2)
    expect(s.peek()).toBe(2)
    expect(s.size()).toBe(2)
  })

  it('toArray lists items bottom to top', () => {
    const s = new Stack<string>()
    ;['{', '[', '('].forEach((c) => s.push(c))
    expect(s.toArray()).toEqual(['{', '[', '('])
  })

  it('throws StackUnderflowError when popping an empty stack', () => {
    const s = new Stack<string>()
    expect(() => s.pop()).toThrow(StackUnderflowError)
  })

  it('respects capacity and throws StackOverflowError', () => {
    const s = new Stack<string>(2)
    s.push('A')
    s.push('B')
    expect(s.isFull()).toBe(true)
    expect(() => s.push('C')).toThrow(StackOverflowError)
    expect(s.toArray()).toEqual(['A', 'B'])
  })

  it('clear empties the stack', () => {
    const s = new Stack<string>()
    s.push('A')
    s.clear()
    expect(s.isEmpty()).toBe(true)
  })

  it('snapshots are immutable and O(1) views of past states', () => {
    const s = new Stack<string>()
    s.push('A')
    const snap1 = s.snapshot()
    s.push('B')
    const snap2 = s.snapshot()
    s.pop()
    s.pop()
    s.push('Z')
    expect(snap1.toArray()).toEqual(['A'])
    expect(snap2.toArray()).toEqual(['A', 'B'])
    expect(snap2.peek()).toBe('B')
    expect(snap2.size).toBe(2)
    expect(s.toArray()).toEqual(['Z'])
  })

  it('restore returns to a snapshot', () => {
    const s = new Stack<string>()
    s.push('A')
    const snap = s.snapshot()
    s.push('B')
    s.restore(snap)
    expect(s.toArray()).toEqual(['A'])
  })

  it('topItems returns the top-most items, top first', () => {
    const s = new Stack<number>()
    for (let i = 1; i <= 50; i++) s.push(i)
    expect(s.snapshot().topItems(3)).toEqual([50, 49, 48])
    expect(StackSnapshot.empty<number>().topItems(3)).toEqual([])
  })
})
