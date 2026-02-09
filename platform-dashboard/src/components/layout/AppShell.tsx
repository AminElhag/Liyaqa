import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CommandPalette } from './CommandPalette'
import { PageTransition } from './PageTransition'

export function AppShell() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
