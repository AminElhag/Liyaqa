'use client'

import { useState } from 'react'
import { Bell, Lock, Globe, Mail, Moon, Sun, Shield, Key } from 'lucide-react'

interface SettingsPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getSettings = () => ({
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    classReminders: true,
    paymentReminders: true,
    promotionalEmails: false
  },
  privacy: {
    profileVisibility: 'PRIVATE' as const,
    showActivity: false
  },
  preferences: {
    language: 'en',
    theme: 'LIGHT' as const,
    autoRenew: true
  }
})

export default function SettingsPage({ params: { locale } }: SettingsPageProps) {
  const isArabic = locale === 'ar'
  const [settings, setSettings] = useState(getSettings())
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = () => {
    // API call to save settings
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isArabic ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isArabic
            ? 'إدارة تفضيلاتك وإعدادات الحساب'
            : 'Manage your preferences and account settings'}
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            {isArabic ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully'}
          </p>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'الإشعارات' : 'Notifications'}
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Email Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">
                  {isArabic ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic
                  ? 'تلقي التحديثات عبر البريد الإلكتروني'
                  : 'Receive updates via email'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      emailNotifications: e.target.checked
                    }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isArabic ? 'إشعارات الرسائل النصية' : 'SMS Notifications'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic ? 'تلقي التحديثات عبر الرسائل النصية' : 'Receive updates via SMS'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.smsNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      smsNotifications: e.target.checked
                    }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Class Reminders */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isArabic ? 'تذكيرات الحصص' : 'Class Reminders'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic
                  ? 'تذكيرك بالحصص القادمة'
                  : 'Remind you about upcoming classes'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.classReminders}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      classReminders: e.target.checked
                    }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Payment Reminders */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isArabic ? 'تذكيرات الدفع' : 'Payment Reminders'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic
                  ? 'تذكيرك بالدفعات القادمة'
                  : 'Remind you about upcoming payments'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.paymentReminders}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      paymentReminders: e.target.checked
                    }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Promotional Emails */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isArabic ? 'رسائل ترويجية' : 'Promotional Emails'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic ? 'تلقي العروض والأخبار' : 'Receive offers and news'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.promotionalEmails}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      promotionalEmails: e.target.checked
                    }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'التفضيلات' : 'Preferences'}
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'اللغة' : 'Language'}
            </label>
            <select
              value={settings.preferences.language}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  preferences: { ...settings.preferences, language: e.target.value }
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'المظهر' : 'Theme'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, theme: 'LIGHT' }
                  })
                }
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                  settings.preferences.theme === 'LIGHT'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Sun className="h-5 w-5" />
                <span>{isArabic ? 'فاتح' : 'Light'}</span>
              </button>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, theme: 'DARK' }
                  })
                }
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                  settings.preferences.theme === 'DARK'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Moon className="h-5 w-5" />
                <span>{isArabic ? 'داكن' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* Auto-renew */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isArabic ? 'التجديد التلقائي' : 'Auto-Renew'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isArabic
                  ? 'تجديد الاشتراك تلقائياً عند انتهاء الفترة'
                  : 'Automatically renew subscription when period ends'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferences.autoRenew}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, autoRenew: e.target.checked }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'الأمان' : 'Security'}
            </h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-gray-600 group-hover:text-primary" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900 group-hover:text-primary">
                  {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isArabic
                    ? 'تحديث كلمة المرور الخاصة بك'
                    : 'Update your password'}
                </p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-primary">›</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-600 group-hover:text-primary" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900 group-hover:text-primary">
                  {isArabic ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isArabic ? 'طبقة أمان إضافية' : 'Extra layer of security'}
                </p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-primary">›</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
