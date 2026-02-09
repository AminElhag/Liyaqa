import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/stores/toast-store'
import { useDirectionContext } from '@/hooks/use-direction-context'
import { cn } from '@/lib/utils'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'border-status-success bg-status-success-bg text-status-success',
  error: 'border-status-error bg-status-error-bg text-status-error',
  warning: 'border-status-warning bg-status-warning-bg text-status-warning',
  info: 'border-status-info bg-status-info-bg text-status-info',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const { isRtl } = useDirectionContext()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const pausedRef = useRef(false)

  useEffect(() => {
    function startTimer() {
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) removeToast(toast.id)
      }, 5000)
    }
    startTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [toast.id, removeToast])

  const Icon = iconMap[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isRtl ? -80 : 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? -80 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseEnter={() => {
        pausedRef.current = true
        if (timerRef.current) clearTimeout(timerRef.current)
      }}
      onMouseLeave={() => {
        pausedRef.current = false
        timerRef.current = setTimeout(() => removeToast(toast.id), 5000)
      }}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 shadow-lg',
        colorMap[toast.type],
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 end-4 z-[100] flex w-80 flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
