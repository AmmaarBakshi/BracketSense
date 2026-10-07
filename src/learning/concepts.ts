/** Concepts tracked across lessons, quiz questions and challenges. */
export type ConceptId = 'stack' | 'lifo' | 'push-pop' | 'why-stack' | 'algorithm' | 'errors' | 'complexity' | 'alternatives'

export type LessonId =
  | 'what-is-a-stack'
  | 'lifo'
  | 'push-pop'
  | 'why-brackets'
  | 'algorithm'
  | 'complexity'
  | 'other-approaches'
  | 'practice'

export interface Concept {
  id: ConceptId
  label: string
  /** The lesson that teaches it (weak-concept links point here). */
  lesson: LessonId
}

export const CONCEPTS: readonly Concept[] = [
  { id: 'stack', label: 'What a Stack is', lesson: 'what-is-a-stack' },
  { id: 'lifo', label: 'LIFO order', lesson: 'lifo' },
  { id: 'push-pop', label: 'Push, Pop and Peek', lesson: 'push-pop' },
  { id: 'why-stack', label: 'Why brackets need a Stack', lesson: 'why-brackets' },
  { id: 'algorithm', label: 'The checking algorithm', lesson: 'algorithm' },
  { id: 'errors', label: 'The three error types', lesson: 'practice' },
  { id: 'complexity', label: 'Time and space complexity', lesson: 'complexity' },
  { id: 'alternatives', label: 'Why Counter and Queue fail', lesson: 'other-approaches' },
]

export const CONCEPT_BY_ID: Readonly<Record<ConceptId, Concept>> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c])) as Record<ConceptId, Concept>

export const LESSON_ORDER: readonly LessonId[] = [
  'what-is-a-stack',
  'lifo',
  'push-pop',
  'why-brackets',
  'algorithm',
  'complexity',
  'other-approaches',
  'practice',
]
