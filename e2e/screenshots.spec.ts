import { expect, test } from '@playwright/test'
import { openVisualizer, skipIntro } from './helpers.ts'

/**
 * Acceptance tests 10 and 12: both themes and three widths, captured to
 * docs/screenshots/ for review. The run also fails on any console error.
 */
const WIDTHS = [
  { name: 'mobile', width: 360, height: 780 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
] as const

for (const theme of ['light', 'dark'] as const) {
  for (const vp of WIDTHS) {
    test(`visualizer ${theme} ${vp.width}px`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await skipIntro(page, theme)
      await openVisualizer(page, { predict: false })
      await page.getByRole('button', { name: /Try a failing one/ }).click()
      const step = page.getByRole('button', { name: /^Step$/ }).first()
      for (let i = 0; i < 3; i++) await step.click()
      await page.waitForTimeout(700)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.screenshot({ path: `docs/screenshots/visualizer-${theme}-${vp.name}.png`, fullPage: vp.name !== 'mobile' })
      // no horizontal page scroll at any width
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)
      expect(errors).toEqual([])
    })
  }

  test(`home ${theme} 1280px`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await skipIntro(page, theme)
    await page.goto('#/')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `docs/screenshots/home-${theme}.png` })
  })
}
