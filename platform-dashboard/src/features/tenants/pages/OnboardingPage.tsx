import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Building2,
  UserPlus,
  CreditCard,
  Settings,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/stores/toast-store'

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

interface StepDef {
  id: number
  label: string
  icon: typeof Building2
}

const steps: StepDef[] = [
  { id: 1, label: 'Facility Details', icon: Building2 },
  { id: 2, label: 'Admin Account', icon: UserPlus },
  { id: 3, label: 'Plan Selection', icon: CreditCard },
  { id: 4, label: 'Configuration', icon: Settings },
  { id: 5, label: 'Review & Launch', icon: ClipboardCheck },
]

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'SAR 500/mo',
    description: 'For small facilities getting started',
    features: ['Up to 200 members', '2 staff accounts', 'Basic scheduling', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 'SAR 2,500/mo',
    description: 'Best for growing facilities',
    features: ['Up to 2,000 members', '10 staff accounts', 'Advanced scheduling', 'Priority support', 'Analytics dashboard'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'SAR 7,500/mo',
    description: 'For large multi-location chains',
    features: ['Unlimited members', 'Unlimited staff', 'Multi-location', '24/7 support', 'Custom integrations', 'Dedicated CSM'],
  },
]

/* ------------------------------------------------------------------ */
/*  Horizontal Stepper                                                 */
/* ------------------------------------------------------------------ */

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all',
                step.id < currentStep
                  ? 'bg-status-success text-white'
                  : step.id === currentStep
                    ? 'bg-brand-accent text-white'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {step.id < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                step.id
              )}
              {/* Pulse ring for current step */}
              {step.id === currentStep && (
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-accent opacity-25" />
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-xs font-medium',
                step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-1 mb-5 h-px w-10 sm:mx-2 sm:w-16 lg:w-24',
                step.id < currentStep ? 'bg-status-success' : 'bg-border',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1: Facility Details                                           */
/* ------------------------------------------------------------------ */

function FacilityDetailsStep() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h2 className="text-lg font-semibold text-foreground">
        {t('onboarding.facilityDetails', 'Facility Details')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('onboarding.facilityDetailsDesc', 'Enter the basic information about the facility.')}
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('onboarding.facilityName', 'Facility Name')}
          </label>
          <input
            type="text"
            placeholder="e.g. Riyadh Fitness Hub"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('onboarding.region', 'Region')}
          </label>
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring">
            <option value="">{t('onboarding.selectRegion', 'Select region')}</option>
            <option value="riyadh">Riyadh</option>
            <option value="jeddah">Jeddah</option>
            <option value="dammam">Dammam</option>
            <option value="medina">Medina</option>
            <option value="khobar">Khobar</option>
            <option value="tabuk">Tabuk</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('onboarding.phone', 'Phone Number')}
          </label>
          <input
            type="tel"
            placeholder="+966 xx xxx xxxx"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2: Admin Account                                              */
/* ------------------------------------------------------------------ */

function AdminAccountStep() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h2 className="text-lg font-semibold text-foreground">
        {t('onboarding.adminAccount', 'Admin Account')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('onboarding.adminAccountDesc', 'Create the primary admin account for this facility.')}
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('onboarding.adminEmail', 'Admin Email')}
          </label>
          <input
            type="email"
            placeholder="admin@facility.sa"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('onboarding.adminName', 'Full Name')}
          </label>
          <input
            type="text"
            placeholder="e.g. Mohammed Al-Rashid"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 3: Plan Selection                                             */
/* ------------------------------------------------------------------ */

function PlanSelectionStep({
  selectedPlan,
  onSelect,
}: {
  selectedPlan: string
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {t('onboarding.selectPlan', 'Select a Plan')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('onboarding.selectPlanDesc', 'Choose the plan that best fits this facility.')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={cn(
              'relative rounded-xl border-2 p-5 text-start transition-all',
              selectedPlan === plan.id
                ? 'border-brand-accent bg-brand-accent/5 shadow-md'
                : 'border-border bg-card hover:border-muted-foreground/30',
            )}
          >
            {plan.recommended && (
              <span className="absolute -top-2.5 start-3 rounded-full bg-brand-accent px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                {t('onboarding.recommended', 'Recommended')}
              </span>
            )}
            <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
            <p className="mt-1 text-lg font-bold text-brand-accent">{plan.price}</p>
            <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
            <ul className="mt-4 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="h-3 w-3 text-status-success" />
                  {f}
                </li>
              ))}
            </ul>
            {selectedPlan === plan.id && (
              <div className="absolute end-3 top-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 4: Configuration                                              */
/* ------------------------------------------------------------------ */

function ConfigurationStep() {
  const { t } = useTranslation()
  const [toggles, setToggles] = useState({
    emailNotifications: true,
    smsAlerts: false,
    autoRenewal: true,
    twoFactor: true,
  })

  const toggleItems = [
    { key: 'emailNotifications' as const, label: t('onboarding.emailNotifications', 'Email Notifications'), desc: 'Send email notifications for important events' },
    { key: 'smsAlerts' as const, label: t('onboarding.smsAlerts', 'SMS Alerts'), desc: 'Send SMS alerts for critical updates' },
    { key: 'autoRenewal' as const, label: t('onboarding.autoRenewal', 'Auto-Renewal'), desc: 'Automatically renew the subscription' },
    { key: 'twoFactor' as const, label: t('onboarding.twoFactor', 'Two-Factor Auth'), desc: 'Require 2FA for admin accounts' },
  ]

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h2 className="text-lg font-semibold text-foreground">
        {t('onboarding.configuration', 'Configuration')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('onboarding.configurationDesc', 'Set up initial preferences for the facility.')}
      </p>
      <div className="space-y-4">
        {toggleItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={() => setToggles((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                toggles[item.key] ? 'bg-brand-accent' : 'bg-muted',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  toggles[item.key] ? 'translate-x-5.5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 5: Review & Launch                                            */
/* ------------------------------------------------------------------ */

function ReviewStep({ selectedPlan }: { selectedPlan: string }) {
  const { t } = useTranslation()
  const plan = plans.find((p) => p.id === selectedPlan) ?? plans[0]

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h2 className="text-lg font-semibold text-foreground">
        {t('onboarding.reviewLaunch', 'Review & Launch')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('onboarding.reviewDesc', 'Review all details before launching the facility.')}
      </p>
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('onboarding.facilityDetails', 'Facility Details')}
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('onboarding.name', 'Name')}</span>
              <span className="text-foreground">Riyadh Fitness Hub</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('onboarding.region', 'Region')}</span>
              <span className="text-foreground">Riyadh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('onboarding.phone', 'Phone')}</span>
              <span className="text-foreground">+966 11 234 5678</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('onboarding.adminAccount', 'Admin Account')}
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('onboarding.email', 'Email')}</span>
              <span className="text-foreground">admin@riyadhfitness.sa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('onboarding.fullName', 'Full Name')}</span>
              <span className="text-foreground">Mohammed Al-Rashid</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('onboarding.selectedPlan', 'Selected Plan')}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{plan.name}</span>
            <span className="text-sm font-bold text-brand-accent">{plan.price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Success Overlay                                                    */
/* ------------------------------------------------------------------ */

function SuccessOverlay({ onViewFacility, onBackToPipeline }: { onViewFacility: () => void; onBackToPipeline: () => void }) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-success-bg">
          <Rocket className="h-8 w-8 text-status-success" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">
          {t('onboarding.launchSuccess', 'Facility Launched!')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('onboarding.launchSuccessDesc', 'The facility has been successfully onboarded and is now active.')}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onViewFacility}
            className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
          >
            {t('onboarding.viewFacility', 'View Facility')}
          </button>
          <button
            onClick={onBackToPipeline}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t('onboarding.backToPipeline', 'Back to Pipeline')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [launched, setLaunched] = useState(false)

  // id used for routing context
  void id

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleLaunch = () => {
    toast.success(t('onboarding.launchToast', 'Facility launched successfully!'))
    setLaunched(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8 p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('onboarding.title', 'Onboard New Facility')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('onboarding.subtitle', 'Complete all steps to launch the facility.')}
        </p>
      </div>

      {/* Stepper */}
      <Stepper currentStep={currentStep} />

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && <FacilityDetailsStep />}
            {currentStep === 2 && <AdminAccountStep />}
            {currentStep === 3 && (
              <PlanSelectionStep
                selectedPlan={selectedPlan}
                onSelect={setSelectedPlan}
              />
            )}
            {currentStep === 4 && <ConfigurationStep />}
            {currentStep === 5 && <ReviewStep selectedPlan={selectedPlan} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors',
            currentStep === 1
              ? 'cursor-not-allowed opacity-40'
              : 'text-foreground hover:bg-muted',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('onboarding.back', 'Back')}
        </button>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
          >
            {t('onboarding.next', 'Next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            className="flex items-center gap-1.5 rounded-lg bg-status-success px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
          >
            <Rocket className="h-4 w-4" />
            {t('onboarding.launch', 'Launch Facility')}
          </button>
        )}
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {launched && (
          <SuccessOverlay
            onViewFacility={() => navigate(`/tenants/${id ?? '1'}`)}
            onBackToPipeline={() => navigate('/tenants')}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
