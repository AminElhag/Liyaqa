import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import type { ReactNode } from 'react'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface ChartCardProps {
  title?: string
  subtitle?: string
  height?: number
  loading?: boolean
  children: ReactNode
  action?: ReactNode
}

function ChartCard({ title, subtitle, height = 300, loading, children, action }: ChartCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="animate-pulse rounded-lg bg-muted" style={{ height }} />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

interface AreaChartCardProps {
  data: Record<string, unknown>[]
  dataKeys: string[]
  xAxisKey?: string
  title?: string
  subtitle?: string
  height?: number
  loading?: boolean
  action?: ReactNode
}

export function AreaChartCard({ data, dataKeys, xAxisKey = 'name', title, subtitle, height, loading, action }: AreaChartCardProps) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} loading={loading} action={action}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        {dataKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ChartCard>
  )
}

interface BarChartCardProps {
  data: Record<string, unknown>[]
  dataKeys: string[]
  xAxisKey?: string
  title?: string
  subtitle?: string
  height?: number
  loading?: boolean
  action?: ReactNode
}

export function BarChartCard({ data, dataKeys, xAxisKey = 'name', title, subtitle, height, loading, action }: BarChartCardProps) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} loading={loading} action={action}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        {dataKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartCard>
  )
}

interface PieChartCardProps {
  data: Array<{ name: string; value: number }>
  title?: string
  subtitle?: string
  centerLabel?: string
  height?: number
  loading?: boolean
  action?: ReactNode
}

export function PieChartCard({ data, title, subtitle, centerLabel, height = 300, loading, action }: PieChartCardProps) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} loading={loading} action={action}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        {centerLabel && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-bold">
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ChartCard>
  )
}
