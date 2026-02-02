'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react'

interface ProfilePageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getMemberProfile = () => ({
  id: '123',
  firstName: 'Ahmed',
  lastName: 'Al-Rashid',
  email: 'ahmed.alrashid@example.com',
  phone: '+966 50 123 4567',
  dateOfBirth: '1990-05-15',
  gender: 'MALE' as const,
  address: {
    street: 'King Fahd Road',
    city: 'Riyadh',
    postalCode: '12345',
    country: 'Saudi Arabia'
  },
  emergencyContact: {
    name: 'Fatima Al-Rashid',
    phone: '+966 50 987 6543',
    relationship: 'Spouse'
  },
  joinDate: '2025-01-15',
  photoUrl: null
})

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export default function ProfilePage({ params: { locale } }: ProfilePageProps) {
  const isArabic = locale === 'ar'
  const profile = getMemberProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile)

  const handleSave = () => {
    // API call to save profile
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData(profile)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isArabic ? 'الملف الشخصي' : 'Profile'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'إدارة معلوماتك الشخصية' : 'Manage your personal information'}
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Edit2 className="h-5 w-5" />
            {isArabic ? 'تعديل' : 'Edit'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X className="h-5 w-5" />
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Save className="h-5 w-5" />
              {isArabic ? 'حفظ' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Photo */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {formData.firstName[0]}
            {formData.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-gray-600 mt-1">
              {isArabic ? 'عضو منذ' : 'Member since'}{' '}
              {formatDate(formData.joinDate, locale)}
            </p>
          </div>
          {isEditing && (
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              {isArabic ? 'تغيير الصورة' : 'Change Photo'}
            </button>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'الاسم الأول' : 'First Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'اسم العائلة' : 'Last Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {isArabic ? 'رقم الجوال' : 'Phone Number'}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  dir="ltr"
                />
              ) : (
                <p className="text-gray-900" dir="ltr">
                  {formData.phone}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {isArabic ? 'تاريخ الميلاد' : 'Date of Birth'}
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formatDate(formData.dateOfBirth, locale)}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                {isArabic ? 'الجنس' : 'Gender'}
              </label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="MALE">{isArabic ? 'ذكر' : 'Male'}</option>
                  <option value="FEMALE">{isArabic ? 'أنثى' : 'Female'}</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {formData.gender === 'MALE'
                    ? isArabic
                      ? 'ذكر'
                      : 'Male'
                    : isArabic
                    ? 'أنثى'
                    : 'Female'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isArabic ? 'العنوان' : 'Address'}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Street */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'الشارع' : 'Street'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.address.street}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'المدينة' : 'City'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.address.city}</p>
              )}
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'الرمز البريدي' : 'Postal Code'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.address.postalCode}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isArabic ? 'جهة الاتصال للطوارئ' : 'Emergency Contact'}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'الاسم' : 'Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.emergencyContact.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'رقم الجوال' : 'Phone'}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  dir="ltr"
                />
              ) : (
                <p className="text-gray-900" dir="ltr">
                  {formData.emergencyContact.phone}
                </p>
              )}
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isArabic ? 'صلة القرابة' : 'Relationship'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: {
                        ...formData.emergencyContact,
                        relationship: e.target.value
                      }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.emergencyContact.relationship}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
