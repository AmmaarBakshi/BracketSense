/** Viva (oral exam) cards. Definitions follow the project report wording. Backticks mark code. */

export type VivaCategory = 'Basics' | 'Operations' | 'Algorithm' | 'Complexity' | 'Comparison' | 'Applications' | 'Edge cases' | 'Scripts'

export interface VivaCard {
  id: string
  category: VivaCategory
  q: string
  /** Paragraphs; a line starting with "• " renders as a bullet. */
  a: string[]
  /** Short memory hook. */
  hook?: string
}

export const VIVA_CATEGORIES: readonly VivaCategory[] = ['Basics', 'Operations', 'Algorithm', 'Complexity', 'Comparison', 'Applications', 'Edge cases', 'Scripts']

export const VIVA_CARDS: readonly VivaCard[] = [
  {
    id: 'what-stack',
    category: 'Basics',
    q: 'What is a Stack?',
    a: [
      'A Stack is a linear data structure that follows the LIFO (Last In, First Out) principle: the last element inserted is the first one to be removed.',
      'It supports two primary operations, push (insert) and pop (remove), both performed at the same end, called the top of the stack.',
    ],
    hook: 'A pile of plates: add and remove only at the top.',
  },
  {
    id: 'lifo',
    category: 'Basics',
    q: 'What does LIFO mean?',
    a: ['Last In, First Out. The element added most recently is the first one removed. Its opposite is FIFO (First In, First Out), the behaviour of a queue.'],
    hook: 'Last plate on the pile is the first one you take.',
  },
  {
    id: 'implement',
    category: 'Basics',
    q: 'How can a Stack be implemented?',
    a: [
      'With an array (keep an index to the top) or with a linked list (each node points to the node below; the head is the top). Both give O(1) push and pop.',
      'BracketSense uses a linked list, which also allows O(1) snapshots of every step for the visualizer.',
    ],
  },
  {
    id: 'overflow',
    category: 'Basics',
    q: 'What are stack overflow and underflow?',
    a: [
      'Overflow: pushing onto a stack that is full (a fixed-capacity array stack).',
      'Underflow: popping from an empty stack. The bracket checker avoids underflow by calling isEmpty() before matching a closing bracket; an empty stack there means an unmatched closing bracket.',
    ],
  },
  {
    id: 'push',
    category: 'Operations',
    q: 'What does push(x) do?',
    a: ['Inserts element x on top of the stack. Time O(1). In the checker, every opening bracket `(` `[` `{` is pushed.'],
  },
  {
    id: 'pop',
    category: 'Operations',
    q: 'What does pop() do?',
    a: ['Removes and returns the top element. Time O(1). In the checker, a closing bracket pops its matching opener once the top has been checked.'],
  },
  {
    id: 'peek',
    category: 'Operations',
    q: 'What does peek() (top()) do?',
    a: ['Returns the top element without removing it. Time O(1). The checker peeks to compare the closing bracket with the most recent opener before deciding to pop.'],
  },
  {
    id: 'isempty',
    category: 'Operations',
    q: 'What does isEmpty() do, and where is it used?',
    a: [
      'It checks whether the stack has no elements. Time O(1).',
      'It is used twice: during scanning, to catch a closing bracket with nothing to match, and at the very end, to confirm that no unclosed brackets remain.',
    ],
  },
  {
    id: 'why-stack',
    category: 'Algorithm',
    q: 'Why is a Stack suitable for checking brackets?',
    a: [
      '• Nested structure matches LIFO: brackets close in the reverse order they were opened.',
      '• Constant-time operations: push and pop are O(1), so even large files are checked without lag.',
      '• Simple mismatch detection: a closer that does not match the top is caught at the exact character.',
      '• Minimal memory: only unmatched opening brackets are stored.',
      '• Natural end condition: empty stack at the end means balanced.',
    ],
  },
  {
    id: 'algorithm',
    category: 'Algorithm',
    q: 'State the algorithm.',
    a: [
      'Scan the string once. If the character is an opening bracket, push it. If it is a closing bracket: if the stack is empty, reject (unmatched closing); if the top does not match, reject (wrong type); otherwise pop. Ignore all other characters.',
      'After the scan, accept if the stack is empty; otherwise reject (unclosed opening brackets).',
    ],
  },
  {
    id: 'errors',
    category: 'Algorithm',
    q: 'What are the three kinds of error?',
    a: [
      '• Wrong bracket type, e.g. `([)]`: the top is `[` but `)` arrives. Expected `]`, found `)`.',
      '• Unmatched closing bracket, e.g. `))`: a closer arrives while the stack is empty.',
      '• Unclosed opening brackets, e.g. `((`: the stack is not empty at the end (2 remain).',
    ],
  },
  {
    id: 'peek-vs-pop',
    category: 'Algorithm',
    q: 'Does the checker pop first or peek first?',
    a: [
      'The report’s pseudocode pops the top and then compares; its section 6.1 describes peeking first and popping only on a match. Both give the same verdict.',
      'BracketSense peeks first so that, on a wrong-type error, the mismatched top is still visible on the stack.',
    ],
  },
  {
    id: 'time',
    category: 'Complexity',
    q: 'What is the time complexity and why?',
    a: ['O(n). Each of the n characters is processed exactly once, and push, pop and peek are O(1).'],
    hook: 'One pass, constant work per character.',
  },
  {
    id: 'space',
    category: 'Complexity',
    q: 'What is the space complexity?',
    a: [
      'O(n) in the worst case, when every character is an opening bracket (e.g. `((((`). O(1) in the best case, when there are no brackets at all.',
      'More precisely O(k), where k is the maximum number of unmatched opening brackets stored at a time: `()()()` needs 1 slot, `((()))` needs 3.',
    ],
  },
  {
    id: 'counter',
    category: 'Comparison',
    q: 'Why not use a counter?',
    a: [
      'A single integer can count depth (+1 for an opener, −1 for a closer) but cannot distinguish bracket types or order. `([)]` goes 1, 2, 1, 0 and the counter wrongly says balanced. The report rates it “Incomplete”.',
    ],
  },
  {
    id: 'queue',
    category: 'Comparison',
    q: 'Why not use a queue?',
    a: [
      'A queue is FIFO: it hands back the oldest opener first, the opposite of what nesting requires. On `{[()]}` the first closer `)` is compared with `{` and a valid string is rejected. The report rates it “Unsuitable”.',
    ],
  },
  {
    id: 'array',
    category: 'Comparison',
    q: 'Why not a plain array?',
    a: ['An array without stack operations would need manual index tracking to mimic a stack, adding complexity for no benefit. The report rates it “Redundant”.'],
  },
  {
    id: 'applications',
    category: 'Applications',
    q: 'Name applications of a Stack.',
    a: [
      '• Expression evaluation and conversion (infix → postfix, evaluating postfix).',
      '• Undo / redo in editors.',
      '• The function call stack in compilers and interpreters (and recursion).',
      '• Parsers and syntax checking, HTML/XML tag validation.',
      '• Browser back history, backtracking (maze solving, DFS).',
    ],
  },
  {
    id: 'editors',
    category: 'Applications',
    q: 'How does a code editor use this checker?',
    a: [
      '1. The lexer scans the source character by character as you type.',
      '2. Every bracket token goes to the balanced-parentheses checker in real time.',
      '3. On a mismatch, the line and column are recorded and passed to the UI.',
      '4. The UI draws a red squiggly underline and may show a tooltip with the message.',
      '5. Next to the cursor, the same stack logic highlights a bracket’s partner; the matched pairs also drive auto-indentation and code folding.',
    ],
  },
  {
    id: 'edge',
    category: 'Edge cases',
    q: 'Which edge cases did you test?',
    a: [
      '• Empty string: balanced (nothing to check).',
      '• Single bracket `(` or `)`: unclosed / unmatched.',
      '• Only openers `(((`, only closers `))`.',
      '• Crossed pairs `([)]`, `[(])`, `{[(])}`: wrong type.',
      '• Code with other characters `a[i] = (b + c) * {d - e}`: those are ignored but counted.',
      '• Very long input (10 000+ characters): still linear.',
    ],
  },
  {
    id: 'limits',
    category: 'Edge cases',
    q: 'What are the limitations?',
    a: [
      '• It does not understand strings or comments: a `(` inside `"("` is still counted.',
      '• It handles only ( ) [ ] { }; HTML/XML tags need the same idea with tag names on the stack.',
      '• It stops at the first error; editors keep going to report more.',
      '• It checks bracket structure only, not the rest of the grammar.',
      '• Worst-case extra memory is O(n).',
    ],
  },
  {
    id: 'script-30',
    category: 'Scripts',
    q: 'Explain your project in 30 seconds.',
    a: [
      '“Our case study is the Balanced Parentheses Checker in a code editor. Editors like VS Code instantly flag mismatched brackets. We show that the right data structure is a Stack: brackets close in reverse order of opening, which is LIFO. We scan the code once, push every opening bracket, and for every closing bracket check the top and pop it. If the stack is empty at the end, the code is balanced. It runs in O(n) time and O(n) worst-case space, and BracketSense lets you watch every step.”',
    ],
  },
  {
    id: 'script-steps',
    category: 'Scripts',
    q: 'Explain the algorithm step by step (on {[()]}).',
    a: [
      '1. Start with an empty stack.',
      '2. `{` is an opener: push. Stack: `{`.',
      '3. `[` is an opener: push. Stack: `{[`.',
      '4. `(` is an opener: push. Stack: `{[(`, top is `(`.',
      '5. `)` is a closer; the top `(` matches, so pop. Stack: `{[`.',
      '6. `]` matches top `[`: pop. Stack: `{`.',
      '7. `}` matches top `{`: pop. Stack is empty.',
      '8. End of input and the stack is empty, so the string is balanced.',
    ],
  },
]
