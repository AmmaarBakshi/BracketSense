# Assets

BracketSense uses **image slots**. Each slot has a fixed name; to use your own picture, drop a
file with that name into `public/assets/` (any of `.png .jpg .jpeg .webp .avif .gif .svg`).
No code change is needed: a small Vite plugin (`build/studentAssets.ts`) lists the files in
`public/assets/` at build time (and live in `npm run dev`), and every slot without a file
falls back to a built-in inline SVG illustration. Missing slots never cause 404 requests.

Example: save your hero picture as `public/assets/hero.png`, run `npm run build`, done.

## What was provided

No standalone pictures were provided with the project, only the report (`DSA_REPORT.pdf`).
The report's two diagrams were cropped from the PDF at 180 dpi and are used as real
"original diagram from the project report" elements:

| File | What it shows | Where it is used |
| --- | --- | --- |
| `public/assets/report-stack-evolution.png` | Report Figure 1: stack evolution while scanning `{[()]}` | Lesson 3 (Push, Pop & Peek), Home → About this project, Presentation Mode title scene |
| `public/assets/report-flowchart.png` | Report Figure 2: the checker's decision flow | Lesson 5 (The Algorithm), Presentation Mode outro scene |
| `public/report/DSA_REPORT.pdf` | The full report | "Read the report (PDF)" links in About and the footer |

## Slots that use a fallback (needs replacement)

These slots currently show clean inline SVG art drawn for BracketSense. No photos were invented.
Replace any of them by adding a file with the slot name.

| Slot (file name) | Where it appears | Current fallback | Status |
| --- | --- | --- | --- |
| `logo` | Navbar, footer, loading screen, Presentation Mode | Stacked bracket blocks `( ) [ ] { }` | needs replacement (optional) |
| `hero` | Home hero, behind the live Stack demo | Code window feeding a stack | needs replacement |
| `mascot` | First-time intro, quiz start/results, challenge results, "Learn from this mistake", Visualizer result card | "Stacky", a friendly stack of three bracket blocks | needs replacement (optional) |
| `about` | Home → About this project (e.g. a team photo) | Report Figure 1 | needs replacement |
| `empty-stack` | Every empty Stack (Visualizer, lessons, hero) | Empty container outline | optional |
| `lesson-01` … `lesson-08` | Lesson headers and course cards | One abstract illustration per lesson | optional |
| `badge-stack-beginner`, `badge-lifo-master`, `badge-perfect-prediction`, `badge-error-detective`, `badge-fast-solver`, `badge-quiz-master`, `badge-challenge-complete` | Achievement medals (Home, unlock toasts) | Coloured medal with an icon | optional |

The browser-tab icon is `public/favicon.svg`; replace that file directly.

## Rules the app follows

- Pictures are never stretched: they are drawn with `object-fit: contain`.
- Every picture has alt text (decorative fallbacks are hidden from screen readers).
- Pictures load lazily, except the logo and hero which are above the fold.
- Keep files small (ideally under 300 KB). Large photos should be resized to ~1600 px wide and
  saved as `.webp` or `.jpg`.
- If a slot has several files (e.g. `hero.png` and `hero.svg`), the first in this order wins:
  `.svg`, `.webp`, `.avif`, `.png`, `.jpg`, `.jpeg`, `.gif`.
- The slot list lives in `src/config/assets.ts`.
