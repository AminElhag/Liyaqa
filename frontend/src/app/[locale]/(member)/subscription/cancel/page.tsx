'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { XCircle, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react'

interface CancelSubscriptionPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getSubscriptionData = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  planName: 'Premium Monthly',
  planNameAr: 'الاشتراك الشهري المميز',
  amount: 500,
  currentPeriodEnd: '2026-02-15',
  canCancel: true
})

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const cancellationReasons = [
  { value: 'TOO_EXPENSIVE', en: 'Too expensive', ar: 'مكلف جداً' },
  { value: 'MOVING_AWAY', en: 'Moving away', ar: 'الانتقال إلى مكان آخر' },
  { value: 'NOT_USING', en: 'Not using enough', ar: 'لا أستخدمه بشكل كافٍ' },
  { value: 'POOR_SERVICE', en: 'Poor service quality', ar: 'جودة الخدمة سيئة' },
  { value: 'HEALTH_REASONS', en: 'Health reasons', ar: 'أسباب صحية' },
  { value: 'FOUND_ALTERNATIVE', en: 'Found alternative', ar: 'وجدت بديل' },
  { value: 'OTHER', en: 'Other', ar: 'أخرى' }
]

export default function CancelSubscriptionPage({
  params: { locale }
}: CancelSubscriptionPageProps) {
  const isArabic = locale === 'ar'
  const router = useRouter()
  const subscription = getSubscriptionData()

  const [selectedReason, setSelectedReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedReason) {
      alert(isArabic ? 'يرجى اختيار سبب الإلغاء' : 'Please select a cancellation reason')
      return
    }

    if (!confirmed) {
      alert(isArabic ? 'يرجى تأكيد رغبتك في الإلغاء' : 'Please confirm you want to cancel')
      return
    }

    setShowConfirmation(true)
  }

  const handleFinalConfirm = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Redirect to subscription page with cancellation message
    router.push(`/${locale}/member/subscription?cancelled=true`)
  }

  if (!subscription.canCancel) {
    return (
      <div className="space-y-6">
        <Link
          href={`/${locale}/member/subscription`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {isArabic ? 'العودة إلى الاشتراك' : 'Back to Subscription'}
        </Link>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isArabic ? 'لا يمكن الإلغاء' : 'Cannot Cancel'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isArabic
              ? 'لا يمكنك إلغاء اشتراكك في الوقت الحالي. يرجى الاتصال بالدعم للمساعدة.'
              : 'You cannot cancel your subscription at this time. Please contact support for assistance.'}
          </p>
          <Link
            href={`/${locale}/member/subscription`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            {isArabic ? 'العودة إلى الاشتراك' : 'Back to Subscription'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`/${locale}/member/subscription`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {isArabic ? 'العودة إلى الاشتراك' : 'Back to Subscription'}
      </Link>

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <XCircle className="h-8 w-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isArabic ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
          </h1>
        </div>
        <p className="text-gray-600">
          {isArabic ? 'نحن نأسف لرؤيتك تغادر' : "We're sorry to see you go"}
        </p>
      </div>

      {/* Warning Card */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <h3 className="font-medium text-red-900 mb-1">
            {isArabic ? 'تحذير هام' : 'Important Warning'}
          </h3>
          <ul className="text-red-700 space-y-1 list-disc list-inside">
            <li>
              {isArabic
                ? `سينتهي وصولك في ${formatDate(subscription.currentPeriodEnd, locale)}`
                : `Your access will end on ${formatDate(subscription.currentPeriodEnd, locale)}`}
            </li>
            <li>
              {isArabic
                ? 'سيتم إلغاء جميع الحجوزات المستقبلية'
                : 'All future bookings will be cancelled'}
            </li>
            <li>
              {isArabic
                ? 'لن يتم استرداد المبالغ المدفوعة'
                : 'No refunds will be issued for paid periods'}
            </li>
            <li>
              {isArabic
                ? 'ستفقد أي امتيازات خاصة أو خصومات'
                : 'You will lose any special privileges or discounts'}
            </li>
          </ul>
        </div>
      </div>

      {/* Alternative Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isArabic ? 'هل جربت هذه الخيارات؟' : 'Have you considered these options?'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/${locale}/member/subscription/freeze`}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">
              {isArabic ? '💤 تجميد الاشتراك' : '💤 Freeze Subscription'}
            </h3>
            <p className="text-sm text-gray-600">
              {isArabic
                ? 'أوقف اشتراكك مؤقتاً دون إلغائه'
                : 'Pause temporarily without cancelling'}
            </p>
          </Link>

          <Link
            href={`/${locale}/member/subscription/change-plan`}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">
              {isArabic ? '💰 تخفيض الخطة' : '💰 Downgrade Plan'}
            </h3>
            <p className="text-sm text-gray-600">
              {isArabic
                ? 'انتقل إلى خطة أقل تكلفة'
                : 'Switch to a more affordable plan'}
            </p>
          </Link>
        </div>
      </div>

      {/* Cancellation Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {isArabic ? 'يرجى إخبارنا بالسبب' : 'Please tell us why'}
          </h2>

          {/* Reason Selection */}
          <div className="space-y-3">
            {cancellationReasons.map((reason) => (
              <label
                key={reason.value}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  {isArabic ? reason.ar : reason.en}
                </span>
              </label>
            ))}
          </div>

          {/* Additional Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'ملاحظات إضافية (اختياري)' : 'Additional Feedback (Optional)'}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={
                isArabic
                  ? 'أخبرنا كيف يمكننا التحسين...'
                  : 'Tell us how we can improve...'
              }
            />
          </div>

          {/* Final Confirmation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
              />
              <label htmlFor="confirm" className="text-sm text-gray-700">
                {isArabic
                  ? `أؤكد أنني أريد إلغاء اشتراكي في ${isArabic ? subscription.planNameAr : subscription.planName}. أفهم أن وصولي سينتهي في ${formatDate(subscription.currentPeriodEnd, locale)} ولن يتم استرداد أي مبالغ.`
                  : `I confirm I want to cancel my ${subscription.planName} subscription. I understand my access will end on ${formatDate(subscription.currentPeriodEnd, locale)} and no refunds will be issued.`}
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/${locale}/member/subscription`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            {isArabic ? 'الاحتفاظ بالاشتراك' : 'Keep Subscription'}
          </Link>
          <button
            type="submit"
            disabled={!selectedReason || !confirmed}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <XCircle className="h-5 w-5" />
            {isArabic ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
          </button>
        </div>
      </form>

      {/* Final Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isArabic ? 'تأكيد نهائي' : 'Final Confirmation'}
              </h3>
              <p className="text-gray-600">
                {isArabic
                  ? 'هل أنت متأكد تماماً من رغبتك في إلغاء اشتراكك؟ هذا الإجراء لا يمكن التراجع عنه.'
                  : 'Are you absolutely sure you want to cancel your subscription? This action cannot be undone.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
              >
                {isArabic ? 'لا، العودة' : 'No, Go Back'}
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isArabic ? 'جاري الإلغاء...' : 'Cancelling...'}
                  </>
                ) : (
                  <>
                    {isArabic ? 'نعم، إلغاء' : 'Yes, Cancel'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
