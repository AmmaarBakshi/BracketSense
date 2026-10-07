import type { ConceptId, LessonId } from './concepts'

/**
 * The mini-course. Wording follows the project report (DSA_REPORT.pdf);
 * section references are shown next to each lesson. Backticks mark code.
 */

export type WidgetId = 'stack-playground' | 'plates' | 'operations' | 'who-closes' | 'mini-trace' | 'complexity' | 'approaches' | 'practice'

export interface LessonSection {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
  table?: { head: string[]; rows: string[][] }
}

export interface LessonCheck {
  question: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  id: LessonId
  number: number
  title: string
  summary: string
  minutes: number
  concept: ConceptId
  color: 'round' | 'square' | 'curly' | 'brand'
  reportRef: string
  sections: LessonSection[]
  widget: WidgetId
  widgetTitle: string
  check: LessonCheck
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'what-is-a-stack',
    number: 1,
    title: 'What is a Stack?',
    summary: 'A linear data structure where everything happens at one end: the top.',
    minutes: 4,
    concept: 'stack',
    color: 'round',
    reportRef: 'Report §3.1–3.2',
    sections: [
      {
        paragraphs: [
          'A Stack is a linear data structure that follows the LIFO (Last In, First Out) principle: the last element inserted is the first one to be removed.',
          'It supports two primary operations, push (insert) and pop (remove), both performed from the same end, called the top of the stack.',
        ],
      },
      {
        heading: 'Key characteristics',
        bullets: [
          'Insertion and deletion happen only at the top.',
          'Follows LIFO ordering.',
          'Can be implemented using arrays or linked lists. (BracketSense uses a linked list.)',
          'All core operations run in O(1) constant time.',
        ],
      },
    ],
    widget: 'stack-playground',
    widgetTitle: 'Try it: a real Stack',
    check: {
      question: 'Push and pop both happen at which end of a Stack?',
      options: ['The bottom', 'The top', 'Push at the top, pop at the bottom', 'Anywhere in the middle'],
      answer: 1,
      explain: 'Both operations use the same end, the top. That is what makes the newest item the first one out.',
    },
  },
  {
    id: 'lifo',
    number: 2,
    title: 'LIFO: Last In, First Out',
    summary: 'The newest item always leaves first, like a pile of plates.',
    minutes: 3,
    concept: 'lifo',
    color: 'square',
    reportRef: 'Report §3.1, §4',
    sections: [
      {
        paragraphs: [
          'Think of a pile of plates. You put a clean plate on top, and when you need one you take the top plate. You never pull from the bottom of the pile.',
          'That is LIFO: Last In, First Out. The plate placed last is taken first.',
        ],
      },
      {
        heading: 'Why this matters for brackets',
        paragraphs: [
          'Brackets in code are always closed in the reverse order in which they were opened. In `{ [ (`, the `(` was opened last, so it must be closed first, then `[`, then `{`.',
          'The most recently opened bracket must be the first one closed: exactly how a stack behaves.',
        ],
      },
    ],
    widget: 'plates',
    widgetTitle: 'Plates, then brackets',
    check: {
      question: 'You push A, then B, then C. What does pop() return?',
      options: ['A', 'B', 'C', 'All three'],
      answer: 2,
      explain: 'C was pushed last, so it is on top and leaves first (LIFO).',
    },
  },
  {
    id: 'push-pop',
    number: 3,
    title: 'Push, Pop & Peek',
    summary: 'Four O(1) operations do all the work: push, pop, peek and isEmpty.',
    minutes: 4,
    concept: 'push-pop',
    color: 'curly',
    reportRef: 'Report §6, §6.1',
    sections: [
      {
        paragraphs: ['The stack-based checker relies on four fundamental stack operations:'],
        table: {
          head: ['Operation', 'Description', 'Time'],
          rows: [
            ['push(x)', 'Insert element x on top of the stack', 'O(1)'],
            ['pop()', 'Remove and return the top element', 'O(1)'],
            ['peek() / top()', 'View the top element without removing it', 'O(1)'],
            ['isEmpty()', 'Check whether the stack has no elements', 'O(1)'],
          ],
        },
      },
      {
        heading: 'How the checker uses them',
        bullets: [
          'When an opening bracket `(`, `[` or `{` is encountered, it is pushed onto the stack.',
          'When a closing bracket `)`, `]` or `}` is encountered, the algorithm calls peek() to check the top element and pop() to remove it if it matches.',
          'isEmpty() is used both during scanning (to catch an unmatched closing bracket) and at the very end (to confirm no unclosed brackets remain).',
        ],
      },
    ],
    widget: 'operations',
    widgetTitle: 'Run the operations',
    check: {
      question: 'What does peek() do?',
      options: ['Removes the top element', 'Returns the top element without removing it', 'Returns the bottom element', 'Checks whether the stack is empty'],
      answer: 1,
      explain: 'peek() lets the algorithm look at the top (to compare it with a closing bracket) before deciding whether to pop.',
    },
  },
  {
    id: 'why-brackets',
    number: 4,
    title: 'Why Brackets Need a Stack',
    summary: 'Nesting is LIFO. Code editors check it on every keystroke.',
    minutes: 5,
    concept: 'why-stack',
    color: 'brand',
    reportRef: 'Report §2, §4',
    sections: [
      {
        heading: 'The problem',
        paragraphs: ['Given a string containing the characters `(` `)` `[` `]` `{` `}`, determine whether the sequence of brackets is balanced, i.e.:'],
        bullets: [
          'Every opening bracket has a matching closing bracket of the same type.',
          'Brackets are closed in the correct order (the most recently opened bracket must be closed first).',
          'No closing bracket appears without a corresponding opening bracket.',
        ],
      },
      {
        heading: 'Why a Stack is the natural fit',
        bullets: [
          'Nested structure matches LIFO behaviour: brackets close in the reverse order they were opened.',
          'Constant-time operations: push and pop are O(1), so even very large files are checked without lag.',
          'Simple mismatch detection: if a closing bracket does not match the top, the error is found immediately, at the exact character.',
          'Minimal memory: only unmatched opening brackets are stored at any time.',
          'Natural end condition: an empty stack at the end means balanced; a non-empty one means something was left unclosed.',
        ],
      },
      {
        heading: 'Relevance to code editors',
        paragraphs: [
          'Editors such as VS Code, IntelliJ IDEA and Sublime Text use this exact logic for bracket highlighting, red error underlines, auto-closing, auto-indentation and code folding.',
        ],
      },
    ],
    widget: 'who-closes',
    widgetTitle: 'Who closes first?',
    check: {
      question: 'After reading `{[(`, which closing bracket must come next?',
      options: ['`}`', '`]`', '`)`', 'Any of them'],
      answer: 2,
      explain: '`(` was opened last, so it is on top of the Stack and must be closed first, by `)`.',
    },
  },
  {
    id: 'algorithm',
    number: 5,
    title: 'The Algorithm',
    summary: 'One pass, three decisions per character, three kinds of error.',
    minutes: 6,
    concept: 'algorithm',
    color: 'round',
    reportRef: 'Report §5.2, §7.1 (Algorithm 1)',
    sections: [
      {
        paragraphs: [
          'Scan the input once, left to right. For each character: if it is an opening bracket, push it. If it is a closing bracket, the Stack must not be empty and its top must be the matching opener; then pop. Anything else is ignored.',
          'After the last character, the input is balanced only if the Stack is empty.',
        ],
      },
      {
        heading: 'Three ways to fail',
        table: {
          head: ['Error', 'When', 'Example'],
          rows: [
            ['Wrong bracket type', 'The top does not match the closing bracket', '`([)]`: top is `[`, found `)`'],
            ['Unmatched closing bracket', 'A closer arrives while the Stack is empty', '`))`: nothing to match'],
            ['Unclosed opening brackets', 'The Stack is not empty at the end', '`((`: 2 remain'],
          ],
        },
      },
    ],
    widget: 'mini-trace',
    widgetTitle: 'Flowchart + pseudocode, live',
    check: {
      question: 'The top of the Stack is `[` and the next character is `)`. What happens?',
      options: ['Push `)`', 'Pop `[`', 'Error: wrong bracket type', 'Ignore `)`'],
      answer: 2,
      explain: 'Only `]` can close `[`. A `)` while `[` is on top means the brackets are crossed, so the algorithm rejects immediately.',
    },
  },
  {
    id: 'complexity',
    number: 6,
    title: 'Complexity',
    summary: 'Time O(n): every character once. Space O(k): only open brackets wait.',
    minutes: 5,
    concept: 'complexity',
    color: 'square',
    reportRef: 'Report §7.2',
    sections: [
      {
        table: {
          head: ['Metric', 'Value', 'Reason'],
          rows: [
            ['Time complexity', 'O(n)', 'Each of the n characters is processed exactly once'],
            ['Space complexity', 'O(n)', 'Worst case: every character is an opening bracket, e.g. `((((`'],
            ['Best-case space', 'O(1)', 'The string has no bracket characters at all'],
          ],
        },
      },
      {
        paragraphs: [
          'More precisely, space is O(k), where k is the maximum number of unmatched opening brackets stored at one time. `()()()()()` never needs more than 1 slot; `((((()))))` needs 5.',
        ],
      },
    ],
    widget: 'complexity',
    widgetTitle: 'Measure it yourself',
    check: {
      question: 'Why is the running time O(n)?',
      options: ['Every pair of characters is compared', 'Each character is examined exactly once, and push/pop are O(1)', 'The Stack is sorted first', 'It depends on the bracket types'],
      answer: 1,
      explain: 'One pass over n characters with constant work per character gives O(n).',
    },
  },
  {
    id: 'other-approaches',
    number: 7,
    title: 'Why Other Approaches Fail',
    summary: 'A counter forgets types; a queue looks at the wrong end.',
    minutes: 5,
    concept: 'alternatives',
    color: 'curly',
    reportRef: 'Report §4.1',
    sections: [
      {
        table: {
          head: ['Structure', 'Behaviour on this problem', 'Verdict'],
          rows: [
            ['Stack', 'Naturally models "last opened, first closed"; O(1) push/pop', '✓ Ideal'],
            ['Queue', 'FIFO order is the opposite of what nesting requires; would need extra reversal logic', '✕ Unsuitable'],
            ['Plain array (no stack ops)', 'Would need manual index tracking to mimic a stack, adding complexity for no benefit', 'Redundant'],
            ['Counter (single integer)', 'Can count depth but cannot distinguish bracket types, so mismatches like `([)]` go undetected', '⚠ Incomplete'],
          ],
        },
      },
      {
        paragraphs: [
          'No other elementary data structure models "last opened, first closed" as cleanly or efficiently as a stack, which is why it is the industry-standard approach inside real compilers, linters and code editors.',
        ],
      },
    ],
    widget: 'approaches',
    widgetTitle: 'Same input, three structures',
    check: {
      question: 'Why does a single counter wrongly accept `([)]`?',
      options: ['It counts too slowly', 'It knows how many brackets are open, but not their type or order', 'It only works on curly braces', 'It uses too much memory'],
      answer: 1,
      explain: 'The counter goes 1, 2, 1, 0 and ends at zero, so it says balanced. It never checks WHICH bracket is being closed.',
    },
  },
  {
    id: 'practice',
    number: 8,
    title: 'Practice',
    summary: 'Predict, locate the error, then check yourself against the real engine.',
    minutes: 6,
    concept: 'errors',
    color: 'brand',
    reportRef: 'Report §2.1, §8',
    sections: [
      {
        paragraphs: [
          'Time to use everything. For each input, predict whether it is balanced. If it is not, click the exact character where the algorithm first knows it is broken. For an unclosed input, that is the end of the input.',
          'Every answer is checked by the same trace engine the Visualizer uses.',
        ],
      },
    ],
    widget: 'practice',
    widgetTitle: 'Guided practice',
    check: {
      question: 'Which error does `((` produce?',
      options: ['Wrong bracket type', 'Unmatched closing bracket', 'Unclosed opening brackets (2 remain)', 'None, it is balanced'],
      answer: 2,
      explain: 'Both `(` are pushed and nothing pops them, so at the end of input 2 brackets remain on the Stack.',
    },
  },
]

export const LESSON_BY_ID: Readonly<Record<LessonId, Lesson>> = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<LessonId, Lesson>
