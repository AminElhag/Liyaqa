import { useState, useEffect } from 'react'
import { Eye, X } from 'lucide-react'
import { useImpersonationStore } from '@/stores/impersonation-store'

const SESSION_DURATION_MS = 30 * 60 * 1000 // 30 minutes

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function ImpersonationBar() {
  const { active, facilityName, startTime, end } = useImpersonationStore()
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    if (!active || !startTime) return

    const tick = () => {
      const elapsed = Date.now() - startTime
      const left = Math.max(0, SESSION_DURATION_MS - elapsed)
      setRemaining(formatCountdown(left))
      if (left <= 0) {
        end()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [active, startTime, end])

  if (!active) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-4 bg-gradient-to-r from-brand-accent to-orange-400 px-4 py-2 text-sm font-medium text-bg-inverse">
      <Eye className="h-4 w-4" />
      <span>
        Viewing as <span className="font-bold">{facilityName}</span>
      </span>
      <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">Read-only</span>
      <span className="font-mono text-xs tabular-nums">{remaining}</span>
      <button
        onClick={end}
        className="flex items-center gap-1 rounded-lg bg-black/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-black/30"
      >
        <X className="h-3 w-3" />
        End Session
      </button>
    </div>
  )
}
