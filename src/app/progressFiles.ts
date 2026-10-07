import { exportProgress, importProgress, type ProgressState } from '../learning/progress'

/** Save progress as a JSON file (client-side download). */
export function downloadProgress(state: ProgressState): void {
  const blob = new Blob([exportProgress(state)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bracketsense-progress-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Read a progress JSON file chosen by the user. */
export async function readProgressFile(file: File) {
  const text = await file.text()
  return importProgress(text)
}
