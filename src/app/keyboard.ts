const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'email', 'number', 'password', 'url', 'tel'])

/** True when a key event comes from somewhere the user is typing text. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.closest('.cm-editor, textarea, select, [contenteditable="true"]')) return true
  return target instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(target.type)
}

/** True when the arrow keys already mean something for this control (sliders, tabs). */
export function usesArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (target instanceof HTMLInputElement && (target.type === 'range' || target.type === 'radio')) || !!target.closest('[role="tablist"], [role="slider"]')
}

/** True when Space/Enter on this target would already activate a control. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return isTypingTarget(target) || !!target.closest('button, a[href], summary, input, [role="button"], [role="tab"], [role="slider"]')
}
