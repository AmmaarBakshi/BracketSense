import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import './Modal.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Visually hide the title (it is still the dialog's accessible name). */
  hideTitle?: boolean
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Close when the backdrop is clicked. */
  dismissable?: boolean
  className?: string
  /** Slide in from the right instead of centring. */
  drawer?: boolean
}

/**
 * Accessible modal built on the native <dialog>: focus is trapped, the page
 * behind is inert, Esc closes it, and focus returns to the opener afterwards.
 */
export function Modal({ open, onClose, title, hideTitle, children, footer, size = 'md', dismissable = true, className, drawer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<Element | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => {
      onCloseRef.current()
      const el = opener.current as HTMLElement | null
      if (el && typeof el.focus === 'function' && document.contains(el)) el.focus()
    }
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onCloseRef.current()
    }
    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [])

  const classes = ['modal', `modal--${size}`, drawer ? 'modal--drawer' : '', className ?? ''].filter(Boolean).join(' ')

  return (
    <dialog
      ref={ref}
      className={classes}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (dismissable && e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="modal__panel">
          <header className="modal__header">
            <h2 id={titleId} className={hideTitle ? 'sr-only' : 'modal__title'}>
              {title}
            </h2>
            <button type="button" className="btn btn--ghost btn--sm modal__close" onClick={onClose}>
              <Icon name="x" />
              <span>Close</span>
            </button>
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
