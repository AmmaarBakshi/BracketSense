import { useNavigate } from 'react-router'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { useUI } from './ui'
import './HelpDialog.css'

const SHORTCUTS: Array<[keys: string[], action: string, where: string]> = [
  [['Space'], 'Play / pause the trace', 'Visualizer, Presentation'],
  [['→'], 'Step forward one character', 'Visualizer, Presentation'],
  [['←'], 'Step back (restores every panel)', 'Visualizer, Presentation'],
  [['R'], 'Reset to the start', 'Visualizer'],
  [['P'], 'Open Presentation Mode', 'Visualizer'],
  [['Esc'], 'Close a dialog / exit Presentation Mode', 'Everywhere'],
  [['?'], 'Open this help', 'Everywhere'],
  [['Tab'], 'Move between controls (focus ring shows where you are)', 'Everywhere'],
]

export function HelpDialog() {
  const ui = useUI()
  const navigate = useNavigate()

  return (
    <Modal open={ui.helpOpen} onClose={ui.closeHelp} title="Help & shortcuts" size="lg">
      <div className="help">
        <section aria-labelledby="help-keys">
          <h3 id="help-keys" className="help__h">
            <Icon name="keyboard" /> Keyboard shortcuts
          </h3>
          <p className="small muted">Shortcuts are ignored while you are typing in the editor or a text field.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Action</th>
                  <th scope="col">Where</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map(([keys, action, where]) => (
                  <tr key={action}>
                    <td>
                      {keys.map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </td>
                    <td>{action}</td>
                    <td className="muted">{where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="help-tour" className="help__tour">
          <h3 id="help-tour" className="help__h">
            <Icon name="map" /> Tours
          </h3>
          <div className="help__cards">
            <button type="button" className="help__card" onClick={ui.openIntro}>
              <Icon name="layers" />
              <span>
                <strong>Replay the introduction</strong>
                <span className="small muted">“Why do we need a Stack?” in one minute.</span>
              </span>
            </button>
            <button
              type="button"
              className="help__card"
              onClick={() => {
                ui.closeHelp()
                navigate('/visualizer?tour=1')
              }}
            >
              <Icon name="flag" />
              <span>
                <strong>Take the Visualizer tour</strong>
                <span className="small muted">What every panel shows and how they stay in sync.</span>
              </span>
            </button>
            <button
              type="button"
              className="help__card"
              onClick={() => {
                ui.closeHelp()
                ui.openViva()
              }}
            >
              <Icon name="cap" />
              <span>
                <strong>Open the Viva helper</strong>
                <span className="small muted">Exam-ready answers, searchable from any page.</span>
              </span>
            </button>
            <button type="button" className="help__card" onClick={() => ui.openPresentation(undefined, true)}>
              <Icon name="monitor" />
              <span>
                <strong>Run the 90-second Auto-Demo</strong>
                <span className="small muted">A scripted showcase for evaluators.</span>
              </span>
            </button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
