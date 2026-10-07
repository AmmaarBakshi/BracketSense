import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function VisualizerPage() {
  useDocumentTitle('Visualizer')
  return <PageHeader tint="visualizer" title="Visualizer" />
}
