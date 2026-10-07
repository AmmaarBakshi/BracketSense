/**
 * A real Stack (LIFO) implemented as a singly linked list, as described in the
 * report: "Can be implemented using arrays or linked lists. All core operations
 * run in O(1) constant time."
 *
 * Because nodes are immutable, `snapshot()` is also O(1): a snapshot is just a
 * pointer to the current top node. The trace engine records one snapshot per
 * step without copying the whole stack (structural sharing), which keeps 10k+
 * character traces fast and small.
 */

interface Node<T> {
  readonly value: T
  readonly below: Node<T> | null
  readonly size: number
}

export class StackUnderflowError extends Error {
  constructor(operation: string) {
    super(`Cannot ${operation}: the stack is empty.`)
    this.name = 'StackUnderflowError'
  }
}

export class StackOverflowError extends Error {
  constructor(capacity: number) {
    super(`Cannot push: the stack is full (capacity ${capacity}).`)
    this.name = 'StackOverflowError'
  }
}

/** Immutable, read-only view of a stack at one moment in time. */
export class StackSnapshot<T> {
  private readonly top: Node<T> | null
  private cached: readonly T[] | null = null

  constructor(top: Node<T> | null) {
    this.top = top
  }

  static empty<T>(): StackSnapshot<T> {
    return new StackSnapshot<T>(null)
  }

  get size(): number {
    return this.top ? this.top.size : 0
  }

  isEmpty(): boolean {
    return this.top === null
  }

  peek(): T | undefined {
    return this.top?.value
  }

  /** Items from bottom to top. O(k) the first time, then cached. */
  toArray(): readonly T[] {
    if (this.cached) return this.cached
    const out = new Array<T>(this.size)
    let node = this.top
    for (let i = this.size - 1; node; i--, node = node.below) out[i] = node.value
    this.cached = out
    return out
  }

  /** Top-most `count` items, top first. O(count) — used for deep-stack compact views. */
  topItems(count: number): T[] {
    const out: T[] = []
    for (let node = this.top; node && out.length < count; node = node.below) out.push(node.value)
    return out
  }

  /** @internal used by Stack.restore */
  get node(): Node<T> | null {
    return this.top
  }
}

export class Stack<T> {
  private top: Node<T> | null = null
  readonly capacity: number

  constructor(capacity = Number.POSITIVE_INFINITY) {
    this.capacity = capacity
  }

  /** Insert x on top of the stack. O(1). */
  push(x: T): void {
    if (this.size() >= this.capacity) throw new StackOverflowError(this.capacity)
    this.top = { value: x, below: this.top, size: this.size() + 1 }
  }

  /** Remove and return the top element. O(1). Throws on an empty stack. */
  pop(): T {
    if (!this.top) throw new StackUnderflowError('pop')
    const value = this.top.value
    this.top = this.top.below
    return value
  }

  /** View the top element without removing it. O(1). */
  peek(): T | undefined {
    return this.top?.value
  }

  /** Check whether the stack has no elements. O(1). */
  isEmpty(): boolean {
    return this.top === null
  }

  isFull(): boolean {
    return this.size() >= this.capacity
  }

  size(): number {
    return this.top ? this.top.size : 0
  }

  clear(): void {
    this.top = null
  }

  /** Items from bottom to top. O(n). */
  toArray(): T[] {
    return [...new StackSnapshot(this.top).toArray()]
  }

  /** O(1) immutable snapshot of the current state. */
  snapshot(): StackSnapshot<T> {
    return new StackSnapshot(this.top)
  }

  /** Restore a previous snapshot (used by the Learn widgets' undo). O(1). */
  restore(snapshot: StackSnapshot<T>): void {
    this.top = snapshot.node
  }
}
