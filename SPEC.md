# BracketSense — MASTER SPEC

## 0. ROLE AND GOAL

You are a senior full-stack engineer, instructional designer and product designer. Build **BracketSense**, a complete, polished, fully working, client-side **EdTech learning platform** that teaches how a **Stack** solves the **Balanced Brackets problem**.

Core promise: **"Watch the Stack think."**

It must NOT feel like a bracket checker. It must feel like a real learning product: mini-course + algorithm debugger + visualizer + sandbox + quiz + challenges + viva prep, built around the student's project report and the student's own pictures.

Inputs you must use:
- The project report provided with this prompt. Read it first. Use its definitions, algorithm, pseudocode, flowchart, complexity analysis, examples, and terminology as the source of truth for lesson text, viva answers and the algorithm. If the report and this spec disagree on an algorithm detail, follow the report and note the difference in a short README section.
- The images provided in `/public/assets/` (see Section 6). Look at each image before designing so the UI palette and layout fit them.

Learning cycle to follow everywhere: **Learn → Predict → Visualize → Explain → Experiment → Make mistakes → Understand why → Quiz → Challenge.** Teach WHY, not just WHAT.

## 1. TECH AND ARCHITECTURE

- React + Vite + TypeScript. Plain CSS with CSS variables (or CSS Modules). Tailwind is optional; no heavy UI kits.
- SVG for the flowchart, stack and diagrams. Framer Motion allowed only if it clearly helps; otherwise CSS animations.
- CodeMirror 6 for the editor (preferred), with custom decorations for error underline, matching bracket highlight and current-character highlight.
- localStorage for progress, theme, settings. No backend, no auth, no database. Fully offline after build.
- Add only libraries that are truly needed.

Strict separation (no UI code inside these):

```
src/
  core/
    Stack.ts              // push, pop, peek, isEmpty, size, toArray (real data structure)
    bracketRules.ts       // pairs, isOpening, isClosing, matches
    validator.ts          // uses Stack, returns result
    traceEngine.ts        // deterministic snapshot generator
    matcher.ts            // pair map for hover/click matching (same logic as validator)
    complexity.ts         // op counting for the lab
  learning/
    lessons.ts, quiz.ts, challenges.ts, viva.ts, achievements.ts, progress.ts
  components/             // Editor, StackView, Flowchart, Pseudocode, Explain, Stats, Timeline, TraceTable, ...
  pages/                  // Home, Learn, Visualizer, Playground, Compare, Quiz, Challenges, Viva
  theme/                  // tokens, light/dark
  assets/ or public/assets/
tests/                    // Vitest unit tests for core/*
```

The visualizer must render from real `Stack` state and real trace snapshots. Never fake animation or hardcode stack pictures.

## 2. THE ALGORITHM (single source of truth)

Brackets handled: `() [] {}`. All other characters are ignored but counted.

```
for each character c:
    if c is opening: push c
    else if c is closing:
        if stack is empty: reject (UNMATCHED_CLOSING)
        if top does not match c: reject (WRONG_TYPE)
        pop
after loop:
    if stack empty: accept
    else reject (UNCLOSED_OPENING)
```

Trace snapshot per character (and one final snapshot for end-of-input):

```
step, char, charIndex, kind (opening|closing|ignored|end),
decision, operation (PUSH|POP|IGNORE|ERROR|ACCEPT|REJECT),
stackBefore[], stackAfter[], expected?, found?, matchedOpenIndex?,
flowchartNodeId, pseudocodeLine, explanation (human, WHY-style),
counters {scanned, processed, ignored, pushes, pops, size, maxSize},
error? {type, charIndex, expected, found, remainingCount}
```

Forward, backward, jump-to-step, timeline, table view and animations must all derive from this array. Instant mode computes the full trace immediately with no delays.

Explanations must be WHY-style:
- Not "POP" but: "`)` is a closing bracket and the top of the Stack is `(`, so they match. POP `(`."
- Not "Error" but: "The top of the Stack is `[`, but the current character is `)`. The types do not match, so the sequence is invalid."

Three distinct errors with exact messages:
- WRONG_TYPE: "Wrong bracket type. Expected `]`, found `)`. The top of the Stack is `[`."
- UNMATCHED_CLOSING: "Unmatched closing bracket. The Stack is empty, so there is nothing to match this character."
- UNCLOSED_OPENING: "Unclosed opening brackets. N bracket(s) remain in the Stack." (list them)

Must pass these edge cases (write Vitest tests): `""`, `()`, `[]`, `{}`, `(`, `)`, `([)]`, `{[()]}`, `(((`, `))`, `]`, `[(])`, `{[(])}`, `a[i] = (b + c) * {d - e}`. Empty input = balanced with a friendly note ("Nothing to check").

## 3. DESIGN DIRECTION — COLORFUL, WARM, NOT "AI-GENERIC"

Goal: a vibrant, friendly, professional EdTech product (think Duolingo's clarity + Brilliant's polish + Visualgo's function + a good code editor), NOT a generic dark neon "AI" dashboard.

Hard rules:
- **Default theme is LIGHT and colorful** (warm off-white paper background, white cards, saturated accents). Also ship a well-designed **Dark mode** (deep ink-navy, not pure black) and a toggle. Both must be fully polished and readable. Respect `prefers-color-scheme` on first visit, then remember the choice.
- **Bracket colors are the visual language** and are used consistently everywhere (editor, stack blocks, flowchart chips, timeline, quiz):
  - `( )` coral / tomato
  - `[ ]` teal / emerald
  - `{ }` amber / sunflower
  - plus one brand accent (indigo or blue) for primary buttons and navigation, one success green, one error red.
  Define them as CSS tokens for light and dark with AA contrast.
- Typography: a friendly geometric sans for UI (e.g. Plus Jakarta Sans or Sora) and JetBrains Mono for code. Large confident headings, generous spacing.
- Shapes: rounded 14–20px cards, soft layered shadows, thick friendly stack blocks, subtle section color bands (each Learn lesson and each page gets its own tint from the palette).
- AVOID: purple-to-blue neon gradients, glassmorphism glow, glowing orbs, "AI sparkle" icons, robotic gradients on every heading, cluttered particle backgrounds, Bootstrap look, emoji overload (emoji only as small nav/section markers or achievements, always with text labels).
- Use the student's pictures as real design elements (hero, lesson headers, empty states, achievement badges, result screens, favicon/logo), not as tiny decorations. Extract/derive palette harmony from them, but keep the bracket colors above fixed.
- Motion: purposeful only. Push = block drops in with a soft bounce; Pop = block lifts and fades out; Match = brief green check burst; Mismatch = red shake plus message. Respect `prefers-reduced-motion` (replace with fades/instant).

Brand: **BracketSense** — tagline **Learn • Visualize • Master Stacks**. Make a simple SVG logo (stacked brackets) unless the student's logo is provided in assets.

## 4. NAVIGATION AND PAGES

Top bar (sticky, active-section highlight, keyboard accessible): Home, Learn, Visualizer, Playground, Compare, Quiz, Challenges, Viva. Right side: Theme toggle, Help (shortcuts and tour), Reset progress (with confirm), Presentation Mode.

### 4.1 Home
- Hero: **"Watch a Stack Think"** with subtitle: "Learn how Stack data structures solve balanced-bracket problems through interactive visualization, prediction, experimentation, and challenges." Buttons: Start Learning, Open Visualizer, Take a Challenge. Hero contains a LIVE mini stack animation driven by the real engine (loops `{[()]}`), plus the student's hero image.
- Six feature cards: Learn, Visualize, Experiment, Quiz, Compare, Challenge.
- "Continue where you left off" card.
- **Your Progress** panel: lessons completed, quiz best score/accuracy, challenges completed, streak/score, concept checklist with progress bar.
- Achievements strip.
- "About this project" section summarizing the report (problem statement, objective, approach, complexity) so evaluators see the academic grounding. Include project/student/guide/college fields editable in one config file (`src/config/project.ts`) with sensible placeholders.

### 4.2 First-time intro (modal, once, skippable, replayable from Help)
"Why do we need a Stack?" Show `{ [ ( ) ] }`. Ask: "How can a computer know which opening bracket should be matched first?" Options: Counter, Queue, Stack. Correct (Stack): "Correct! The most recently opened bracket must be closed first. This is exactly the LIFO behavior of a Stack." Wrong: "Not quite. Let's see why." Then animate opening `( [ {` pushing, then closing `} ] )` popping with explanation. End with **Start Learning** and **Skip Introduction**.

### 4.3 Learn (mini-course with sidebar and completion tracking)
Lessons: 01 What is a Stack? · 02 LIFO · 03 Push & Pop (+Peek) · 04 Why Brackets Need a Stack · 05 The Algorithm · 06 Complexity · 07 Why Other Approaches Fail · 08 Practice.
Each lesson: short explanation, one interactive widget, "Check your understanding" mini-question, Mark complete / Next. Lesson 1 widget: working Stack with Push A/B/C, Pop, Peek, Clear, TOP pointer, operation log, empty/overflow-friendly messages. Lesson 2: plates analogy, then "`( [ {` — which closes first?" with explanation. Lesson 5 embeds the live flowchart + pseudocode with a mini trace. Lesson 6 embeds the Complexity Lab. Lesson 7 links into Compare and Break-the-Algorithm. Lesson 8 launches a guided practice. Pull wording from the report.

### 4.4 Visualizer (centerpiece, IDE layout)
Desktop grid: toolbar (Run ▶, Pause/Resume, Step ◀ ▶, Restart, Reset, Speed Slow/Normal/Fast/Instant, Presentation Mode) · Editor (left) + Stack Visualizer (right) · Flowchart (full width) · bottom tabs/panels: Explain, Pseudocode, Stats, Timeline, Trace (Visual | Table toggle).
Tablet: stack editor above visualization. Mobile: real tabs **Editor | Stack | Flow | Explain | Stats** (not a shrunk desktop).

Must include:
- Editor accepts bracket strings or real code (JS/C/Java style). Only `() [] {}` processed; show "Characters scanned / Brackets processed / Ignored". Line numbers, syntax-neutral highlighting with bracket colors, bracket-pair coloring.
- Synchronization: every step updates ALL of: current character in editor (highlight), stack, flowchart node glow, pseudocode line highlight, explanation panel, counters, timeline cursor, trace table row. One source of truth: `currentStepIndex`.
- Step Backward restores exact previous state of everything (debugger behavior).
- Timeline: clickable step chips colored by bracket type, with "Current" marker; color/icon-coded results (push, pop, ignore, error).
- Trace table: Step | Character | Decision | Action | Stack; current row highlighted; ignored characters collapsed by default with a "show ignored" toggle.
- "Why did this happen?" panel: Character → What did the algorithm see → What must it do → Stack top → Expected → Found → Plain-English explanation.
- Operation HUD: Characters Scanned, Brackets Processed, Pushes, Pops, Current Stack Size, Max Stack Size, Time O(n), Space O(k) with explanation "k = max number of unmatched opening brackets stored at a time."
- Stack visual: obviously labeled TOP pointer, color-coded thick blocks, push/pop/match/mismatch animations, empty-state illustration, scroll/compact mode for deep stacks (virtualize beyond ~30 items).
- Flowchart: SVG nodes exactly as below, edges labeled YES/NO, active node glows with its tier color, traversed path leaves a faded trail.

```
START → READ CHARACTER → OPENING BRACKET?
  YES → PUSH → NEXT
  NO → CLOSING BRACKET?
        NO → IGNORE → NEXT
        YES → STACK EMPTY?
               YES → ERROR (unmatched closing)
               NO → TOP MATCHES?
                      NO → ERROR (wrong type)
                      YES → POP → NEXT
NEXT → END OF INPUT?
        NO → READ CHARACTER
        YES → STACK EMPTY?
               YES → BALANCED ✓
               NO → ERROR (unclosed opening)
```

- Editor error highlighting: underline exact character with wavy red underline + gutter marker + tooltip ("Expected `]`, found `)`"), auto-scroll to offending character.
- Matching bracket feature: hover/click any bracket highlights its partner using the same validator logic; show "✓ Matching pair found" or "⚠ No matching bracket".
- Keyboard: Space play/pause, → step, ← step back, R reset, P presentation mode, ? help. Visible focus rings.
- Prediction Mode: before running, optional "Predict the result" (Balanced / Not Balanced). After the run show "Your Prediction vs Actual". If wrong: "Don't worry. Now let's inspect the exact step where the prediction failed." and jump to the failing step. Correct predictions feed the Perfect Prediction achievement.
- Result screen (success/fail, with exact messages from the original spec): Balanced shows pushes/pops/max stack/complexity and buttons Run Again, See Trace, Try Similar, Learn Why. Not Balanced shows mismatch position, expected/found, stack contents and buttons Inspect Error, Restart, Try Similar, Learn Why.
- "Visualize Nesting" (code-folding demo) after a successful nested structure: animate matched pairs folding inward from innermost to outermost, with explanation linking to how editors and parsers read nested code.
- Preloaded examples (one-click chips grouped by difficulty): `{[()]}`, `([)]`, `((`, `))`, `()`, `{[(])}`, `a[i] = (b + c) * {d - e}`, a realistic JS function, a C function with nested loops. Initial load: `{[()]}`, NOT auto-run, with banner "Ready? Let's watch the Stack think." and a **Run Trace ▶** button; also a visible "Try a failing one: `([)]`" shortcut.

### 4.5 Playground
Free sandbox: paste any code, upload a file (client-side read of .js/.c/.java/.py/.txt), live stats, matching-bracket explorer, "Fix suggestion" for errors (e.g. "Insert `]` before `)`" computed from the trace), share via copy-to-clipboard (encode input in the URL hash). Includes **Break the Algorithm** (Section 4.7) and **Complexity Lab**.

### 4.6 Compare — "Why not Queue or Counter?"
Same input (default `([)]`, editable) run through three REAL implementations side by side, step-synced with one shared scrubber:
- Stack: shows detection at `)` with TOP = `[`. Badge **✓ IDEAL**.
- Counter: shows counts `( →1, [ →2, ) →1, ] →0`; ends at 0 and wrongly says balanced. Explain: knows how many are open but not their type or order. Badge **⚠ INCOMPLETE**.
- Queue (FIFO): enqueue openings, dequeue on closing, show it matches `(` with `)` incorrectly in nested inputs like `{[()]}` (queue front is `{`, but `)` arrives first), so even valid input fails. Badge **✕ UNSUITABLE**.
Add a third mini-demo: a valid input where Queue fails and Counter passes, and an invalid input where Counter passes. Verdict summary table.

### 4.7 Break the Algorithm
Toggle faulty variants applied to the real validator: Use Counter only, Use Queue/FIFO, Ignore bracket types, Pop the wrong element (bottom instead of top), Skip the top check. Run on `([)]` (and other chosen inputs); show side-by-side "Correct vs Broken" traces with the exact step where the broken version diverges and a plain explanation of what the design rule protects. A "Test cases that expose this bug" list per variant.

### 4.8 Complexity Lab
- Time: run the real engine on generated inputs of size 10/100/1000/10000, plot operations vs n as a live SVG/Canvas chart (linear), plus "each character examined once" explanation.
- Space: user enters e.g. `((((((((((` and watches the Stack height chart grow; compare `()()()()()` (max size 1) vs `((((()))))` (max size 5) to explain why space is O(k), worst case O(n).

### 4.9 Quiz
Question bank (randomize order and options, 10 questions per run, tagged by concept), mixed types: balanced?, stack top?, what happens on this character (Push/Pop/Ignore/Error), first failing character, time complexity, why stack, drag-to-order stack operations, fix-the-string, "predict the stack after N steps" with a mini stack visual. After each answer: correct/incorrect (text + icon, not color only), explanation, relevant stack picture. Final: score, accuracy %, best score stored, weak-concept summary with links to the exact lesson. Include the six required questions from the original spec among them.

### 4.10 Challenges
Levels: Beginner (`()`, `[]`, `{}`), Easy (`([])`), Medium (`{[()]}`), Hard (`{[({})]}`), Expert (large nested + realistic code). Each: difficulty tag, points, attempts, predict step, trace, final explanation, stars. **Learn From Mistake** panel explains the exact concept missed. Also two challenge types: "Build a balanced string" (user types input that satisfies constraints, e.g. max stack size 3 and contains all three bracket types) and "Find the bug" (fix a broken code snippet). Scoring: points decrease with attempts/hints; hints available. Unlocks sequentially but "Skip" allowed after 3 attempts.

### 4.11 Viva Helper (page and slide-over everywhere)
Exam-ready cards, flip/reveal style with search and categories: What is a Stack, LIFO, Push, Pop, Peek, isEmpty, Why Stack for brackets, Why not Counter, Why not Queue, Time complexity O(n), Space complexity, Applications of Stack (expression evaluation, undo/redo, call stack, parser), Edge cases, Limitations, "Explain your project in 30 seconds" script, "Explain the algorithm step by step" script. "Practice mode" hides answers and lets the student self-rate; track confidence. Use the report for exact definitions.

### 4.12 Presentation Mode
Fullscreen clean view: large input with current character spotlight, large Stack, flowchart, explanation, result; hides nav; big controls; auto-play with adjustable speed; keyboard control (Space, arrows, Esc to exit); "Auto-Demo" that runs a 90-second scripted showcase (balanced example, failing example, compare) for evaluators.

### 4.13 Progress and Achievements
Track in localStorage (versioned key, safe parse, migration guard): lessons completed, quiz best/accuracy, challenges completed, concepts mastered, streak (day-based), predictions correct, achievements. Achievements (tasteful, text-labeled, use student art as badges when available): Stack Beginner, LIFO Master, Perfect Prediction, Error Detective, Fast Solver, Quiz Master, Challenge Complete. Reset progress with confirm. Export/Import progress as JSON.

## 5. ACCESSIBILITY, RESPONSIVENESS, PERFORMANCE

- Keyboard navigable everywhere, visible focus, ARIA labels/roles, live region announcing each step ("Pushed `[`, stack size 2"), tooltips, labels next to every icon, never color-only status, WCAG AA contrast in both themes, reduced-motion support.
- Desktop split IDE; tablet stacked; mobile tabbed. Test at 360px, 768px, 1280px+.
- Large inputs (10k+ chars) stay smooth: virtualized timeline/table, memoized trace, no thousands of animated DOM nodes, Instant mode skips delays but yields the correct final trace.

## 6. STUDENT ASSETS (IMPORTANT)

The student has provided pictures in `/public/assets/`. First, inspect ALL images and list them in a short `ASSETS.md` with: filename, what it shows, and where you will use it. Use them as follows (adapt to what actually exists):
- hero image or illustration → Home hero
- logo → navbar, favicon, loading state
- diagrams/flowchart/stack images made earlier → Learn lessons (as reference, "Original diagram from project report"), and Presentation Mode
- screenshots/photos → About this project, empty states
- character/mascot (if any) → intro modal, hints, result screens, achievements
Rules: never stretch or distort; add alt text; use `loading="lazy"`; compress oversized files if needed; if an expected image is missing, use a clean inline-SVG fallback and list it in `ASSETS.md` as "needs replacement". Do not invent fake photos.

## 7. QUALITY BAR AND ACCEPTANCE TESTS

Every visible button works. No placeholders, "coming soon", fake charts, static stack pictures, or dead links.

Manually and via Vitest verify:
1. `{[()]}` balanced; verify every push/pop.
2. `([)]` fails exactly at `)` with WRONG_TYPE.
3. `((` UNCLOSED_OPENING (2 remain).
4. `))` UNMATCHED_CLOSING at the first `)`.
5. `a[i] = (b + c) * {d - e}` balanced; ignored count correct.
6. Step forward/back restores all panels exactly.
7. Prediction: wrong prediction jumps to failing step with explanation.
8. Compare on `([)]`: Stack correct, Counter wrong, Queue wrong.
9. Quiz scoring and best score persistence.
10. Dark/Light fully readable; both themes screenshot-checked.
11. Refresh keeps progress, theme, last input.
12. Desktop/tablet/mobile layouts verified.
13. Edge cases list in Section 2 all pass.
14. Lighthouse accessibility ≥ 90 on Home and Visualizer.

Deliver: working app, `README.md` (run/build/test, folder map, how to swap images and project details, algorithm notes referencing the report), `ASSETS.md`, tests passing, and a short "Demo script for evaluators" in the README.
