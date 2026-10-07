import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { useVivaSearch } from '../components/viva/useVivaSearch'
import { VivaCardView } from '../components/viva/VivaCardView'
import { setVivaConfidence } from '../learning/progress'
import { useProgress } from './progress'
import { useUI } from './ui'

/** Viva slide-over, reachable from every page via the floating button or Help. */
export function VivaDrawer() {
  const ui = useUI()
  const { pathname } = useLocation()
  const { progress, update } = useProgress()
  const [query, setQuery] = useState('')
  const cards = useVivaSearch(query, 'All')

  return (
    <>
      {pathname !== '/viva' && !ui.presentation.open && (
        <button type="button" className="btn btn--soft viva-fab" onClick={ui.openViva}>
          <Icon name="cap" /> Viva help
        </button>
      )}
      <Modal open={ui.vivaOpen} onClose={ui.closeViva} title="Viva helper" drawer>
        <div className="vdrawer">
          <label className="field">
            <span className="field__label">Search the answers</span>
            <input className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. LIFO, queue, space" />
          </label>
          <Link to="/viva" className="btn btn--sm" onClick={ui.closeViva}>
            <Icon name="external" /> Open the full Viva page (practice mode)
          </Link>
          <div className="vdrawer__list">
            {cards.map((c) => (
              <VivaCardView key={c.id} card={c} practice={false} compact confidence={progress.viva[c.id]} onRate={(l) => update((p) => setVivaConfidence(p, c.id, l))} />
            ))}
            {cards.length === 0 && <p className="muted">No cards match “{query}”.</p>}
          </div>
        </div>
      </Modal>
    </>
  )
}
