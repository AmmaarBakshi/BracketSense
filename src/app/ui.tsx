import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/** Global overlays that can be opened from anywhere (top bar, shortcuts, pages). */
interface UIValue {
  helpOpen: boolean
  openHelp: () => void
  closeHelp: () => void
  introOpen: boolean
  openIntro: () => void
  closeIntro: () => void
  resetOpen: boolean
  openReset: () => void
  closeReset: () => void
  vivaOpen: boolean
  openViva: () => void
  closeViva: () => void
  /** Presentation Mode: open with an optional input string. */
  presentation: { open: boolean; input?: string; autoDemo?: boolean }
  openPresentation: (input?: string, autoDemo?: boolean) => void
  closePresentation: () => void
}

const UIContext = createContext<UIValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [helpOpen, setHelp] = useState(false)
  const [introOpen, setIntro] = useState(false)
  const [resetOpen, setReset] = useState(false)
  const [vivaOpen, setViva] = useState(false)
  const [presentation, setPresentation] = useState<UIValue['presentation']>({ open: false })

  const openPresentation = useCallback((input?: string, autoDemo?: boolean) => {
    setHelp(false)
    setViva(false)
    setPresentation({ open: true, input, autoDemo })
  }, [])

  const value = useMemo<UIValue>(
    () => ({
      helpOpen,
      openHelp: () => setHelp(true),
      closeHelp: () => setHelp(false),
      introOpen,
      openIntro: () => {
        setHelp(false)
        setIntro(true)
      },
      closeIntro: () => setIntro(false),
      resetOpen,
      openReset: () => setReset(true),
      closeReset: () => setReset(false),
      vivaOpen,
      openViva: () => setViva(true),
      closeViva: () => setViva(false),
      presentation,
      openPresentation,
      closePresentation: () => setPresentation({ open: false }),
    }),
    [helpOpen, introOpen, resetOpen, vivaOpen, presentation, openPresentation],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}
