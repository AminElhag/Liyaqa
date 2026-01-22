package com.liyaqa.notification.infrastructure.whatsapp

import com.liyaqa.notification.domain.model.NotificationType

/**
 * WhatsApp Business API message templates.
 * Templates must be pre-approved by Meta before use.
 *
 * Each template has:
 * - name: Template name registered with Meta
 * - language: Template language code (ar, en)
 * - components: Template variables
 */
object WhatsAppTemplates {

    /**
     * Gets the template name for a notification type.
     * Templates must be created in Meta Business Manager first.
     */
    fun getTemplateName(type: NotificationType, language: String = "ar"): String? {
        val suffix = if (language == "ar") "_ar" else "_en"
        return when (type) {
            // Subscription templates
            NotificationType.SUBSCRIPTION_CREATED -> "subscription_created$suffix"
            NotificationType.SUBSCRIPTION_EXPIRING_7_DAYS -> "subscription_expiring$suffix"
            NotificationType.SUBSCRIPTION_EXPIRING_3_DAYS -> "subscription_expiring$suffix"
            NotificationType.SUBSCRIPTION_EXPIRING_1_DAY -> "subscription_expiring_urgent$suffix"
            NotificationType.SUBSCRIPTION_EXPIRED -> "subscription_expired$suffix"
            NotificationType.SUBSCRIPTION_FROZEN -> "subscription_frozen$suffix"
            NotificationType.SUBSCRIPTION_UNFROZEN -> "subscription_unfrozen$suffix"
            NotificationType.SUBSCRIPTION_CANCELLED -> "subscription_cancelled$suffix"
            NotificationType.SUBSCRIPTION_RENEWED -> "subscription_renewed$suffix"

            // Invoice templates
            NotificationType.INVOICE_CREATED -> "invoice_created$suffix"
            NotificationType.INVOICE_DUE_SOON -> "invoice_due_soon$suffix"
            NotificationType.INVOICE_OVERDUE -> "invoice_overdue$suffix"
            NotificationType.INVOICE_PAID -> "payment_received$suffix"

            // Class booking templates
            NotificationType.CLASS_BOOKING_CONFIRMED -> "class_booked$suffix"
            NotificationType.CLASS_BOOKING_CANCELLED -> "class_cancelled$suffix"
            NotificationType.CLASS_BOOKING_REMINDER_24H -> "class_reminder$suffix"
            NotificationType.CLASS_BOOKING_REMINDER_1H -> "class_reminder_urgent$suffix"
            NotificationType.CLASS_WAITLIST_PROMOTED -> "waitlist_promoted$suffix"
            NotificationType.CLASS_SESSION_CANCELLED -> "session_cancelled$suffix"

            // Account templates
            NotificationType.WELCOME -> "welcome$suffix"

            // Not suitable for WhatsApp (security-sensitive)
            NotificationType.PASSWORD_RESET,
            NotificationType.PASSWORD_CHANGED,
            NotificationType.ACCOUNT_LOCKED -> null

            // Other
            NotificationType.CHECK_IN_CONFIRMATION -> null // Too frequent
            NotificationType.LOW_CLASSES_REMAINING -> "low_classes$suffix"
            NotificationType.MEMBER_SUSPENDED -> "account_suspended$suffix"
            NotificationType.MEMBER_REACTIVATED -> "account_reactivated$suffix"
            NotificationType.CUSTOM -> null // Use direct message instead
        }
    }

    /**
     * Template variable mappings for each notification type.
     * These correspond to the {{1}}, {{2}}, etc. placeholders in Meta templates.
     */
    data class TemplateVariables(
        val memberName: String? = null,
        val clubName: String? = null,
        val planName: String? = null,
        val expiryDate: String? = null,
        val daysRemaining: Int? = null,
        val amount: String? = null,
        val invoiceNumber: String? = null,
        val className: String? = null,
        val classDate: String? = null,
        val classTime: String? = null,
        val classesRemaining: Int? = null
    ) {
        /**
         * Converts to list of component parameters for Meta API.
         */
        fun toComponentList(): List<Map<String, Any>> {
            val params = mutableListOf<Map<String, Any>>()

            // Add non-null variables in order
            memberName?.let { params.add(mapOf("type" to "text", "text" to it)) }
            clubName?.let { params.add(mapOf("type" to "text", "text" to it)) }
            planName?.let { params.add(mapOf("type" to "text", "text" to it)) }
            expiryDate?.let { params.add(mapOf("type" to "text", "text" to it)) }
            daysRemaining?.let { params.add(mapOf("type" to "text", "text" to it.toString())) }
            amount?.let { params.add(mapOf("type" to "text", "text" to it)) }
            invoiceNumber?.let { params.add(mapOf("type" to "text", "text" to it)) }
            className?.let { params.add(mapOf("type" to "text", "text" to it)) }
            classDate?.let { params.add(mapOf("type" to "text", "text" to it)) }
            classTime?.let { params.add(mapOf("type" to "text", "text" to it)) }
            classesRemaining?.let { params.add(mapOf("type" to "text", "text" to it.toString())) }

            return params
        }
    }

    /**
     * Sample template messages for reference.
     * These must be registered with Meta Business Manager.
     */
    val SAMPLE_TEMPLATES = mapOf(
        // Arabic templates
        "welcome_ar" to """
            مرحباً {{1}}! 👋
            أهلاً بك في {{2}}.
            نتمنى لك تجربة رياضية ممتعة.
        """.trimIndent(),

        "subscription_created_ar" to """
            تم تفعيل اشتراكك بنجاح! ✅
            الخطة: {{1}}
            تاريخ الانتهاء: {{2}}
            شكراً لثقتك في {{3}}.
        """.trimIndent(),

        "subscription_expiring_ar" to """
            تنبيه: اشتراكك في {{1}} سينتهي خلال {{2}} أيام.
            تاريخ الانتهاء: {{3}}
            قم بالتجديد الآن لمواصلة الاستفادة من خدماتنا.
        """.trimIndent(),

        "subscription_expiring_urgent_ar" to """
            ⚠️ تنبيه عاجل
            اشتراكك سينتهي غداً!
            جدد الآن لتجنب انقطاع الخدمة.
        """.trimIndent(),

        "invoice_created_ar" to """
            فاتورة جديدة 📄
            رقم الفاتورة: {{1}}
            المبلغ: {{2}} ر.س
            يرجى السداد قبل: {{3}}
        """.trimIndent(),

        "payment_received_ar" to """
            تم استلام الدفعة بنجاح! ✅
            رقم الفاتورة: {{1}}
            المبلغ: {{2}} ر.س
            شكراً لك.
        """.trimIndent(),

        "class_booked_ar" to """
            تم حجز الحصة بنجاح! 🎯
            الحصة: {{1}}
            التاريخ: {{2}}
            الوقت: {{3}}
            نراك هناك!
        """.trimIndent(),

        "class_reminder_ar" to """
            تذكير: لديك حصة غداً 📅
            الحصة: {{1}}
            التاريخ: {{2}}
            الوقت: {{3}}
        """.trimIndent(),

        // English templates
        "welcome_en" to """
            Welcome {{1}}! 👋
            Welcome to {{2}}.
            We wish you a great fitness journey.
        """.trimIndent(),

        "subscription_created_en" to """
            Your subscription is now active! ✅
            Plan: {{1}}
            Expires: {{2}}
            Thank you for choosing {{3}}.
        """.trimIndent(),

        "subscription_expiring_en" to """
            Reminder: Your {{1}} subscription expires in {{2}} days.
            Expiry date: {{3}}
            Renew now to continue enjoying our services.
        """.trimIndent()
    )
}
