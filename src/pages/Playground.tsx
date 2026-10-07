import { useSearchParams } from 'react-router'
import { Icon, type IconName } from '../components/Icon'
import { ComplexityLab } from '../components/lab/ComplexityLab'
import { PageHeader, useDocumentTitle } from '../components/PageHeader'
import { BreakTheAlgorithm } from '../components/playground/BreakTheAlgorithm'
import { Sandbox } from '../components/playground/Sandbox'
import '../components/compare/compare.css'
import './Playground.css'

type Tab = 'sandbox' | 'break' | 'complexity'

const TABS: Array<{ id: Tab; label: string; icon: IconName; intro: string }> = [
  { id: 'sandbox', label: 'Sandbox', icon: 'code', intro: 'Paste or upload any code. Live checks, matching pairs and verified fix suggestions.' },
  { id: 'break', label: 'Break the Algorithm', icon: 'bug', intro: 'Inject one bug at a time and watch exactly where the broken version goes wrong.' },
  { id: 'complexity', label: 'Complexity Lab', icon: 'chart', intro: 'Measure the real engine: operations grow with n, memory grows with nesting depth.' },
]

export default function PlaygroundPage() {
  useDocumentTitle('Playground')
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'sandbox') as Tab
  const current = TABS.find((t) => t.id === tab)!

  const select = (t: Tab) =>
    setParams(
      (p) => {
        p.set('tab', t)
        return p
      },
      { replace: true },
    )

  return (
    <>
      <PageHeader
        tint="playground"
        eyebrow={
          <>
            <Icon name="flask" /> Experiment · Make mistakes · Understand why
          </>
        }
        title="Playground"
        intro={current.intro}
      />
      <div className="page playground">
        <div className="ptabs" role="tablist" aria-label="Playground tools">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`ptab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`ppanel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              className="ptabs__tab"
              onClick={() => select(t.id)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                const i = TABS.findIndex((x) => x.id === tab)
                const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
                select(next.id)
                document.getElementById(`ptab-${next.id}`)?.focus()
              }}
            >
              <Icon name={t.icon} /> {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`ppanel-${tab}`} aria-labelledby={`ptab-${tab}`} className="ppanel">
          {tab === 'sandbox' && <Sandbox />}
          {tab === 'break' && <BreakTheAlgorithm />}
          {tab === 'complexity' && <ComplexityLab />}
        </div>
      </div>
    </>
  )
}
