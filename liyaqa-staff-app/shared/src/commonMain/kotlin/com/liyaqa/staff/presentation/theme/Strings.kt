package com.liyaqa.staff.presentation.theme

import androidx.compose.runtime.compositionLocalOf

/**
 * String resources with English and Arabic translations
 */
data class BilingualString(val en: String, val ar: String) {
    fun get(isArabic: Boolean): String = if (isArabic) ar else en
}

object Strings {
    // Navigation
    val dashboard = BilingualString("Dashboard", "لوحة التحكم")
    val checkIn = BilingualString("Check-In", "تسجيل الدخول")
    val sessions = BilingualString("Sessions", "الحصص")
    val facilities = BilingualString("Facilities", "المرافق")
    val profile = BilingualString("Profile", "الملف الشخصي")

    // Login
    val login = BilingualString("Login", "تسجيل الدخول")
    val email = BilingualString("Email", "البريد الإلكتروني")
    val password = BilingualString("Password", "كلمة المرور")
    val loginButton = BilingualString("Sign In", "دخول")
    val loginError = BilingualString("Invalid credentials", "بيانات غير صحيحة")

    // Dashboard
    val todayCheckIns = BilingualString("Today's Check-ins", "تسجيلات اليوم")
    val activeMembers = BilingualString("Active Members", "الأعضاء النشطين")
    val todaySessions = BilingualString("Today's Sessions", "حصص اليوم")
    val facilityBookings = BilingualString("Facility Bookings", "حجوزات المرافق")
    val upcomingSessions = BilingualString("Upcoming Sessions", "الحصص القادمة")
    val recentCheckIns = BilingualString("Recent Check-ins", "التسجيلات الأخيرة")

    // Check-in
    val scanQrCode = BilingualString("Scan QR Code", "مسح رمز QR")
    val searchMember = BilingualString("Search Member", "البحث عن عضو")
    val searchPlaceholder = BilingualString("Name, phone, or member number", "الاسم، الهاتف، أو رقم العضوية")
    val checkInSuccess = BilingualString("Check-in successful", "تم التسجيل بنجاح")
    val checkInError = BilingualString("Check-in failed", "فشل التسجيل")
    val memberNotFound = BilingualString("Member not found", "العضو غير موجود")
    val cannotCheckIn = BilingualString("Cannot check in", "لا يمكن التسجيل")
    val manualCheckIn = BilingualString("Manual Check-in", "تسجيل يدوي")

    // Sessions
    val noSessionsToday = BilingualString("No sessions today", "لا توجد حصص اليوم")
    val bookings = BilingualString("Bookings", "الحجوزات")
    val attended = BilingualString("Attended", "حضر")
    val noShow = BilingualString("No Show", "لم يحضر")
    val markAttended = BilingualString("Mark Attended", "تأكيد الحضور")
    val markNoShow = BilingualString("Mark No Show", "تأكيد الغياب")
    val waitlist = BilingualString("Waitlist", "قائمة الانتظار")
    val capacity = BilingualString("Capacity", "السعة")

    // Facilities
    val noBookingsToday = BilingualString("No bookings today", "لا توجد حجوزات اليوم")
    val facilityCheckIn = BilingualString("Check In", "تسجيل")
    val cancelBooking = BilingualString("Cancel", "إلغاء")

    // Profile
    val logout = BilingualString("Logout", "تسجيل الخروج")
    val logoutConfirm = BilingualString("Are you sure you want to logout?", "هل أنت متأكد من تسجيل الخروج؟")
    val yes = BilingualString("Yes", "نعم")
    val no = BilingualString("No", "لا")
    val settings = BilingualString("Settings", "الإعدادات")
    val language = BilingualString("Language", "اللغة")
    val version = BilingualString("Version", "الإصدار")

    // Common
    val loading = BilingualString("Loading...", "جاري التحميل...")
    val error = BilingualString("Error", "خطأ")
    val retry = BilingualString("Retry", "إعادة المحاولة")
    val cancel = BilingualString("Cancel", "إلغاء")
    val confirm = BilingualString("Confirm", "تأكيد")
    val save = BilingualString("Save", "حفظ")
    val success = BilingualString("Success", "نجاح")
}

/**
 * Composition local for Arabic language state
 */
val LocalIsArabic = compositionLocalOf { false }
