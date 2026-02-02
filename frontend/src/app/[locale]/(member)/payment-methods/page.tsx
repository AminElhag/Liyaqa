import { Plus, CreditCard, Trash2, CheckCircle, Star } from 'lucide-react'

interface PaymentMethodsPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getPaymentMethods = () => [
  {
    id: '1',
    type: 'CARD' as const,
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2026,
    holderName: 'Ahmed Al-Rashid',
    isDefault: true,
    createdAt: '2025-01-15'
  },
  {
    id: '2',
    type: 'CARD' as const,
    brand: 'Mastercard',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2025,
    holderName: 'Ahmed Al-Rashid',
    isDefault: false,
    createdAt: '2024-06-20'
  }
]

function formatExpiryDate(month: number, year: number) {
  return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
}

function isExpiringSoon(month: number, year: number) {
  const now = new Date()
  const expiry = new Date(year, month - 1)
  const monthsUntilExpiry =
    (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth())
  return monthsUntilExpiry <= 2 && monthsUntilExpiry >= 0
}

function isExpired(month: number, year: number) {
  const now = new Date()
  const expiry = new Date(year, month - 1)
  return expiry < now
}

export default function PaymentMethodsPage({ params: { locale } }: PaymentMethodsPageProps) {
  const isArabic = locale === 'ar'
  const paymentMethods = getPaymentMethods()

  const cardBrandLogos: Record<string, string> = {
    Visa: '💳',
    Mastercard: '💳',
    Amex: '💳',
    Mada: '🏦'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isArabic ? 'طرق الدفع' : 'Payment Methods'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic
              ? 'إدارة بطاقاتك وطرق الدفع'
              : 'Manage your cards and payment methods'}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
          <Plus className="h-5 w-5" />
          {isArabic ? 'إضافة بطاقة' : 'Add Card'}
        </button>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isArabic ? 'لا توجد طرق دفع' : 'No Payment Methods'}
          </h3>
          <p className="text-gray-600 mb-6">
            {isArabic
              ? 'أضف بطاقة ائتمان أو خصم لتمكين الدفع التلقائي'
              : 'Add a credit or debit card to enable automatic payments'}
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
            <Plus className="h-5 w-5" />
            {isArabic ? 'إضافة بطاقة الآن' : 'Add Card Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const expired = isExpired(method.expiryMonth, method.expiryYear)
            const expiringSoon = isExpiringSoon(method.expiryMonth, method.expiryYear)

            return (
              <div
                key={method.id}
                className={`bg-white rounded-lg shadow border-2 transition-all ${
                  method.isDefault
                    ? 'border-primary'
                    : expired
                    ? 'border-red-200 bg-red-50/50'
                    : expiringSoon
                    ? 'border-yellow-200 bg-yellow-50/50'
                    : 'border-transparent'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Card Info */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center text-2xl">
                        {cardBrandLogos[method.brand] || '💳'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {method.brand} •••• {method.last4}
                          </h3>
                          {method.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              <Star className="h-3 w-3 fill-current" />
                              {isArabic ? 'افتراضي' : 'Default'}
                            </span>
                          )}
                          {expired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              {isArabic ? 'منتهية' : 'Expired'}
                            </span>
                          )}
                          {!expired && expiringSoon && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              {isArabic ? 'تنتهي قريباً' : 'Expiring Soon'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{method.holderName}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {isArabic ? 'تنتهي في' : 'Expires'}{' '}
                          {formatExpiryDate(method.expiryMonth, method.expiryYear)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                          {isArabic ? 'تعيين كافتراضي' : 'Set as Default'}
                        </button>
                      )}
                      <button className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {!expired && expiringSoon && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {isArabic
                          ? 'هذه البطاقة ستنتهي قريباً. يرجى تحديث معلومات الدفع لتجنب انقطاع الخدمة.'
                          : 'This card will expire soon. Please update your payment information to avoid service interruption.'}
                      </p>
                    </div>
                  )}

                  {expired && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        {isArabic
                          ? 'هذه البطاقة منتهية. يرجى إضافة بطاقة جديدة أو تحديث تاريخ الانتهاء.'
                          : 'This card has expired. Please add a new card or update the expiry date.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <h3 className="font-medium text-blue-900 mb-1">
            {isArabic ? 'معلومات الأمان' : 'Security Information'}
          </h3>
          <p className="text-blue-700">
            {isArabic
              ? 'جميع بطاقاتك محفوظة بشكل آمن ومشفر. نحن لا نخزن رقم البطاقة الكامل أو رمز الأمان (CVV).'
              : 'All your cards are stored securely and encrypted. We never store your full card number or CVV.'}
          </p>
        </div>
      </div>

      {/* Supported Payment Methods */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isArabic ? 'طرق الدفع المدعومة' : 'Supported Payment Methods'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center text-xl">
              💳
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Visa</p>
              <p className="text-xs text-gray-500">
                {isArabic ? 'بطاقة ائتمان' : 'Credit Card'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="h-10 w-10 bg-orange-100 rounded flex items-center justify-center text-xl">
              💳
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Mastercard</p>
              <p className="text-xs text-gray-500">
                {isArabic ? 'بطاقة ائتمان' : 'Credit Card'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center text-xl">
              🏦
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Mada</p>
              <p className="text-xs text-gray-500">
                {isArabic ? 'بطاقة خصم' : 'Debit Card'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="h-10 w-10 bg-purple-100 rounded flex items-center justify-center text-xl">
              📱
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Apple Pay</p>
              <p className="text-xs text-gray-500">
                {isArabic ? 'محفظة رقمية' : 'Digital Wallet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
