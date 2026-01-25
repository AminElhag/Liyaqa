package com.liyaqa.member.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

/**
 * Bilingual string resources
 */
object Strings {
    // App
    val appName = LocalizedString("Liyaqa", "ليقا")

    // Navigation
    val home = LocalizedString("Home", "الرئيسية")
    val schedule = LocalizedString("Schedule", "الجدول")
    val qrCode = LocalizedString("QR Code", "رمز QR")
    val profile = LocalizedString("Profile", "الملف الشخصي")
    val settings = LocalizedString("Settings", "الإعدادات")

    // Auth
    val login = LocalizedString("Login", "تسجيل الدخول")
    val logout = LocalizedString("Logout", "تسجيل الخروج")
    val email = LocalizedString("Email", "البريد الإلكتروني")
    val password = LocalizedString("Password", "كلمة المرور")
    val forgotPassword = LocalizedString("Forgot Password?", "نسيت كلمة المرور؟")
    val welcomeBack = LocalizedString("Welcome Back", "مرحباً بعودتك")
    val loginSubtitle = LocalizedString("Sign in to continue", "قم بتسجيل الدخول للمتابعة")

    // Home
    val welcomeMessage = LocalizedString("Welcome", "مرحباً")
    val upcomingClasses = LocalizedString("Upcoming Classes", "الحصص القادمة")
    val noUpcomingClasses = LocalizedString("No upcoming classes", "لا توجد حصص قادمة")
    val viewAll = LocalizedString("View All", "عرض الكل")
    val bookNow = LocalizedString("Book Now", "احجز الآن")

    // Subscription
    val subscription = LocalizedString("Subscription", "الاشتراك")
    val subscriptionStatus = LocalizedString("Subscription Status", "حالة الاشتراك")
    val daysRemaining = LocalizedString("Days Remaining", "الأيام المتبقية")
    val classesRemaining = LocalizedString("Classes Remaining", "الحصص المتبقية")
    val unlimited = LocalizedString("Unlimited", "غير محدود")
    val active = LocalizedString("Active", "نشط")
    val expired = LocalizedString("Expired", "منتهي")
    val frozen = LocalizedString("Frozen", "مجمد")
    val expiresIn = LocalizedString("Expires in", "ينتهي في")
    val renewNow = LocalizedString("Renew Now", "جدد الآن")

    // Booking
    val booking = LocalizedString("Booking", "الحجز")
    val bookings = LocalizedString("Bookings", "الحجوزات")
    val bookClass = LocalizedString("Book Class", "حجز حصة")
    val cancelBooking = LocalizedString("Cancel Booking", "إلغاء الحجز")
    val confirmBooking = LocalizedString("Confirm Booking", "تأكيد الحجز")
    val bookingConfirmed = LocalizedString("Booking Confirmed", "تم تأكيد الحجز")
    val bookingCancelled = LocalizedString("Booking Cancelled", "تم إلغاء الحجز")
    val confirmed = LocalizedString("Confirmed", "مؤكد")
    val waitlisted = LocalizedString("Waitlisted", "قائمة الانتظار")
    val spotsAvailable = LocalizedString("spots available", "مقاعد متاحة")
    val classFull = LocalizedString("Class Full", "الحصة ممتلئة")

    // QR Check-in
    val checkIn = LocalizedString("Check In", "تسجيل الحضور")
    val showQrCode = LocalizedString("Show this QR code at reception", "أظهر رمز QR هذا في الاستقبال")
    val scanQrCode = LocalizedString("Scan QR Code", "مسح رمز QR")
    val selfCheckIn = LocalizedString("Self Check-In", "تسجيل الحضور الذاتي")
    val checkInSuccess = LocalizedString("Check-in successful!", "تم تسجيل الحضور بنجاح!")
    val checkInBlocked = LocalizedString("Check-in blocked during prayer time", "تسجيل الحضور محظور أثناء وقت الصلاة")

    // Profile
    val editProfile = LocalizedString("Edit Profile", "تعديل الملف الشخصي")
    val firstName = LocalizedString("First Name", "الاسم الأول")
    val lastName = LocalizedString("Last Name", "اسم العائلة")
    val phone = LocalizedString("Phone", "الهاتف")
    val dateOfBirth = LocalizedString("Date of Birth", "تاريخ الميلاد")
    val emergencyContact = LocalizedString("Emergency Contact", "جهة اتصال الطوارئ")
    val saveChanges = LocalizedString("Save Changes", "حفظ التغييرات")
    val changePassword = LocalizedString("Change Password", "تغيير كلمة المرور")
    val currentPassword = LocalizedString("Current Password", "كلمة المرور الحالية")
    val newPassword = LocalizedString("New Password", "كلمة المرور الجديدة")
    val confirmPassword = LocalizedString("Confirm Password", "تأكيد كلمة المرور")

    // Invoices
    val invoices = LocalizedString("Invoices", "الفواتير")
    val pendingPayments = LocalizedString("Pending Payments", "المدفوعات المعلقة")
    val payNow = LocalizedString("Pay Now", "ادفع الآن")
    val paid = LocalizedString("Paid", "مدفوعة")
    val overdue = LocalizedString("Overdue", "متأخرة")
    val dueDate = LocalizedString("Due Date", "تاريخ الاستحقاق")

    // Attendance
    val attendance = LocalizedString("Attendance", "الحضور")
    val attendanceHistory = LocalizedString("Attendance History", "سجل الحضور")
    val totalVisits = LocalizedString("Total Visits", "إجمالي الزيارات")
    val thisMonth = LocalizedString("This Month", "هذا الشهر")

    // PT
    val personalTraining = LocalizedString("Personal Training", "التدريب الشخصي")
    val trainers = LocalizedString("Trainers", "المدربين")
    val bookSession = LocalizedString("Book Session", "حجز جلسة")
    val selectTime = LocalizedString("Select Time", "اختر الوقت")

    // Prayer Times
    val prayerTimes = LocalizedString("Prayer Times", "أوقات الصلاة")
    val nextPrayer = LocalizedString("Next Prayer", "الصلاة القادمة")

    // Wallet
    val wallet = LocalizedString("Wallet", "المحفظة")
    val walletBalance = LocalizedString("Wallet Balance", "رصيد المحفظة")
    val currentBalance = LocalizedString("Current Balance", "الرصيد الحالي")
    val transactions = LocalizedString("Transactions", "المعاملات")
    val recentTransactions = LocalizedString("Recent Transactions", "المعاملات الأخيرة")
    val topUp = LocalizedString("Top Up", "شحن الرصيد")
    val topUpWallet = LocalizedString("Top Up Wallet", "شحن المحفظة")
    val credit = LocalizedString("Credit", "إضافة")
    val debit = LocalizedString("Debit", "خصم")
    val noTransactions = LocalizedString("No transactions", "لا توجد معاملات")
    val transactionHistory = LocalizedString("Transaction History", "سجل المعاملات")

    // Notifications
    val notifications = LocalizedString("Notifications", "الإشعارات")
    val notification = LocalizedString("Notification", "إشعار")
    val notificationPreferences = LocalizedString("Notification Preferences", "إعدادات الإشعارات")
    val pushNotifications = LocalizedString("Push Notifications", "إشعارات الهاتف")
    val emailNotifications = LocalizedString("Email Notifications", "إشعارات البريد")
    val bookingReminders = LocalizedString("Booking Reminders", "تذكيرات الحجوزات")
    val promotionalNotifications = LocalizedString("Promotions", "العروض")
    val markAsRead = LocalizedString("Mark as Read", "تحديد كمقروء")
    val markAllAsRead = LocalizedString("Mark All as Read", "تحديد الكل كمقروء")
    val noNotifications = LocalizedString("No notifications", "لا توجد إشعارات")
    val unreadNotifications = LocalizedString("Unread", "غير مقروءة")
    val enableNotifications = LocalizedString("Enable Notifications", "تفعيل الإشعارات")
    val disableNotifications = LocalizedString("Disable Notifications", "إيقاف الإشعارات")

    // Settings
    val generalSettings = LocalizedString("General", "عام")
    val securitySettings = LocalizedString("Security", "الأمان")
    val appearanceSettings = LocalizedString("Appearance", "المظهر")
    val biometricLogin = LocalizedString("Biometric Login", "الدخول بالبصمة")
    val useFaceIdTouchId = LocalizedString("Use Face ID / Touch ID", "استخدام البصمة / Face ID")
    val darkMode = LocalizedString("Dark Mode", "الوضع الداكن")
    val lightMode = LocalizedString("Light Mode", "الوضع الفاتح")
    val systemDefault = LocalizedString("System Default", "إعداد النظام")
    val theme = LocalizedString("Theme", "المظهر")
    val about = LocalizedString("About", "حول التطبيق")
    val version = LocalizedString("Version", "الإصدار")
    val privacyPolicy = LocalizedString("Privacy Policy", "سياسة الخصوصية")
    val termsOfService = LocalizedString("Terms of Service", "شروط الخدمة")
    val helpAndSupport = LocalizedString("Help & Support", "المساعدة والدعم")
    val contactUs = LocalizedString("Contact Us", "اتصل بنا")

    // Error Messages
    val errorOccurred = LocalizedString("An error occurred", "حدث خطأ")
    val networkError = LocalizedString("Network error. Please check your connection.", "خطأ في الشبكة. يرجى التحقق من اتصالك.")
    val serverError = LocalizedString("Server error. Please try again later.", "خطأ في الخادم. يرجى المحاولة لاحقاً.")
    val sessionExpired = LocalizedString("Session expired. Please login again.", "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.")
    val invalidCredentials = LocalizedString("Invalid email or password", "البريد الإلكتروني أو كلمة المرور غير صحيحة")
    val requiredField = LocalizedString("This field is required", "هذا الحقل مطلوب")
    val invalidEmail = LocalizedString("Invalid email address", "عنوان البريد الإلكتروني غير صالح")
    val invalidPhone = LocalizedString("Invalid phone number", "رقم الهاتف غير صالح")
    val passwordMismatch = LocalizedString("Passwords do not match", "كلمات المرور غير متطابقة")
    val passwordTooShort = LocalizedString("Password must be at least 8 characters", "يجب أن تكون كلمة المرور 8 أحرف على الأقل")
    val bookingFailed = LocalizedString("Booking failed. Please try again.", "فشل الحجز. يرجى المحاولة مرة أخرى.")
    val cancellationFailed = LocalizedString("Cancellation failed. Please try again.", "فشل الإلغاء. يرجى المحاولة مرة أخرى.")
    val paymentFailed = LocalizedString("Payment failed. Please try again.", "فشل الدفع. يرجى المحاولة مرة أخرى.")
    val loadingFailed = LocalizedString("Failed to load data", "فشل تحميل البيانات")
    val noInternetConnection = LocalizedString("No internet connection", "لا يوجد اتصال بالإنترنت")
    val somethingWentWrong = LocalizedString("Something went wrong", "حدث خطأ ما")

    // Confirmation Dialogs
    val confirmLogout = LocalizedString("Are you sure you want to logout?", "هل أنت متأكد من تسجيل الخروج؟")
    val confirmCancelBooking = LocalizedString("Are you sure you want to cancel this booking?", "هل أنت متأكد من إلغاء هذا الحجز؟")
    val confirmDelete = LocalizedString("Are you sure you want to delete?", "هل أنت متأكد من الحذف؟")
    val confirmChanges = LocalizedString("Are you sure you want to save changes?", "هل أنت متأكد من حفظ التغييرات؟")
    val unsavedChanges = LocalizedString("You have unsaved changes. Discard them?", "لديك تغييرات غير محفوظة. تجاهلها؟")
    val discardChanges = LocalizedString("Discard Changes", "تجاهل التغييرات")
    val keepEditing = LocalizedString("Keep Editing", "متابعة التعديل")
    val confirmPayment = LocalizedString("Confirm payment of", "تأكيد دفع مبلغ")

    // Success Messages
    val successBooking = LocalizedString("Booking confirmed successfully!", "تم تأكيد الحجز بنجاح!")
    val successCancellation = LocalizedString("Booking cancelled successfully!", "تم إلغاء الحجز بنجاح!")
    val successPayment = LocalizedString("Payment completed successfully!", "تم الدفع بنجاح!")
    val successProfileUpdate = LocalizedString("Profile updated successfully!", "تم تحديث الملف الشخصي بنجاح!")
    val successPasswordChange = LocalizedString("Password changed successfully!", "تم تغيير كلمة المرور بنجاح!")

    // Common
    val loading = LocalizedString("Loading...", "جاري التحميل...")
    val error = LocalizedString("Error", "خطأ")
    val retry = LocalizedString("Retry", "إعادة المحاولة")
    val cancel = LocalizedString("Cancel", "إلغاء")
    val confirm = LocalizedString("Confirm", "تأكيد")
    val save = LocalizedString("Save", "حفظ")
    val delete = LocalizedString("Delete", "حذف")
    val close = LocalizedString("Close", "إغلاق")
    val ok = LocalizedString("OK", "حسناً")
    val yes = LocalizedString("Yes", "نعم")
    val no = LocalizedString("No", "لا")
    val today = LocalizedString("Today", "اليوم")
    val tomorrow = LocalizedString("Tomorrow", "غداً")
    val noData = LocalizedString("No data available", "لا توجد بيانات")
    val pullToRefresh = LocalizedString("Pull to refresh", "اسحب للتحديث")
    val language = LocalizedString("Language", "اللغة")
    val english = LocalizedString("English", "الإنجليزية")
    val arabic = LocalizedString("Arabic", "العربية")
    val sar = LocalizedString("SAR", "ر.س")
    val done = LocalizedString("Done", "تم")
    val next = LocalizedString("Next", "التالي")
    val back = LocalizedString("Back", "رجوع")
    val skip = LocalizedString("Skip", "تخطي")
    val search = LocalizedString("Search", "بحث")
    val filter = LocalizedString("Filter", "تصفية")
    val all = LocalizedString("All", "الكل")
    val viewDetails = LocalizedString("View Details", "عرض التفاصيل")
    val seeAll = LocalizedString("See All", "عرض الكل")
}

/**
 * Localized string holder
 */
data class LocalizedString(
    val en: String,
    val ar: String
) {
    @Composable
    fun get(): String {
        val isArabic = LocalIsArabic.current
        return if (isArabic) ar else en
    }

    fun get(isArabic: Boolean): String = if (isArabic) ar else en
}

/**
 * Extension to get localized string based on current locale
 */
@Composable
fun LocalizedString.localized(): String = get()

/**
 * Remember localized string to avoid recomposition
 */
@Composable
fun rememberLocalizedString(string: LocalizedString): String {
    val isArabic = LocalIsArabic.current
    return remember(isArabic) { string.get(isArabic) }
}
