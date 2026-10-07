import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function ChallengesPage() {
  useDocumentTitle('Challenges')
  return <PageHeader tint="challenges" title="Challenges" />
}
