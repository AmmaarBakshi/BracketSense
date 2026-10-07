import type { IconName } from '../components/Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  /** Short description used by the menu drawer and Home feature cards. */
  blurb: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', blurb: 'Overview, progress and achievements' },
  { to: '/learn', label: 'Learn', icon: 'book', blurb: 'Eight short lessons with widgets' },
  { to: '/visualizer', label: 'Visualizer', icon: 'layers', blurb: 'Step through the algorithm like a debugger' },
  { to: '/playground', label: 'Playground', icon: 'flask', blurb: 'Paste code, break the algorithm, measure it' },
  { to: '/compare', label: 'Compare', icon: 'columns', blurb: 'Stack vs Counter vs Queue' },
  { to: '/quiz', label: 'Quiz', icon: 'quiz', blurb: 'Ten mixed questions per run' },
  { to: '/challenges', label: 'Challenges', icon: 'trophy', blurb: 'Five levels, stars and points' },
  { to: '/viva', label: 'Viva', icon: 'cap', blurb: 'Exam-ready answers and scripts' },
]
