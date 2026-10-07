import type { Page } from '@playwright/test'

/** Skip the first-time intro (only on a fresh profile, so reloads keep real progress). */
export async function skipIntro(page: Page, theme?: 'light' | 'dark') {
  await page.addInitScript((t) => {
    if (!localStorage.getItem('bracketsense:progress')) localStorage.setItem('bracketsense:progress', JSON.stringify({ version: 1, introSeen: true }))
    if (t && !localStorage.getItem('bracketsense:settings:v1')) localStorage.setItem('bracketsense:settings:v1', JSON.stringify({ theme: t }))
  }, theme ?? null)
}

/** Replace the CodeMirror editor's content. */
export async function setEditor(page: Page, text: string) {
  const content = page.locator('.cm-content').first()
  await content.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Delete')
  await page.keyboard.insertText(text)
}

export async function openVisualizer(page: Page, opts: { predict?: boolean } = {}) {
  await page.goto('#/visualizer')
  await page.getByRole('toolbar', { name: 'Playback controls' }).waitFor()
  const predict = page.getByLabel('Predict first')
  if (opts.predict === false && (await predict.isChecked())) await predict.uncheck()
  if (opts.predict === true && !(await predict.isChecked())) await predict.check()
}

/** Text of every synced panel, used to prove that stepping back restores them exactly. */
export async function panelSnapshot(page: Page) {
  const text = async (sel: string) => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim()
  return {
    explain: await text('.vpanel--explain'),
    stack: await page.locator('.vpanel--stack .stackview__list').first().getAttribute('aria-label'),
    stackText: await text('.vpanel--stack'),
    pseudo: await text('.pseudo__line.is-current'),
    hud: await text('.vpanel--stats'),
    timeline: await text('.timeline__out'),
    flow: await page.locator('.flowchart__svg').first().getAttribute('aria-label'),
    current: await page.locator('.cm-bs-current').first().innerText().catch(() => ''),
    counts: await text('.vcounts'),
    tableRow: await text('.ttable__row.is-current'),
  }
}
