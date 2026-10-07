import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../components/Icon'
import './toast.css'

export interface ToastInput {
  title: string
  body?: string
  icon?: IconName
  /** Optional visual (e.g. an achievement medal) shown instead of the icon. */
  visual?: ReactNode
  tone?: 'success' | 'info' | 'error'
}

interface Toast extends ToastInput {
  id: number
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (t: ToastInput) => {
      const id = next.current++
      setToasts((list) => [...list.slice(-3), { ...t, id }])
      window.setTimeout(() => dismiss(id), 6000)
    },
    [dismiss],
  )

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone ?? 'info'}`}>
            <span className="toast__visual">{t.visual ?? <Icon name={t.icon ?? 'info'} />}</span>
            <span className="toast__text">
              <strong>{t.title}</strong>
              {t.body && <span className="small">{t.body}</span>}
            </span>
            <button type="button" className="btn btn--ghost btn--sm toast__close" onClick={() => dismiss(t.id)} aria-label={`Dismiss: ${t.title}`}>
              <Icon name="x" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
