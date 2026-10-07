import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { skipIntro } from './helpers.ts'

/** WCAG 2.1 AA scan (axe-core) of every page, in both themes, with the intro dismissed. */
const PAGES = ['/', '/learn', '/learn/algorithm', '/visualizer', '/playground', '/playground?tab=break', '/playground?tab=complexity', '/compare', '/quiz', '/challenges', '/challenges?c=b1', '/viva']

for (const theme of ['light', 'dark'] as const) {
  for (const path of PAGES) {
    test(`a11y ${theme} ${path}`, async ({ page }) => {
      await skipIntro(page, theme)
      await page.goto(`#${path}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(600)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(' ')} — ${v.nodes[0]?.failureSummary?.split('\n')[1] ?? ''}`)
      expect(summary).toEqual([])
    })
  }
}
