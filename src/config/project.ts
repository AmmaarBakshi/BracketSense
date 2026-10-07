/**
 * Project details shown in "About this project", the footer and Presentation Mode.
 * Edit this one file to update names, guide and college. Empty strings are hidden in the UI.
 */
export const project = {
  appName: 'BracketSense',
  tagline: 'Learn • Visualize • Master Stacks',
  promise: 'Watch the Stack think.',

  /** Title of the project report (DSA_REPORT.pdf). */
  reportTitle: 'Balanced Parentheses Checker in a Code Editor',
  reportKind: 'Data Structures & Algorithms — Case Study Report',
  /** Path of the report inside public/ (opened from the About section). */
  reportFile: 'report/DSA_REPORT.pdf',

  students: ['Mohammed Hayat Azad', 'Rahin Khamkar', 'Ayaan Surve', 'Zombarkar Huzaifa', 'Umair Salmani'],

  /** Replace with your project guide, e.g. "Prof. A. Sharma". Leave '' to hide. */
  guide: 'Prof. (Guide name)',
  department: 'Department of Computer Engineering',
  /** Replace with your college / institute name. Leave '' to hide. */
  college: 'Your College Name',
  location: 'Mumbai, India',
  /** e.g. "2026–27". Leave '' to hide. */
  academicYear: '2026–27',
  subject: 'Data Structures & Algorithms',
} as const

export type ProjectInfo = typeof project
