import { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  label: string
  value: string
}

interface FilterDef {
  id: string
  label: string
  options: FilterOption[]
}

interface FilterBarProps {
  filters: FilterDef[]
  activeFilters: Record<string, string[]>
  onChange: (filters: Record<string, string[]>) => void
  className?: string
}

function FilterDropdown({ filter, selected, onToggle }: { filter: FilterDef; selected: string[]; onToggle: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
          selected.length > 0
            ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
            : 'border-border text-foreground hover:bg-muted',
        )}
      >
        {filter.label}
        {selected.length > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-bg-inverse">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute start-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
          {filter.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterBar({ filters, activeFilters, onChange, className }: FilterBarProps) {
  const totalActive = Object.values(activeFilters).reduce((acc, v) => acc + v.length, 0)

  const handleToggle = (filterId: string, value: string) => {
    const current = activeFilters[filterId] ?? []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...activeFilters, [filterId]: next })
  }

  const handleClearAll = () => {
    const cleared: Record<string, string[]> = {}
    for (const f of filters) cleared[f.id] = []
    onChange(cleared)
  }

  const handleRemoveChip = (filterId: string, value: string) => {
    const current = activeFilters[filterId] ?? []
    onChange({ ...activeFilters, [filterId]: current.filter((v) => v !== value) })
  }

  const activeChips: Array<{ filterId: string; value: string; label: string }> = []
  for (const f of filters) {
    for (const v of activeFilters[f.id] ?? []) {
      const option = f.options.find((o) => o.value === v)
      if (option) activeChips.push({ filterId: f.id, value: v, label: `${f.label}: ${option.label}` })
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((filter) => (
          <FilterDropdown
            key={filter.id}
            filter={filter}
            selected={activeFilters[filter.id] ?? []}
            onToggle={(v) => handleToggle(filter.id, v)}
          />
        ))}
        {totalActive > 0 && (
          <button onClick={handleClearAll} className="text-xs text-muted-foreground hover:text-foreground">
            Clear all
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={`${chip.filterId}-${chip.value}`}
              className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-medium text-brand-accent"
            >
              {chip.label}
              <button onClick={() => handleRemoveChip(chip.filterId, chip.value)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
