/** A real FIFO Queue (linked list with head and tail), used to show why FIFO fails. */

interface QNode<T> {
  value: T
  next: QNode<T> | null
}

export class Queue<T> {
  private head: QNode<T> | null = null
  private tail: QNode<T> | null = null
  private count = 0

  /** Add x at the back. O(1). */
  enqueue(x: T): void {
    const node: QNode<T> = { value: x, next: null }
    if (this.tail) this.tail.next = node
    else this.head = node
    this.tail = node
    this.count++
  }

  /** Remove and return the front element. O(1). */
  dequeue(): T {
    if (!this.head) throw new Error('Cannot dequeue: the queue is empty.')
    const value = this.head.value
    this.head = this.head.next
    if (!this.head) this.tail = null
    this.count--
    return value
  }

  front(): T | undefined {
    return this.head?.value
  }

  isEmpty(): boolean {
    return this.count === 0
  }

  size(): number {
    return this.count
  }

  /** Items from front to back. */
  toArray(): T[] {
    const out: T[] = []
    for (let n = this.head; n; n = n.next) out.push(n.value)
    return out
  }
}
