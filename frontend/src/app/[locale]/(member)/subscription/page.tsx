import Link from 'next/link'
import {
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  PauseCircle,
  XCircle,
  RefreshCw,
  FileText
} from 'lucide-react'

interface SubscriptionPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getSubscriptionData = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  planName: 'Premium Monthly',
  planNameAr: 'الاشتراك الشهري المميز',
  status: 'ACTIVE' as const,
  startDate: '2025-01-15',
  currentPeriodStart: '2026-01-15',
  currentPeriodEnd: '2026-02-15',
  nextBillingDate: '2026-02-15',
  amount: 500,
  currency: 'SAR',
  autoRenew: true,
  freezesRemaining: 2,
  freezesUsed: 0,
  totalFreezes: 2,
  canFreeze: true,
  canCancel: true,
  history: [
    {
      id: '1',
      event: 'SUBSCRIPTION_CREATED',
      description: 'Subscription activated',
      descriptionAr: 'تم تفعيل الاشتراك',
      date: '2025-01-15',
      amount: 500
    },
    {
      id: '2',
      event: 'PAYMENT_SUCCESS',
      description: 'Payment processed successfully',
      descriptionAr: 'تم معالجة الدفع بنجاح',
      date: '2026-01-15',
      amount: 500
    }
  ]
})

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function calculateDaysRemaining(endDate: string) {
  const now = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function SubscriptionPage({ params: { locale } }: SubscriptionPageProps) {
  const isArabic = locale === 'ar'
  const subscription = getSubscriptionData()
  const daysRemaining = calculateDaysRemaining(subscription.currentPeriodEnd)

  const statusConfig = {
    ACTIVE: {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      label: { en: 'Active', ar: 'نشط' }
    },
    FROZEN: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: PauseCircle,
      label: { en: 'Frozen', ar: 'مجمد' }
    },
    CANCELLED: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: XCircle,
      label: { en: 'Cancelled', ar: 'ملغي' }
    },
    EXPIRED: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: Clock,
      label: { en: 'Expired', ar: 'منتهي' }
    },
    PAST_DUE: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: AlertCircle,
      label: { en: 'Past Due', ar: 'متأخر' }
    }
  }

  const StatusIcon = statusConfig[subscription.status].icon

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isArabic ? 'إدارة الاشتراك' : 'Manage Subscription'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isArabic
            ? 'عرض وإدارة تفاصيل اشتراكك'
            : 'View and manage your subscription details'}
        </p>
      </div>

      {/* Subscription Overview Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {isArabic ? subscription.planNameAr : subscription.planName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 ${
                    statusConfig[subscription.status].color
                  }`}
                >
                  <StatusIcon className="h-4 w-4" />
                  {isArabic
                    ? statusConfig[subscription.status].label.ar
                    : statusConfig[subscription.status].label.en}
                </span>
                {subscription.autoRenew && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4" />
                    {isArabic ? 'تجديد تلقائي' : 'Auto-renew'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {subscription.amount} <span className="text-lg">{subscription.currency}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic ? 'شهرياً' : 'per month'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Period */}
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isArabic ? 'الفترة الحالية' : 'Current Period'}
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatDate(subscription.currentPeriodStart, locale)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isArabic ? 'إلى' : 'to'} {formatDate(subscription.currentPeriodEnd, locale)}
            </p>
          </div>

          {/* Next Billing */}
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isArabic ? 'الدفع القادم' : 'Next Billing'}
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {formatDate(subscription.nextBillingDate, locale)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {daysRemaining > 0
                ? `${daysRemaining} ${isArabic ? 'يوم متبقي' : 'days remaining'}`
                : isArabic
                ? 'اليوم'
                : 'Today'}
            </p>
          </div>

          {/* Freezes Available */}
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <PauseCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isArabic ? 'التجميد المتاح' : 'Freezes Available'}
              </span>
            </div>
            <p className="text-sm text-gray-900">
              {subscription.freezesRemaining} {isArabic ? 'من' : 'of'}{' '}
              {subscription.totalFreezes}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isArabic ? 'مستخدم' : 'Used'}: {subscription.freezesUsed}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subscription.canFreeze && (
          <Link
            href={`/${locale}/member/subscription/freeze`}
            className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <PauseCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary">
                {isArabic ? 'تجميد الاشتراك' : 'Freeze Subscription'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic ? 'إيقاف مؤقت للاشتراك' : 'Temporarily pause your membership'}
              </p>
            </div>
          </Link>
        )}

        <Link
          href={`/${locale}/member/subscription/change-plan`}
          className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <RefreshCw className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary">
              {isArabic ? 'تغيير الخطة' : 'Change Plan'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isArabic ? 'ترقية أو تخفيض الاشتراك' : 'Upgrade or downgrade your plan'}
            </p>
          </div>
        </Link>

        {subscription.canCancel && (
          <Link
            href={`/${locale}/member/subscription/cancel`}
            className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group"
          >
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 group-hover:text-red-600">
                {isArabic ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic ? 'إنهاء اشتراكك' : 'End your membership'}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Subscription History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isArabic ? 'سجل الاشتراك' : 'Subscription History'}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {subscription.history.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {isArabic ? 'لا يوجد سجل' : 'No history available'}
              </p>
            </div>
          ) : (
            subscription.history.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {isArabic ? event.descriptionAr : event.description}
                    </h3>
                    <p className="text-sm text-gray-600">{formatDate(event.date, locale)}</p>
                  </div>
                  {event.amount && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {event.amount} {subscription.currency}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-renewal Notice */}
      {subscription.autoRenew && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              {isArabic ? 'التجديد التلقائي مفعل' : 'Auto-renewal Enabled'}
            </h3>
            <p className="text-sm text-blue-700">
              {isArabic
                ? `سيتم تجديد اشتراكك تلقائياً في ${formatDate(subscription.nextBillingDate, locale)} بمبلغ ${subscription.amount} ${subscription.currency}. يمكنك إلغاء التجديد التلقائي في أي وقت.`
                : `Your subscription will automatically renew on ${formatDate(subscription.nextBillingDate, locale)} for ${subscription.amount} ${subscription.currency}. You can disable auto-renewal at any time.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
