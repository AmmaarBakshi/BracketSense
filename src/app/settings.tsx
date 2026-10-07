import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readJson, writeJson } from '../learning/storage'

export type Theme = 'light' | 'dark'
export type Speed = 'slow' | 'normal' | 'fast' | 'instant'

export const SPEED_MS: Record<Speed, number> = { slow: 1300, normal: 750, fast: 280, instant: 0 }
export const SPEED_LABEL: Record<Speed, string> = { slow: 'Slow', normal: 'Normal', fast: 'Fast', instant: 'Instant' }

interface StoredSettings {
  /** Only set once the user picks a theme; until then we follow the OS. */
  theme?: Theme
  speed?: Speed
  predictMode?: boolean
}

export const SETTINGS_KEY = 'bracketsense:settings:v1'

interface SettingsValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  speed: Speed
  setSpeed: (s: Speed) => void
  predictMode: boolean
  setPredictMode: (on: boolean) => void
  reducedMotion: boolean
}

const SettingsContext = createContext<SettingsValue | null>(null)

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark'
const isSpeed = (v: unknown): v is Speed => v === 'slow' || v === 'normal' || v === 'fast' || v === 'instant'

function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredSettings>(() => {
    const raw = readJson<StoredSettings>(SETTINGS_KEY)
    return {
      theme: isTheme(raw?.theme) ? raw.theme : undefined,
      speed: isSpeed(raw?.speed) ? raw.speed : undefined,
      predictMode: typeof raw?.predictMode === 'boolean' ? raw.predictMode : undefined,
    }
  })
  const [osTheme, setOsTheme] = useState<Theme>(systemTheme)
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onDark = () => setOsTheme(dark.matches ? 'dark' : 'light')
    const onMotion = () => setReducedMotion(motion.matches)
    dark.addEventListener('change', onDark)
    motion.addEventListener('change', onMotion)
    return () => {
      dark.removeEventListener('change', onDark)
      motion.removeEventListener('change', onMotion)
    }
  }, [])

  const theme = stored.theme ?? osTheme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e1628' : '#fbf7f1')
  }, [theme])

  const update = useCallback((patch: Partial<StoredSettings>) => {
    setStored((prev) => {
      const next = { ...prev, ...patch }
      writeJson(SETTINGS_KEY, next)
      return next
    })
  }, [])

  const value = useMemo<SettingsValue>(
    () => ({
      theme,
      setTheme: (t) => update({ theme: t }),
      toggleTheme: () => update({ theme: theme === 'dark' ? 'light' : 'dark' }),
      speed: stored.speed ?? 'normal',
      setSpeed: (s) => update({ speed: s }),
      predictMode: stored.predictMode ?? true,
      setPredictMode: (on) => update({ predictMode: on }),
      reducedMotion,
    }),
    [theme, stored.speed, stored.predictMode, reducedMotion, update],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
