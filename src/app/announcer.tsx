import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Politeness = 'polite' | 'assertive'

const AnnounceContext = createContext<(message: string, politeness?: Politeness) => void>(() => {})

/**
 * Screen-reader live regions. `announce("Pushed [, stack size 2")` is read out
 * without moving focus. Repeated identical messages are still announced.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const flip = useRef(false)

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    // Toggle a zero-width suffix so identical consecutive messages re-announce.
    flip.current = !flip.current
    const text = message + (flip.current ? '​' : '')
    if (politeness === 'assertive') setAssertive(text)
    else setPolite(text)
  }, [])

  const value = useMemo(() => announce, [announce])

  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnounceContext.Provider>
  )
}

export function useAnnounce() {
  return useContext(AnnounceContext)
}
