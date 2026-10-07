# BracketSense

Client-side EdTech app that teaches how a **Stack** solves the **Balanced Brackets** problem.
Core promise: "Watch the Stack think." Full product spec: `SPEC.md`. Academic source of truth:
`DSA_REPORT.pdf` (case study "Balanced Parentheses Checker in a Code Editor").

Learning cycle used everywhere: Learn → Predict → Visualize → Explain → Experiment →
Make mistakes → Understand why → Quiz → Challenge. Teach WHY, not just WHAT.

## Stack

- React 19 + Vite 8 + TypeScript 6, React Router 7 (HashRouter, works offline / static hosting)
- CodeMirror 6 (`@codemirror/state|view|commands`) with custom decorations
- Plain CSS with CSS variables (`src/theme/`), one CSS file per component, no UI kit
- Vitest (unit, `tests/`), Playwright on system Chrome (e2e + screenshots, `e2e/`), oxlint
- localStorage only (progress, settings, last input). No backend, no network at runtime.

## Commands

```bash
npm run dev        # dev server
npm run build      # type-check (tsc -b) + production build into dist/
npm run preview    # serve dist/
npm test           # vitest run (core + learning unit tests)
npm run lint       # oxlint
npm run e2e        # playwright: acceptance + screenshots + axe a11y scans (builds and serves itself)
```

Run `npm run build` and `npm test` before every commit.

## Architecture rules

- `src/core/` is pure TypeScript. No React, no DOM, no CSS. Everything else depends on it.
  - `Stack.ts` real linked-list stack with O(1) immutable snapshots (structural sharing)
  - `bracketRules.ts` pairs / isOpening / isClosing / matches
  - `validator.ts` fast validation using `Stack`
  - `traceEngine.ts` deterministic snapshot generator: **the single source of truth** for the UI
  - `matcher.ts` pair map for hover/click matching (same stack logic as the validator)
  - `complexity.ts`, `alternatives.ts` (Counter / Queue / broken variants), `fixes.ts`, `generators.ts`
- The UI never re-implements the algorithm. Every panel renders `trace.steps[currentStepIndex]`.
  Forward, back, jump, timeline, table and animations all derive from the same array.
- Never fake state: stack pictures come from real `Stack` snapshots, charts from real runs.
- `src/learning/` holds course content and progress (lessons, quiz, challenges, viva,
  achievements, progress). Content may import `core/`; it must not import components
  (type-only imports are fine).
- `src/config/project.ts` holds student / guide / college details. `src/config/assets.ts`
  maps image slots to files in `public/assets/` (inline SVG fallback when a file is missing).

## Design rules

- Default theme is LIGHT and colourful: warm paper background, white cards, saturated accents.
  Dark mode is deep ink-navy (never pure black). Both must pass WCAG AA.
- Bracket colours are the visual language, used everywhere (editor, stack, flowchart, timeline, quiz):
  `( )` coral, `[ ]` teal, `{ }` amber. Brand accent indigo-blue. Success green, error red.
- Plus Jakarta Sans (UI) + JetBrains Mono (code), bundled via @fontsource for offline use.
- Rounded 14–20px cards, soft layered shadows, thick stack blocks, per-page tint bands.
- AVOID: neon gradients, glassmorphism, glowing orbs, sparkle icons, particle backgrounds, emoji overload.
- Motion is purposeful (push drop, pop lift, match burst, mismatch shake) and respects
  `prefers-reduced-motion`.
- Status is never colour-only: always icon + text. Every icon has a text label.

## Accessibility and performance

- Keyboard reachable everywhere, visible focus rings, ARIA live region announces each step.
- Layouts: desktop split IDE, tablet stacked, mobile tabs. Check at 360 / 768 / 1280+.
- 10k+ character inputs: memoized trace, virtualized timeline / table / deep stacks.

## Acceptance checklist (SPEC section 7) — verified by `npm test` + `npm run e2e`

- [x] 1. `{[()]}` balanced; every push/pop verified
- [x] 2. `([)]` fails exactly at `)` with WRONG_TYPE
- [x] 3. `((` UNCLOSED_OPENING (2 remain)
- [x] 4. `))` UNMATCHED_CLOSING at the first `)`
- [x] 5. `a[i] = (b + c) * {d - e}` balanced; ignored count correct
- [x] 6. Step forward/back restores all panels exactly
- [x] 7. Wrong prediction jumps to the failing step with explanation
- [x] 8. Compare on `([)]`: Stack correct, Counter wrong, Queue wrong
- [x] 9. Quiz scoring and best-score persistence
- [x] 10. Dark and light themes fully readable (screenshots checked)
- [x] 11. Refresh keeps progress, theme, last input
- [x] 12. Desktop / tablet / mobile layouts verified
- [x] 13. Every edge case in SPEC section 2 passes
- [x] 14. Lighthouse accessibility ≥ 90 on Home and Visualizer

## Git

- Small, focused commits with clear messages. No co-author trailers or tool attribution lines.
