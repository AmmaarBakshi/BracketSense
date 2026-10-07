import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function LearnPage() {
  useDocumentTitle('Learn')
  return <PageHeader tint="learn" title="Learn" />
}
