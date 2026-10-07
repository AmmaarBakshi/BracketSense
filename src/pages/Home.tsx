import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function HomePage() {
  useDocumentTitle('Home')
  return <PageHeader tint="home" title="Home" />
}
