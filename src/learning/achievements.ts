import type { IconName } from '../components/Icon'
import type { AssetSlot } from '../config/assets'
import { LESSON_ORDER } from './concepts'
import type { ProgressState } from './progress'

export type AchievementId =
  | 'stack-beginner'
  | 'lifo-master'
  | 'perfect-prediction'
  | 'error-detective'
  | 'fast-solver'
  | 'quiz-master'
  | 'challenge-complete'

export interface Achievement {
  id: AchievementId
  title: string
  /** How to earn it. */
  how: string
  icon: IconName
  color: 'round' | 'square' | 'curly' | 'brand' | 'success'
  badgeSlot: AssetSlot
  earned: (p: ProgressState, totalChallenges: number) => boolean
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'stack-beginner',
    title: 'Stack Beginner',
    how: 'Complete Lesson 1: What is a Stack?',
    icon: 'layers',
    color: 'round',
    badgeSlot: 'badge-stack-beginner',
    earned: (p) => !!p.lessons['what-is-a-stack']?.completed,
  },
  {
    id: 'lifo-master',
    title: 'LIFO Master',
    how: 'Complete all eight Learn lessons.',
    icon: 'book',
    color: 'square',
    badgeSlot: 'badge-lifo-master',
    earned: (p) => LESSON_ORDER.every((id) => p.lessons[id]?.completed),
  },
  {
    id: 'perfect-prediction',
    title: 'Perfect Prediction',
    how: 'Predict the result correctly 3 times in a row in the Visualizer.',
    icon: 'target',
    color: 'curly',
    badgeSlot: 'badge-perfect-prediction',
    earned: (p) => p.predictions.bestStreak >= 3,
  },
  {
    id: 'error-detective',
    title: 'Error Detective',
    how: 'Find the exact failing bracket 3 times (quiz, challenges or practice).',
    icon: 'search',
    color: 'round',
    badgeSlot: 'badge-error-detective',
    earned: (p) => p.errorsFound >= 3,
  },
  {
    id: 'fast-solver',
    title: 'Fast Solver',
    how: 'Solve a challenge on the first attempt without hints.',
    icon: 'zap',
    color: 'curly',
    badgeSlot: 'badge-fast-solver',
    earned: (p) => Object.values(p.challenges).some((c) => c.completed && c.attempts === 1 && c.hintsUsed === 0),
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    how: 'Score 9 or more out of 10 in a quiz.',
    icon: 'quiz',
    color: 'brand',
    badgeSlot: 'badge-quiz-master',
    earned: (p) => p.quiz.bestScore >= 9,
  },
  {
    id: 'challenge-complete',
    title: 'Challenge Complete',
    how: 'Solve every challenge (skipped ones do not count).',
    icon: 'trophy',
    color: 'success',
    badgeSlot: 'badge-challenge-complete',
    earned: (p, total) => total > 0 && Object.values(p.challenges).filter((c) => c.completed).length >= total,
  },
]

export const ACHIEVEMENT_BY_ID: Readonly<Record<AchievementId, Achievement>> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
  AchievementId,
  Achievement
>
