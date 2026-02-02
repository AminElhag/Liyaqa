'use client'

import { useState, memo, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface ClassesPageProps {
  params: { locale: string }
}

// Mock data - will be replaced with actual API calls
const getAvailableClasses = () => [
  {
    id: '1',
    name: 'HIIT Training',
    nameAr: 'تمرين عالي الكثافة',
    instructor: 'Sarah Johnson',
    instructorAr: 'سارة جونسون',
    date: '2026-02-02',
    time: '06:00 AM',
    duration: 45,
    capacity: 20,
    booked: 15,
    location: 'Studio A',
    locationAr: 'استوديو أ',
    level: 'Intermediate',
    levelAr: 'متوسط',
    status: 'AVAILABLE' as const
  },
  {
    id: '2',
    name: 'Yoga Flow',
    nameAr: 'يوغا انسيابية',
    instructor: 'Maya Hassan',
    instructorAr: 'مايا حسن',
    date: '2026-02-02',
    time: '07:30 AM',
    duration: 60,
    capacity: 15,
    booked: 12,
    location: 'Studio B',
    locationAr: 'استوديو ب',
    level: 'Beginner',
    levelAr: 'مبتدئ',
    status: 'AVAILABLE' as const
  },
  {
    id: '3',
    name: 'Strength Training',
    nameAr: 'تدريب القوة',
    instructor: 'Mohammed Ali',
    instructorAr: 'محمد علي',
    date: '2026-02-02',
    time: '05:00 PM',
    duration: 50,
    capacity: 12,
    booked: 12,
    location: 'Gym Floor',
    locationAr: 'صالة الجيم',
    level: 'Advanced',
    levelAr: 'متقدم',
    status: 'FULL' as const
  },
  {
    id: '4',
    name: 'Spinning',
    nameAr: 'دراجات',
    instructor: 'Fatima Al-Said',
    instructorAr: 'فاطمة السعيد',
    date: '2026-02-03',
    time: '06:30 AM',
    duration: 45,
    capacity: 20,
    booked: 8,
    location: 'Spin Room',
    locationAr: 'غرفة الدراجات',
    level: 'All Levels',
    levelAr: 'جميع المستويات',
    status: 'AVAILABLE' as const
  }
]

const getMyBookings = () => [
  {
    id: '1',
    classId: '1',
    className: 'HIIT Training',
    classNameAr: 'تمرين عالي الكثافة',
    date: '2026-02-02',
    time: '06:00 AM',
    status: 'CONFIRMED' as const
  }
]

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function getAvailabilityColor(booked: number, capacity: number) {
  const percentage = (booked / capacity) * 100
  if (percentage >= 100) return 'text-red-600'
  if (percentage >= 80) return 'text-yellow-600'
  return 'text-green-600'
}

// Types for class data
type ClassStatus = 'AVAILABLE' | 'FULL' | 'CANCELLED'

interface ClassData {
  id: string
  name: string
  nameAr: string
  instructor: string
  instructorAr: string
  date: string
  time: string
  duration: number
  capacity: number
  booked: number
  location: string
  locationAr: string
  level: string
  levelAr: string
  status: ClassStatus
}

interface BookingData {
  id: string
  classId: string
  className: string
  classNameAr: string
  date: string
  time: string
  status: 'CONFIRMED' | 'CANCELLED' | 'WAITLIST'
}

interface StatusConfig {
  icon: any
  color: string
  bg: string
  label: { en: string; ar: string }
}

// Memoized ClassCard component to prevent unnecessary re-renders
interface ClassCardProps {
  cls: ClassData
  isBooked: boolean
  statusConfig: Record<ClassStatus, StatusConfig>
  locale: string
  isArabic: boolean
}

const ClassCard = memo<ClassCardProps>(({ cls, isBooked, statusConfig, locale, isArabic }) => {
  const StatusIcon = statusConfig[cls.status].icon
  const availableSpots = cls.capacity - cls.booked

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isArabic ? cls.nameAr : cls.name}
            </h3>
            <p className="text-sm text-gray-600">
              {isArabic ? cls.instructorAr : cls.instructor}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[cls.status].bg} ${statusConfig[cls.status].color}`}
          >
            {isArabic
              ? statusConfig[cls.status].label.ar
              : statusConfig[cls.status].label.en}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(cls.date, locale)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {cls.time} ({cls.duration} {isArabic ? 'دقيقة' : 'min'})
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{isArabic ? cls.locationAr : cls.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-600" />
            <span className={getAvailabilityColor(cls.booked, cls.capacity)}>
              {availableSpots > 0
                ? `${availableSpots} ${isArabic ? 'مقعد متاح' : 'spots available'}`
                : isArabic
                ? 'ممتلئ'
                : 'Full'}
            </span>
          </div>
        </div>

        {/* Level Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {isArabic ? cls.levelAr : cls.level}
          </span>
        </div>

        {/* Action Button */}
        {isBooked ? (
          <button
            disabled
            className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            {isArabic ? 'محجوز' : 'Booked'}
          </button>
        ) : cls.status === 'FULL' ? (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
          >
            {isArabic ? 'ممتلئ' : 'Full'}
          </button>
        ) : (
          <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
            {isArabic ? 'احجز الآن' : 'Book Now'}
          </button>
        )}
      </div>
    </div>
  )
})

ClassCard.displayName = 'ClassCard'

export default function ClassesPage({ params: { locale } }: ClassesPageProps) {
  const isArabic = locale === 'ar'
  const [selectedTab, setSelectedTab] = useState<'available' | 'my-bookings'>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const availableClasses = getAvailableClasses()
  const myBookings = getMyBookings()

  const filteredClasses = availableClasses.filter((cls) => {
    const matchesSearch =
      searchQuery === '' ||
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.nameAr.includes(searchQuery) ||
      cls.instructor.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLevel = selectedLevel === 'all' || cls.level === selectedLevel

    return matchesSearch && matchesLevel
  })

  const statusConfig = {
    AVAILABLE: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: { en: 'Available', ar: 'متاح' }
    },
    FULL: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      label: { en: 'Full', ar: 'ممتلئ' }
    },
    CANCELLED: {
      icon: AlertCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      label: { en: 'Cancelled', ar: 'ملغي' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isArabic ? 'الحصص' : 'Classes'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isArabic ? 'تصفح واحجز الحصص المتاحة' : 'Browse and book available classes'}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setSelectedTab('available')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'available'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {isArabic ? 'الحصص المتاحة' : 'Available Classes'}
          </button>
          <button
            onClick={() => setSelectedTab('my-bookings')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors relative ${
              selectedTab === 'my-bookings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {isArabic ? 'حجوزاتي' : 'My Bookings'}
            {myBookings.length > 0 && (
              <span className="absolute -top-1 -right-2 h-5 w-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {myBookings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {selectedTab === 'available' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={isArabic ? 'ابحث عن حصة...' : 'Search classes...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Level Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                  <option value="Beginner">{isArabic ? 'مبتدئ' : 'Beginner'}</option>
                  <option value="Intermediate">{isArabic ? 'متوسط' : 'Intermediate'}</option>
                  <option value="Advanced">{isArabic ? 'متقدم' : 'Advanced'}</option>
                </select>
              </div>

              {/* Date Filter (placeholder) */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Classes Grid */}
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isArabic ? 'لا توجد حصص' : 'No Classes Found'}
              </h3>
              <p className="text-gray-600">
                {isArabic
                  ? 'جرب تغيير معايير البحث'
                  : 'Try adjusting your search criteria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  isBooked={myBookings.some((b) => b.classId === cls.id)}
                  statusConfig={statusConfig}
                  locale={locale}
                  isArabic={isArabic}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* My Bookings Tab */
        <div className="space-y-4">
          {myBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isArabic ? 'لا توجد حجوزات' : 'No Bookings'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isArabic
                  ? 'لم تقم بحجز أي حصص بعد'
                  : "You haven't booked any classes yet"}
              </p>
              <button
                onClick={() => setSelectedTab('available')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {isArabic ? 'تصفح الحصص' : 'Browse Classes'}
              </button>
            </div>
          ) : (
            myBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {isArabic ? booking.classNameAr : booking.className}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(booking.date, locale)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{booking.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {isArabic ? 'مؤكد' : 'Confirmed'}
                  </span>
                  <button className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
