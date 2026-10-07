import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { AssetImage } from '../components/AssetImage'
import { LogoMark } from '../components/art/Art'
import { Icon } from '../components/Icon'
import { project } from '../config/project'
import { NAV_ITEMS } from './nav'
import { useSettings } from './settings'
import { useUI } from './ui'
import { isTypingTarget } from './keyboard'
import type { LessonId } from '../learning/concepts'
import { LESSON_BY_ID } from '../learning/lessons'
import { visit } from '../learning/progress'
import { useProgress } from './progress'
import { HelpDialog } from './HelpDialog'
import { PresentationMode } from './PresentationMode'
import { IntroDialog } from './IntroDialog'
import { ResetDialog } from './ResetDialog'
import { VivaDrawer } from './VivaDrawer'
import '../components/viva/viva.css'
import './AppShell.css'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className="brand">
      <AssetImage slot="logo" alt="" fallback={<LogoMark size={36} />} className="brand__logo" eager />
      <span className="brand__text">
        <span className="brand__name">
          Bracket<span className="brand__accent">Sense</span>
        </span>
        {!compact && <span className="brand__tag">{project.tagline}</span>}
      </span>
    </span>
  )
}

function UtilityButtons({ onAction }: { onAction?: () => void }) {
  const { theme, toggleTheme } = useSettings()
  const ui = useUI()
  const run = (fn: () => void) => () => {
    onAction?.()
    fn()
  }
  return (
    <>
      <button
        type="button"
        className="btn btn--ghost topbar__util"
        onClick={run(toggleTheme)}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
      <button type="button" className="btn btn--ghost topbar__util" onClick={run(ui.openHelp)} aria-keyshortcuts="?">
        <Icon name="help" />
        <span>Help</span>
      </button>
      <button type="button" className="btn btn--ghost topbar__util" onClick={run(ui.openReset)}>
        <Icon name="trash" />
        <span>Reset</span>
      </button>
      <button type="button" className="btn btn--soft topbar__util" onClick={run(() => ui.openPresentation())}>
        <Icon name="monitor" />
        <span>Present</span>
      </button>
    </>
  )
}

function TopBar() {
  const { pathname } = useLocation()
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const menuOpen = openOn === pathname
  const setMenuOpen = (open: boolean) => setOpenOn(open ? pathname : null)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenOn(null)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <NavLink to="/" className="topbar__brand" aria-label="BracketSense home">
          <Brand />
        </NavLink>

        <nav className="topbar__nav" aria-label="Main">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className="navlink">
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="topbar__utils">
          <UtilityButtons />
        </div>

        <button
          ref={menuButton}
          type="button"
          className="btn btn--ghost topbar__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
          <span>Menu</span>
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <nav aria-label="Main (menu)">
          <ul className="mobile-menu__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className="mobile-menu__link">
                  <Icon name={item.icon} />
                  <span>
                    <strong>{item.label}</strong>
                    <span className="mobile-menu__blurb">{item.blurb}</span>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__utils">
          <UtilityButtons onAction={() => setMenuOpen(false)} />
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const people = project.students.join(', ')
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Brand />
          <p className="muted small">
            {project.promise} An interactive companion to the case study “{project.reportTitle}”. Works fully offline.
          </p>
        </div>
        <div>
          <h2 className="footer__heading">Explore</h2>
          <ul className="footer__links">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__heading">Project</h2>
          <p className="small muted footer__meta">
            {project.reportKind}
            <br />
            {people}
            {project.guide && (
              <>
                <br />
                Guide: {project.guide}
              </>
            )}
            <br />
            {[project.department, project.college, project.location].filter(Boolean).join(', ')}
          </p>
          <a className="small" href={`${import.meta.env.BASE_URL}${project.reportFile}`} target="_blank" rel="noreferrer">
            Read the project report (PDF)
          </a>
        </div>
      </div>
    </footer>
  )
}

export function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="page-loading__logo">
        <AssetImage slot="logo" alt="" fallback={<LogoMark size={56} />} eager />
      </span>
      <span className="muted">Loading…</span>
    </div>
  )
}

function visitLabel(pathname: string): string | null {
  const lesson = pathname.match(/^\/learn\/([\w-]+)$/)
  if (lesson) {
    const l = LESSON_BY_ID[lesson[1] as LessonId]
    return l ? `Lesson ${l.number}: ${l.title}` : null
  }
  if (pathname === '/') return null
  return NAV_ITEMS.find((n) => n.to === pathname)?.label ?? null
}

export function AppShell() {
  const { pathname } = useLocation()
  const ui = useUI()
  const { update } = useProgress()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // New page: start at the top and move focus to the content (screen readers hear the new page).
  useEffect(() => {
    window.scrollTo(0, 0)
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  // Remember the last learning page for "Continue where you left off".
  useEffect(() => {
    const label = visitLabel(pathname)
    if (label) update((p) => visit(p, pathname, label))
  }, [pathname, update])

  // "?" opens Help from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !ui.presentation.open && !isTypingTarget(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        ui.openHelp()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ui])

  // While Presentation Mode covers the screen, the page behind it is inert.
  const covered = ui.presentation.open

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
      >
        Skip to content
      </a>
      <div className="app__page" inert={covered}>
        <TopBar />
        <main id="main" ref={mainRef} tabIndex={-1} className="app__main">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <PresentationMode />
      <HelpDialog />
      <IntroDialog />
      <VivaDrawer />
      <ResetDialog />
    </div>
  )
}
