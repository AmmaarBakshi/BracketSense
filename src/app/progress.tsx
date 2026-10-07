import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Medal } from '../components/Medal'
import { ACHIEVEMENT_BY_ID, type AchievementId } from '../learning/achievements'
import { CHALLENGE_COUNT } from '../learning/challenges'
import { defaultProgress, loadProgress, saveProgress, withAchievements, type ProgressState } from '../learning/progress'
import { useAnnounce } from './announcer'
import { useToast } from './toast'

interface ProgressValue {
  progress: ProgressState
  /** Apply a pure update (see learning/progress.ts). Achievements are checked automatically. */
  update: (fn: (p: ProgressState) => ProgressState) => void
  reset: () => void
  replace: (p: ProgressState) => void
}

const ProgressContext = createContext<ProgressValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress)
  const toast = useToast()
  const announce = useAnnounce()
  const known = useRef<Set<string>>(new Set(Object.keys(progress.achievements)))

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((prev) => withAchievements(fn(prev), CHALLENGE_COUNT))
  }, [])

  // Persist, and celebrate achievements unlocked since the last render.
  useEffect(() => {
    saveProgress(progress)
    for (const id of Object.keys(progress.achievements) as AchievementId[]) {
      if (known.current.has(id)) continue
      known.current.add(id)
      const a = ACHIEVEMENT_BY_ID[id]
      toast({ title: `Achievement unlocked: ${a.title}`, body: a.how, tone: 'success', visual: <Medal achievement={a} /> })
      announce(`Achievement unlocked: ${a.title}`)
    }
  }, [progress, toast, announce])

  const reset = useCallback(() => {
    const fresh = { ...defaultProgress(), introSeen: true }
    known.current = new Set()
    setProgress(fresh)
  }, [])

  const replace = useCallback((p: ProgressState) => {
    known.current = new Set(Object.keys(p.achievements))
    setProgress(p)
  }, [])

  const value = useMemo(() => ({ progress, update, reset, replace }), [progress, update, reset, replace])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
