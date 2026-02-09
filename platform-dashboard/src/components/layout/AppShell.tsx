import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
