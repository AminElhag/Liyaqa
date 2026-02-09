import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { format, subDays, startOfMonth, startOfQuarter } from 'date-fns'
import { cn } from '@/lib/utils'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const presets = [
  { label: 'Today', range: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 days', range: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', range: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This month', range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'This quarter', range: () => ({ from: startOfQuarter(new Date()), to: new Date() }) },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayText = value
    ? `${format(value.from, 'MMM d, yyyy')} — ${format(value.to, 'MMM d, yyyy')}`
    : 'Select date range'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{displayText}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-card p-2 shadow-lg">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onChange(preset.range())
                setOpen(false)
              }}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
