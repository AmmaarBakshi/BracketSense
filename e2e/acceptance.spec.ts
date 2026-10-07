import { expect, test } from '@playwright/test'
import { openVisualizer, panelSnapshot, setEditor, skipIntro } from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await skipIntro(page)
})

test('1. {[()]} is balanced and every push/pop happens in order', async ({ page }) => {
  await openVisualizer(page, { predict: false })
  await page.getByRole('button', { name: '{[()]}', exact: true }).click()
  const sizes: string[] = []
  const ops: string[] = []
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: 'Step', exact: true }).click()
    sizes.push(await page.locator('.vpanel--stack .stackview__footer strong').innerText())
    ops.push(await page.locator('.vpanel--explain .explain__head .badge').innerText())
  }
  expect(sizes).toEqual(['1', '2', '3', '2', '1', '0', '0'])
  expect(ops.map((o) => o.trim())).toEqual(['PUSH', 'PUSH', 'PUSH', 'POP', 'POP', 'POP', 'BALANCED'])
  await expect(page.locator('.result--ok')).toContainText('Balanced')
})

test('2. ([)] fails exactly at ) with WRONG_TYPE', async ({ page }) => {
  await openVisualizer(page, { predict: false })
  await page.getByRole('button', { name: /Try a failing one/ }).click()
  await page.getByRole('button', { name: 'Instant' }).click()
  await page.getByRole('button', { name: 'Run Trace ▶' }).click()
  const result = page.locator('.result--bad')
  await expect(result).toContainText('Wrong bracket type. Expected ], found ). The top of the Stack is [.')
  await expect(result).toContainText('line 1, column 3 (index 2)')
  await expect(page.locator('.cm-bs-error--primary')).toHaveText(')')
  await expect(page.locator('.cm-bs-tooltip')).toHaveText('Expected ], found )')
})

test('3. (( is UNCLOSED_OPENING with 2 remaining', async ({ page }) => {
  await openVisualizer(page, { predict: false })
  await page.getByRole('button', { name: '((', exact: true }).click()
  await page.getByRole('button', { name: 'Instant' }).click()
  await page.getByRole('button', { name: 'Run Trace ▶' }).click()
  await expect(page.locator('.result--bad')).toContainText('Unclosed opening brackets. 2 bracket(s) remain in the Stack')
})

test('4. )) is UNMATCHED_CLOSING at the first )', async ({ page }) => {
  await openVisualizer(page, { predict: false })
  await page.getByRole('button', { name: '))', exact: true }).click()
  await page.getByRole('button', { name: 'Instant' }).click()
  await page.getByRole('button', { name: 'Run Trace ▶' }).click()
  const result = page.locator('.result--bad')
  await expect(result).toContainText('Unmatched closing bracket. The Stack is empty, so there is nothing to match this character.')
  await expect(result).toContainText('line 1, column 1 (index 0)')
})

test('5. code example is balanced and the ignored count is correct', async ({ page }) => {
  await openVisualizer(page, { predict: false })
  await page.getByRole('button', { name: 'a[i] = (b + c) * {d - e}' }).click()
  await page.getByRole('button', { name: 'Instant' }).click()
  await page.getByRole('button', { name: 'Run Trace ▶' }).click()
  await expect(page.locator('.result--ok')).toContainText('Balanced')
  await expect(page.locator('.vcounts')).toContainText('24 / 24')
  await expect(page.locator('.vcounts')).toContainText('Ignored18')
})

test('6. stepping forward then back restores every panel exactly', async ({ page }) => {
  await openVisualizer(page, { predict: false })
  await page.getByRole('button', { name: '{[()]}', exact: true }).click()
  const step = page.getByRole('button', { name: 'Step', exact: true })
  // let one-off animations (push drop, pop burst) finish before comparing panels
  const settle = () => page.waitForTimeout(900)
  for (let i = 0; i < 4; i++) await step.click()
  await settle()
  const at4 = await panelSnapshot(page)
  await step.click()
  await settle()
  const at5 = await panelSnapshot(page)
  expect(at5).not.toEqual(at4)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await settle()
  expect(await panelSnapshot(page)).toEqual(at4)
  // keyboard: → then ← also round-trips
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowLeft')
  await settle()
  expect(await panelSnapshot(page)).toEqual(at4)
})

test('7. a wrong prediction lands on the failing step with an explanation', async ({ page }) => {
  await openVisualizer(page, { predict: true })
  await page.getByRole('button', { name: /Try a failing one/ }).click()
  await page.getByRole('button', { name: 'Instant' }).click()
  await page.getByRole('button', { name: 'Run Trace ▶' }).click()
  await page.getByRole('button', { name: 'Balanced', exact: true }).click()
  const result = page.locator('.result--bad')
  await expect(result).toContainText('Your prediction vs actual')
  await expect(result).toContainText("Don't worry. Now let's inspect the exact step where the prediction failed.")
  await expect(page.locator('.ptoolbar__count')).toHaveText('Step 3 / 3')
  await expect(page.locator('.vpanel--explain')).toContainText('The types do not match, so the sequence is invalid.')
  await page.getByRole('button', { name: 'Inspect Error' }).click()
  await expect(page.locator('.vpanel--explain .badge').first()).toContainText('ERROR')
})

test('8. Compare on ([)]: Stack correct, Counter wrong, Queue wrong', async ({ page }) => {
  await page.goto('#/compare')
  const step = page.getByRole('button', { name: 'Step', exact: true })
  while (await step.isEnabled()) await step.click()
  const rows = page.locator('table').first().locator('tbody tr')
  await expect(rows.nth(0)).toContainText('Stack (LIFO)')
  await expect(rows.nth(0)).toContainText('Correct')
  await expect(rows.nth(1)).toContainText('Counter')
  await expect(rows.nth(1)).toContainText('Wrong')
  await expect(rows.nth(2)).toContainText('Queue (FIFO)')
  await expect(rows.nth(2)).toContainText('Wrong')
})

test('9. quiz scoring and best-score persistence', async ({ page }) => {
  await page.goto('#/quiz')
  await page.getByRole('button', { name: /Start the quiz/ }).click()
  for (let i = 0; i < 10; i++) {
    const radios = page.getByRole('radio')
    if (await radios.count()) await radios.first().click()
    else if (await page.locator('.qfail__ch').count()) await page.locator('.qfail__ch').first().click()
    await page.getByRole('button', { name: 'Check answer' }).click()
    await page.getByRole('button', { name: /Next question|See results/ }).click()
  }
  const score = (await page.locator('.qresult__score').innerText()).replace(/\s/g, '')
  expect(score).toMatch(/^\d+\/10$/)
  await page.reload()
  await expect(page.locator('.qstart__stats')).toContainText(`Best score${score.replace('/', ' / ')}`)
})

test('11. refresh keeps progress, theme and last input', async ({ page }) => {
  await page.goto('#/learn/what-is-a-stack')
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await openVisualizer(page, { predict: false })
  await setEditor(page, '([]{})')
  await page.waitForTimeout(400)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('.cm-content')).toHaveText('([]{})')
  await page.goto('#/')
  await expect(page.locator('.yourprogress')).toContainText('Lessons completed1 / 8')
})
