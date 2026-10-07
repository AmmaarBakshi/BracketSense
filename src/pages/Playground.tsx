import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function PlaygroundPage() {
  useDocumentTitle('Playground')
  return <PageHeader tint="playground" title="Playground" />
}
