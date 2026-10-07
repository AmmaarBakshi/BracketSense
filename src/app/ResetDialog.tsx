import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { downloadProgress } from './progressFiles'
import { useProgress } from './progress'
import { useToast } from './toast'
import { useUI } from './ui'

export function ResetDialog() {
  const ui = useUI()
  const { progress, reset } = useProgress()
  const toast = useToast()

  return (
    <Modal
      open={ui.resetOpen}
      onClose={ui.closeReset}
      title="Reset all progress?"
      size="sm"
      footer={
        <>
          <button type="button" className="btn" onClick={ui.closeReset}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              reset()
              ui.closeReset()
              toast({ title: 'Progress reset', body: 'Lessons, scores and achievements were cleared.', icon: 'trash' })
            }}
          >
            <Icon name="trash" />
            Reset progress
          </button>
        </>
      }
    >
      <div className="stack-v">
        <p>
          This clears completed lessons, quiz scores, challenges, predictions, achievements and viva ratings stored in this browser. Your theme and
          editor text are kept.
        </p>
        <p className="small muted">Want a copy first? Export your progress as a JSON file; you can import it again later from Help.</p>
        <div>
          <button type="button" className="btn btn--sm" onClick={() => downloadProgress(progress)}>
            <Icon name="download" />
            Export progress first
          </button>
        </div>
      </div>
    </Modal>
  )
}
