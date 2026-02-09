import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [countdown, setCountdown] = useState(30)

  const handleOnline = useCallback(() => setIsOffline(false), [])
  const handleOffline = useCallback(() => {
    setIsOffline(true)
    setCountdown(30)
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  useEffect(() => {
    if (!isOffline) return
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.reload()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isOffline])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-status-error px-4 py-2.5 text-sm font-medium text-white"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="h-4 w-4" />
          <span>No internet connection. Retrying in {countdown}s...</span>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-white/30"
          >
            <RefreshCw className="h-3 w-3" />
            Retry Now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
