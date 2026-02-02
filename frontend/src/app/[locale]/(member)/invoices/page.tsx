import Link from 'next/link'
import { FileText, Download, Eye, CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react'

interface InvoicesPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getInvoices = () => [
  {
    id: '1',
    invoiceNumber: 'INV-2026-001234',
    date: '2026-01-15',
    dueDate: '2026-01-20',
    amount: 500,
    currency: 'SAR',
    status: 'PAID' as const,
    paidDate: '2026-01-16',
    description: 'Premium Monthly Subscription',
    descriptionAr: 'الاشتراك الشهري المميز'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-001180',
    date: '2025-12-15',
    dueDate: '2025-12-20',
    amount: 500,
    currency: 'SAR',
    status: 'PAID' as const,
    paidDate: '2025-12-18',
    description: 'Premium Monthly Subscription',
    descriptionAr: 'الاشتراك الشهري المميز'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2026-002000',
    date: '2026-02-01',
    dueDate: '2026-02-15',
    amount: 500,
    currency: 'SAR',
    status: 'ISSUED' as const,
    paidDate: null,
    description: 'Premium Monthly Subscription',
    descriptionAr: 'الاشتراك الشهري المميز'
  }
]

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export default function InvoicesPage({ params: { locale } }: InvoicesPageProps) {
  const isArabic = locale === 'ar'
  const invoices = getInvoices()

  const statusConfig = {
    PAID: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      border: 'border-green-300',
      label: { en: 'Paid', ar: 'مدفوع' }
    },
    ISSUED: {
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      label: { en: 'Pending', ar: 'قيد الانتظار' }
    },
    OVERDUE: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      border: 'border-red-300',
      label: { en: 'Overdue', ar: 'متأخر' }
    },
    CANCELLED: {
      icon: XCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      label: { en: 'Cancelled', ar: 'ملغي' }
    }
  }

  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const pendingAmount = invoices
    .filter((inv) => inv.status === 'ISSUED' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isArabic ? 'الفواتير' : 'Invoices'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isArabic ? 'عرض وإدارة فواتيرك' : 'View and manage your invoices'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Paid */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              {isArabic ? 'إجمالي المدفوع' : 'Total Paid'}
            </h2>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalPaid} {isArabic ? 'ريال' : 'SAR'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.filter((inv) => inv.status === 'PAID').length}{' '}
            {isArabic ? 'فاتورة' : 'invoices'}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              {isArabic ? 'قيد الانتظار' : 'Pending'}
            </h2>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {pendingAmount} {isArabic ? 'ريال' : 'SAR'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.filter((inv) => inv.status === 'ISSUED').length}{' '}
            {isArabic ? 'فاتورة' : 'invoices'}
          </p>
        </div>

        {/* Next Payment */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              {isArabic ? 'الدفع القادم' : 'Next Payment'}
            </h2>
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {pendingAmount > 0 ? pendingAmount : 0} {isArabic ? 'ريال' : 'SAR'}
          </p>
          {invoices.find((inv) => inv.status === 'ISSUED') && (
            <p className="text-sm text-gray-500 mt-1">
              {isArabic ? 'مستحق في' : 'Due'}{' '}
              {formatDate(invoices.find((inv) => inv.status === 'ISSUED')!.dueDate, locale)}
            </p>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isArabic ? 'جميع الفواتير' : 'All Invoices'}
          </h2>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isArabic ? 'لا توجد فواتير' : 'No Invoices'}
            </h3>
            <p className="text-gray-600">
              {isArabic
                ? 'لم يتم إصدار أي فواتير بعد'
                : 'No invoices have been issued yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isArabic ? 'رقم الفاتورة' : 'Invoice #'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isArabic ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isArabic ? 'الوصف' : 'Description'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isArabic ? 'المبلغ' : 'Amount'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isArabic ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isArabic ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status].icon

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <Link
                            href={`/${locale}/member/invoices/${invoice.id}`}
                            className="text-sm font-medium text-primary hover:text-primary/80"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.date, locale)}
                        </div>
                        {invoice.status !== 'PAID' && (
                          <div className="text-xs text-gray-500">
                            {isArabic ? 'مستحق:' : 'Due:'}{' '}
                            {formatDate(invoice.dueDate, locale)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {isArabic ? invoice.descriptionAr : invoice.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {invoice.amount} {invoice.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                            statusConfig[invoice.status].bg
                          } ${statusConfig[invoice.status].color} ${
                            statusConfig[invoice.status].border
                          }`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {isArabic
                            ? statusConfig[invoice.status].label.ar
                            : statusConfig[invoice.status].label.en}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${locale}/member/invoices/${invoice.id}`}
                            className="text-gray-600 hover:text-gray-900"
                            title={isArabic ? 'عرض' : 'View'}
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title={isArabic ? 'تحميل' : 'Download'}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          {invoice.status === 'ISSUED' && (
                            <Link
                              href={`/${locale}/member/invoices/${invoice.id}/pay`}
                              className="ml-2 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium"
                            >
                              {isArabic ? 'ادفع الآن' : 'Pay Now'}
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Note */}
      {invoices.some((inv) => inv.status === 'ISSUED') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <h3 className="font-medium text-blue-900 mb-1">
              {isArabic ? 'دفعات قيد الانتظار' : 'Pending Payments'}
            </h3>
            <p className="text-blue-700">
              {isArabic
                ? 'لديك فواتير قيد الانتظار. يرجى الدفع قبل تاريخ الاستحقاق لتجنب تعليق الخدمة.'
                : 'You have pending invoices. Please pay before the due date to avoid service suspension.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
