import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function ComparePage() {
  useDocumentTitle('Compare')
  return <PageHeader tint="compare" title="Compare" />
}
