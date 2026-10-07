import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { AnnouncerProvider } from './app/announcer'
import { AppShell } from './app/AppShell'
import { ProgressProvider } from './app/progress'
import { SettingsProvider } from './app/settings'
import { ToastProvider } from './app/toast'
import { UIProvider } from './app/ui'

// Each page is its own chunk so the editor and charts only load where they are used.
const Home = lazy(() => import('./pages/Home'))
const Learn = lazy(() => import('./pages/Learn'))
const Visualizer = lazy(() => import('./pages/Visualizer'))
const Playground = lazy(() => import('./pages/Playground'))
const Compare = lazy(() => import('./pages/Compare'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Challenges = lazy(() => import('./pages/Challenges'))
const Viva = lazy(() => import('./pages/Viva'))
const NotFound = lazy(() => import('./pages/NotFound'))

export function App() {
  return (
    <SettingsProvider>
      <AnnouncerProvider>
        <ToastProvider>
          <ProgressProvider>
            <HashRouter>
              <UIProvider>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<Home />} />
                    <Route path="learn" element={<Learn />} />
                    <Route path="learn/:lessonId" element={<Learn />} />
                    <Route path="visualizer" element={<Visualizer />} />
                    <Route path="playground" element={<Playground />} />
                    <Route path="compare" element={<Compare />} />
                    <Route path="quiz" element={<Quiz />} />
                    <Route path="challenges" element={<Challenges />} />
                    <Route path="viva" element={<Viva />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </UIProvider>
            </HashRouter>
          </ProgressProvider>
        </ToastProvider>
      </AnnouncerProvider>
    </SettingsProvider>
  )
}
