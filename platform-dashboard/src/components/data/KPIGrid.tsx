import { motion } from 'framer-motion'
import { StatCard } from './StatCard'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KPIItem {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
}

interface KPIGridProps {
  items: KPIItem[]
  loading?: boolean
  columns?: 2 | 3 | 4
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function KPIGrid({ items, loading, columns = 4 }: KPIGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.1 },
        },
      }}
      className={cn('grid gap-4', columnClasses[columns])}
    >
      {loading
        ? Array.from({ length: columns }).map((_, i) => (
            <StatCard key={i} label="" value="" loading />
          ))
        : items.map((item, i) => (
            <StatCard key={item.label} {...item} delay={i * 0.05} />
          ))}
    </motion.div>
  )
}
