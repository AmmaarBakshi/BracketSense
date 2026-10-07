/** True when a key event comes from somewhere the user is typing or operating a control. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return !!target.closest('input, textarea, select, .cm-editor, [contenteditable="true"]')
}

/** True when Space/Enter on this target would already activate a control. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return isTypingTarget(target) || !!target.closest('button, a[href], summary, [role="button"], [role="tab"], [role="slider"], input[type="range"]')
}
