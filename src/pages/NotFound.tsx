import { Link } from 'react-router'
import { Stacky } from '../components/art/Art'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <>
      <PageHeader
        tint="home"
        eyebrow="404"
        title="This page popped off the Stack"
        intro="The address does not match any page. Every opening bracket needs a matching closer, and every link needs a page."
        art={<Stacky mood="oops" />}
        actions={
          <Link className="btn btn--primary" to="/">
            Back to Home
          </Link>
        }
      />
    </>
  )
}
