import { Suspense } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CreditCard,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Dumbbell,
  PauseCircle,
  ArrowRight
} from 'lucide-react'

interface MemberDashboardProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getMemberData = () => ({
  name: 'Ahmed Al-Rashid',
  membershipLevel: 'Premium',
  status: 'ACTIVE' as const,
  joinDate: '2025-01-15',
  expiryDate: '2026-01-15',
  checkInsThisMonth: 12,
  totalCheckIns: 45,
  upcomingClasses: [
    {
      id: '1',
      name: 'HIIT Training',
      instructor: 'Sarah Johnson',
      date: '2026-02-02',
      time: '06:00 AM',
      duration: 45
    },
    {
      id: '2',
      name: 'Yoga Flow',
      instructor: 'Maya Hassan',
      date: '2026-02-03',
      time: '07:30 AM',
      duration: 60
    },
    {
      id: '3',
      name: 'Strength Training',
      instructor: 'Mohammed Ali',
      date: '2026-02-04',
      time: '05:00 PM',
      duration: 50
    }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'CHECK_IN' as const,
      description: 'Checked in at Main Branch',
      timestamp: '2026-02-01T10:30:00Z'
    },
    {
      id: '2',
      type: 'PAYMENT' as const,
      description: 'Payment of 500 SAR processed',
      timestamp: '2026-01-31T14:20:00Z'
    },
    {
      id: '3',
      type: 'BOOKING' as const,
      description: 'Booked HIIT Training class',
      timestamp: '2026-01-30T09:15:00Z'
    },
    {
      id: '4',
      type: 'CHECK_IN' as const,
      description: 'Checked in at Main Branch',
      timestamp: '2026-01-29T18:00:00Z'
    }
  ],
  nextPaymentDate: '2026-02-15',
  nextPaymentAmount: 500
})

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function formatTime(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    numeric: 'auto'
  }).format(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  )
}

export default function MemberDashboard({ params: { locale } }: MemberDashboardProps) {
  const isArabic = locale === 'ar'
  const member = getMemberData()

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-300',
    EXPIRED: 'bg-red-100 text-red-800 border-red-300',
    FROZEN: 'bg-blue-100 text-blue-800 border-blue-300',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  const statusText = {
    ACTIVE: { en: 'Active', ar: 'نشط' },
    EXPIRED: { en: 'Expired', ar: 'منتهي' },
    FROZEN: { en: 'Frozen', ar: 'مجمد' },
    PENDING: { en: 'Pending', ar: 'قيد الانتظار' }
  }

  const activityIcons = {
    CHECK_IN: CheckCircle,
    PAYMENT: CreditCard,
    BOOKING: Calendar
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {isArabic ? `مرحباً، ${member.name}` : `Welcome back, ${member.name}`}
        </h1>
        <p className="text-white/90">
          {isArabic
            ? 'نتمنى لك تمريناً رائعاً اليوم!'
            : 'Ready for an amazing workout today?'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Membership Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'حالة العضوية' : 'Membership Status'}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                statusColors[member.status]
              }`}
            >
              {isArabic ? statusText[member.status].ar : statusText[member.status].en}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'نوع العضوية' : 'Membership Level'}
              </p>
              <p className="text-base font-medium text-gray-900">{member.membershipLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'تاريخ الانتهاء' : 'Expires On'}
              </p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(member.expiryDate, locale)}
              </p>
            </div>
          </div>
        </div>

        {/* Check-ins Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'الحضور' : 'Check-ins'}
            </h2>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'هذا الشهر' : 'This Month'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{member.checkInsThisMonth}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>
                {isArabic
                  ? `${member.totalCheckIns} إجمالي الحضور`
                  : `${member.totalCheckIns} total check-ins`}
              </span>
            </div>
          </div>
        </div>

        {/* Next Payment Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'الدفع القادم' : 'Next Payment'}
            </h2>
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'التاريخ' : 'Due Date'}
              </p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(member.nextPaymentDate, locale)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'المبلغ' : 'Amount'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {member.nextPaymentAmount} {isArabic ? 'ريال' : 'SAR'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isArabic ? 'الحصص القادمة' : 'Upcoming Classes'}
              </h2>
              <Link
                href={`/${locale}/member/classes`}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                {isArabic ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {member.upcomingClasses.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {isArabic ? 'لا توجد حصص محجوزة' : 'No upcoming classes'}
                </p>
                <Link
                  href={`/${locale}/member/classes`}
                  className="mt-3 inline-block text-primary hover:text-primary/80 text-sm font-medium"
                >
                  {isArabic ? 'احجز حصة الآن' : 'Book a class now'}
                </Link>
              </div>
            ) : (
              member.upcomingClasses.map((classItem) => (
                <div key={classItem.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">{classItem.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{classItem.instructor}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(classItem.date, locale)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {classItem.time} ({classItem.duration}{' '}
                            {isArabic ? 'دقيقة' : 'min'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {member.recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                </p>
              </div>
            ) : (
              member.recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type]
                return (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(activity.timestamp, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/${locale}/member/classes`}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-primary">
                {isArabic ? 'احجز حصة' : 'Book a Class'}
              </h3>
              <p className="text-sm text-gray-600">
                {isArabic ? 'احجز حصتك القادمة' : 'Reserve your next session'}
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/member/subscription/freeze`}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <PauseCircle className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-primary">
                {isArabic ? 'تجميد العضوية' : 'Freeze Membership'}
              </h3>
              <p className="text-sm text-gray-600">
                {isArabic ? 'طلب تجميد مؤقت' : 'Request temporary freeze'}
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/member/payment-methods`}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-primary">
                {isArabic ? 'طرق الدفع' : 'Payment Methods'}
              </h3>
              <p className="text-sm text-gray-600">
                {isArabic ? 'تحديث معلومات الدفع' : 'Update payment info'}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Important Notice (if any) */}
      {member.status === 'ACTIVE' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              {isArabic ? 'تذكير' : 'Reminder'}
            </h3>
            <p className="text-sm text-blue-700">
              {isArabic
                ? `دفعتك القادمة بتاريخ ${formatDate(member.nextPaymentDate, locale)}. تأكد من تحديث معلومات الدفع الخاصة بك.`
                : `Your next payment is due on ${formatDate(member.nextPaymentDate, locale)}. Make sure your payment information is up to date.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
