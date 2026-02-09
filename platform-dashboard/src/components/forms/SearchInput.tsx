import { useState, useCallback, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  loading?: boolean
  className?: string
}

export function SearchInput({ onChange, placeholder = 'Search...', debounceMs = 300, loading, className }: SearchInputProps) {
  const [value, setValue] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = useCallback(
    (val: string) => {
      setValue(val)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => onChange(val), debounceMs)
    },
    [onChange, debounceMs],
  )

  const handleClear = () => {
    setValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background py-2 pe-9 ps-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
      />
      <div className="absolute end-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : value ? (
          <button onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
