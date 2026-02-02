'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PauseCircle, AlertCircle, Calendar, ArrowLeft, CheckCircle } from 'lucide-react'

interface FreezeSubscriptionPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getSubscriptionData = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  freezesRemaining: 2,
  totalFreezes: 2,
  currentPeriodEnd: '2026-02-15',
  minFreezeDays: 7,
  maxFreezeDays: 60
})

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function addDays(dateString: string, days: number) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export default function FreezeSubscriptionPage({ params: { locale } }: FreezeSubscriptionPageProps) {
  const isArabic = locale === 'ar'
  const router = useRouter()
  const subscription = getSubscriptionData()

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(14)
  const [reason, setReason] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const endDate = addDays(startDate, duration)
  const newBillingDate = addDays(subscription.currentPeriodEnd, duration)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      alert(isArabic ? 'يرجى الموافقة على الشروط' : 'Please agree to the terms')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Redirect to subscription page with success message
    router.push(`/${locale}/member/subscription?frozen=true`)
  }

  const canFreeze = subscription.freezesRemaining > 0

  if (!canFreeze) {
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isArabic ? 'لا يمكن التجميد' : 'Cannot Freeze'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isArabic
              ? 'لقد استخدمت جميع طلبات التجميد المتاحة لهذا الاشتراك.'
              : 'You have used all available freeze requests for this subscription.'}
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
          <PauseCircle className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isArabic ? 'تجميد الاشتراك' : 'Freeze Subscription'}
          </h1>
        </div>
        <p className="text-gray-600">
          {isArabic
            ? 'قم بإيقاف اشتراكك مؤقتاً دون فقدان الأيام المدفوعة'
            : 'Temporarily pause your subscription without losing paid days'}
        </p>
      </div>

      {/* Freeze Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <h3 className="font-medium text-blue-900 mb-1">
            {isArabic ? 'معلومات التجميد' : 'Freeze Information'}
          </h3>
          <ul className="text-blue-700 space-y-1 list-disc list-inside">
            <li>
              {isArabic
                ? `لديك ${subscription.freezesRemaining} طلبات تجميد متبقية`
                : `You have ${subscription.freezesRemaining} freeze requests remaining`}
            </li>
            <li>
              {isArabic
                ? `الحد الأدنى: ${subscription.minFreezeDays} أيام`
                : `Minimum: ${subscription.minFreezeDays} days`}
            </li>
            <li>
              {isArabic
                ? `الحد الأقصى: ${subscription.maxFreezeDays} يوم`
                : `Maximum: ${subscription.maxFreezeDays} days`}
            </li>
            <li>
              {isArabic
                ? 'سيتم تمديد فترة الاشتراك بعدد أيام التجميد'
                : 'Your subscription period will be extended by the freeze duration'}
            </li>
          </ul>
        </div>
      </div>

      {/* Freeze Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {isArabic ? 'تاريخ البدء' : 'Start Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {isArabic
                ? 'اختر التاريخ الذي تريد أن يبدأ فيه التجميد'
                : 'Choose when you want the freeze to start'}
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'المدة (بالأيام)' : 'Duration (days)'}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={subscription.minFreezeDays}
                max={subscription.maxFreezeDays}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-primary min-w-[60px] text-center">
                {duration}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>
                {subscription.minFreezeDays} {isArabic ? 'أيام' : 'days'}
              </span>
              <span>
                {subscription.maxFreezeDays} {isArabic ? 'يوم' : 'days'}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900 mb-3">
              {isArabic ? 'ملخص التجميد' : 'Freeze Summary'}
            </h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {isArabic ? 'تاريخ البدء:' : 'Start Date:'}
              </span>
              <span className="font-medium text-gray-900">{formatDate(startDate, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {isArabic ? 'تاريخ الانتهاء:' : 'End Date:'}
              </span>
              <span className="font-medium text-gray-900">{formatDate(endDate, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{isArabic ? 'المدة:' : 'Duration:'}</span>
              <span className="font-medium text-gray-900">
                {duration} {isArabic ? 'يوم' : 'days'}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {isArabic ? 'تاريخ الدفع القادم الجديد:' : 'New Next Billing Date:'}
                </span>
                <span className="font-semibold text-primary">
                  {formatDate(newBillingDate, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'السبب (اختياري)' : 'Reason (Optional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={
                isArabic
                  ? 'أخبرنا لماذا تريد تجميد اشتراكك...'
                  : 'Tell us why you want to freeze your subscription...'
              }
            />
          </div>

          {/* Agreement */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="agree" className="text-sm text-gray-700">
              {isArabic
                ? 'أفهم أن فترة اشتراكي ستمتد تلقائياً بعدد أيام التجميد، ولن يتم تحصيل أي رسوم خلال فترة التجميد.'
                : 'I understand that my subscription period will be automatically extended by the freeze duration, and no charges will be made during the freeze period.'}
            </label>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-medium text-yellow-900 mb-1">
                {isArabic ? 'تنبيه' : 'Important'}
              </h3>
              <p className="text-yellow-700">
                {isArabic
                  ? 'لن تتمكن من الوصول إلى المنشأة أو حجز الحصص خلال فترة التجميد. تأكد من إلغاء أي حجوزات حالية قبل التجميد.'
                  : 'You will not be able to access the facility or book classes during the freeze period. Make sure to cancel any existing bookings before freezing.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/${locale}/member/subscription`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Link>
          <button
            type="submit"
            disabled={!agreed || isSubmitting}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isArabic ? 'جاري التجميد...' : 'Freezing...'}
              </>
            ) : (
              <>
                <PauseCircle className="h-5 w-5" />
                {isArabic ? 'تأكيد التجميد' : 'Confirm Freeze'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
