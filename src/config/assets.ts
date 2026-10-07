import studentAssets from 'virtual:student-assets'

/**
 * Image slots. To use your own picture, drop a file named after the slot into
 * public/assets/ (any of .png .jpg .jpeg .webp .avif .gif .svg), e.g.
 * public/assets/hero.png — no code change needed. Slots without a file use the
 * built-in SVG illustration. See ASSETS.md for the full list.
 */
export const ASSET_SLOTS = {
  logo: 'Logo: navbar, loading screen',
  hero: 'Home hero illustration',
  mascot: 'Mascot: intro, hints, result screens',
  about: 'About this project: team / report photo or screenshot',
  'empty-stack': 'Empty-stack illustration',
  'report-stack-evolution': 'Report Figure 1: stack evolution for {[()]}',
  'report-flowchart': 'Report Figure 2: decision-flow diagram',
  'lesson-01': 'Lesson 1 header',
  'lesson-02': 'Lesson 2 header',
  'lesson-03': 'Lesson 3 header',
  'lesson-04': 'Lesson 4 header',
  'lesson-05': 'Lesson 5 header',
  'lesson-06': 'Lesson 6 header',
  'lesson-07': 'Lesson 7 header',
  'lesson-08': 'Lesson 8 header',
  'badge-stack-beginner': 'Achievement badge',
  'badge-lifo-master': 'Achievement badge',
  'badge-perfect-prediction': 'Achievement badge',
  'badge-error-detective': 'Achievement badge',
  'badge-fast-solver': 'Achievement badge',
  'badge-quiz-master': 'Achievement badge',
  'badge-challenge-complete': 'Achievement badge',
} as const

export type AssetSlot = keyof typeof ASSET_SLOTS

/** URL of the student's picture for a slot, or null when the slot uses the SVG fallback. */
export function assetUrl(slot: AssetSlot): string | null {
  const file = studentAssets[slot]
  return file ? `${import.meta.env.BASE_URL}${file}` : null
}
