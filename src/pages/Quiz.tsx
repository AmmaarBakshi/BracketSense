import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function QuizPage() {
  useDocumentTitle('Quiz')
  return <PageHeader tint="quiz" title="Quiz" />
}
