import { ReactNode } from 'react'
import Link from 'next/link'
import {
  Home,
  CreditCard,
  Calendar,
  User,
  FileText,
  Settings,
  LogOut
} from 'lucide-react'

interface MemberLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export default function MemberLayout({ children, params: { locale } }: MemberLayoutProps) {
  const isArabic = locale === 'ar'

  const navigation = [
    {
      name: { en: 'Dashboard', ar: 'لوحة التحكم' },
      href: `/${locale}/member/dashboard`,
      icon: Home
    },
    {
      name: { en: 'My Subscription', ar: 'اشتراكي' },
      href: `/${locale}/member/subscription`,
      icon: CreditCard
    },
    {
      name: { en: 'Classes', ar: 'الحصص' },
      href: `/${locale}/member/classes`,
      icon: Calendar
    },
    {
      name: { en: 'Payment Methods', ar: 'طرق الدفع' },
      href: `/${locale}/member/payment-methods`,
      icon: CreditCard
    },
    {
      name: { en: 'Profile', ar: 'الملف الشخصي' },
      href: `/${locale}/member/profile`,
      icon: User
    },
    {
      name: { en: 'Invoices', ar: 'الفواتير' },
      href: `/${locale}/member/invoices`,
      icon: FileText
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {isArabic ? 'بوابة الأعضاء' : 'Member Portal'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/member/settings`}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{isArabic ? item.name.ar : item.name.en}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
