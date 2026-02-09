import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check, X, Plus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

interface PlanFeature {
  name: string
  free: boolean | string
  starter: boolean | string
  professional: boolean | string
  enterprise: boolean | string
}

interface Plan {
  id: string
  name: string
  price: string
  period: string
  limits: string
  tenantCount: number
  features: string[]
  style: {
    border: string
    bg: string
    text: string
    badge?: string
    badgeBg?: string
  }
  recommended?: boolean
}

const planList: Plan[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 'SAR 0',
    period: '14 days',
    limits: 'Up to 50 members',
    tenantCount: 2,
    features: [
      'Up to 50 members',
      '1 staff account',
      'Basic scheduling',
      'Email support',
    ],
    style: {
      border: 'border-border',
      bg: 'bg-muted/30',
      text: 'text-muted-foreground',
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'SAR 500',
    period: '/month',
    limits: 'Up to 200 members',
    tenantCount: 1,
    features: [
      'Up to 200 members',
      '2 staff accounts',
      'Basic scheduling',
      'Email support',
      'Member portal',
    ],
    style: {
      border: 'border-border',
      bg: 'bg-card',
      text: 'text-foreground',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 'SAR 2,500',
    period: '/month',
    limits: 'Up to 2,000 members',
    tenantCount: 2,
    features: [
      'Up to 2,000 members',
      '10 staff accounts',
      'Advanced scheduling',
      'Priority support',
      'Analytics dashboard',
      'Member portal',
      'API access',
    ],
    recommended: true,
    style: {
      border: 'border-brand-accent',
      bg: 'bg-card',
      text: 'text-foreground',
      badge: 'Recommended',
      badgeBg: 'bg-brand-accent',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'SAR 7,500',
    period: '/month',
    limits: 'Unlimited members',
    tenantCount: 1,
    features: [
      'Unlimited members',
      'Unlimited staff',
      'Multi-location',
      '24/7 dedicated support',
      'Custom integrations',
      'Dedicated CSM',
      'Advanced analytics',
      'SLA guarantee',
    ],
    style: {
      border: 'border-border',
      bg: 'bg-foreground dark:bg-card',
      text: 'text-background dark:text-foreground',
    },
  },
]

const featureMatrix: PlanFeature[] = [
  { name: 'Max Members', free: '50', starter: '200', professional: '2,000', enterprise: 'Unlimited' },
  { name: 'Staff Accounts', free: '1', starter: '2', professional: '10', enterprise: 'Unlimited' },
  { name: 'Scheduling', free: 'Basic', starter: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
  { name: 'Member Portal', free: false, starter: true, professional: true, enterprise: true },
  { name: 'Analytics Dashboard', free: false, starter: false, professional: true, enterprise: true },
  { name: 'API Access', free: false, starter: false, professional: true, enterprise: true },
  { name: 'Multi-location', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Custom Integrations', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Dedicated CSM', free: false, starter: false, professional: false, enterprise: true },
  { name: 'SLA Guarantee', free: false, starter: false, professional: false, enterprise: true },
  { name: 'Email Support', free: true, starter: true, professional: true, enterprise: true },
  { name: 'Priority Support', free: false, starter: false, professional: true, enterprise: true },
  { name: '24/7 Support', free: false, starter: false, professional: false, enterprise: true },
]

/* ------------------------------------------------------------------ */
/*  Plan Card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const isEnterprise = plan.id === 'enterprise'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        'relative flex flex-col rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg',
        plan.style.border,
        plan.style.bg,
      )}
    >
      {/* Recommended badge */}
      {plan.style.badge && (
        <span
          className={cn(
            'absolute -top-3 start-4 flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold text-white',
            plan.style.badgeBg,
          )}
        >
          <Star className="h-3 w-3" />
          {plan.style.badge}
        </span>
      )}

      {/* Plan name */}
      <h3 className={cn('text-lg font-bold', plan.style.text)}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mt-2">
        <span className={cn('text-3xl font-extrabold', plan.recommended ? 'text-brand-accent' : plan.style.text)}>
          {plan.price}
        </span>
        <span className={cn('text-sm', isEnterprise ? 'text-background/60 dark:text-muted-foreground' : 'text-muted-foreground')}>
          {plan.period}
        </span>
      </div>

      {/* Limits */}
      <p className={cn('mt-1 text-xs', isEnterprise ? 'text-background/60 dark:text-muted-foreground' : 'text-muted-foreground')}>
        {plan.limits}
      </p>

      {/* Divider */}
      <div className={cn('my-4 h-px', isEnterprise ? 'bg-background/20 dark:bg-border' : 'bg-border')} />

      {/* Features list */}
      <ul className="flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className={cn('flex items-center gap-2 text-sm', plan.style.text)}>
            <Check className={cn('h-4 w-4 shrink-0', plan.recommended ? 'text-brand-accent' : 'text-status-success')} />
            {feature}
          </li>
        ))}
      </ul>

      {/* Tenant count */}
      <div className={cn(
        'mt-4 rounded-lg p-2 text-center text-xs font-medium',
        isEnterprise
          ? 'bg-background/10 text-background dark:bg-muted dark:text-muted-foreground'
          : 'bg-muted text-muted-foreground',
      )}>
        {plan.tenantCount} {plan.tenantCount === 1 ? 'tenant' : 'tenants'} on this plan
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Feature Cell                                                       */
/* ------------------------------------------------------------------ */

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-foreground">{value}</span>
  }
  if (value) {
    return <Check className="mx-auto h-4 w-4 text-status-success" />
  }
  return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PlansPage() {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8 p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('plans.title', 'Subscription Plans')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plans.subtitle', 'Manage pricing plans and feature tiers.')}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover">
          <Plus className="h-4 w-4" />
          {t('plans.createPlan', 'Create Plan')}
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {planList.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} index={i} />
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t('plans.featureComparison', 'Feature Comparison')}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="sticky start-0 z-10 bg-muted/50 px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('plans.feature', 'Feature')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Free Trial
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Starter
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-accent">
                  Professional
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {featureMatrix.map((feature, i) => (
                <tr
                  key={feature.name}
                  className={cn(
                    'border-b border-border transition-colors hover:bg-muted/30',
                    i === featureMatrix.length - 1 && 'border-0',
                  )}
                >
                  <td className="sticky start-0 z-10 bg-card px-4 py-3 font-medium text-foreground">
                    {feature.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <FeatureCell value={feature.free} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <FeatureCell value={feature.starter} />
                  </td>
                  <td className="border-x border-brand-accent/20 bg-brand-accent/5 px-4 py-3 text-center">
                    <FeatureCell value={feature.professional} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <FeatureCell value={feature.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
