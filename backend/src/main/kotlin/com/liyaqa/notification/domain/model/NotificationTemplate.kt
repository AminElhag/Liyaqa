package com.liyaqa.notification.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "notification_templates")
class NotificationTemplate(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    /**
     * Unique code to identify the template (e.g., "INVOICE_GENERATED", "PAYMENT_FAILED")
     */
    @Column(name = "code", unique = true, nullable = false, length = 100)
    val code: String,

    /**
     * Template name in English
     */
    @Column(name = "name_en", length = 200)
    val nameEn: String,

    /**
     * Template name in Arabic
     */
    @Column(name = "name_ar", length = 200)
    val nameAr: String,

    /**
     * Category for grouping templates (e.g., BILLING, MEMBERSHIP, BOOKING, SYSTEM)
     */
    @Column(name = "category", length = 50)
    @Enumerated(EnumType.STRING)
    val category: TemplateCategory,

    /**
     * Subject line in English (Handlebars template)
     */
    @Column(name = "subject_en", columnDefinition = "TEXT")
    val subjectEn: String,

    /**
     * Subject line in Arabic (Handlebars template)
     */
    @Column(name = "subject_ar", columnDefinition = "TEXT")
    val subjectAr: String,

    /**
     * Email body in English (Handlebars template)
     */
    @Column(name = "body_en", columnDefinition = "TEXT")
    val bodyEn: String,

    /**
     * Email body in Arabic (Handlebars template)
     */
    @Column(name = "body_ar", columnDefinition = "TEXT")
    val bodyAr: String,

    /**
     * SMS body in English (Handlebars template) - shorter than email
     */
    @Column(name = "sms_en", columnDefinition = "TEXT")
    val smsEn: String? = null,

    /**
     * SMS body in Arabic (Handlebars template) - shorter than email
     */
    @Column(name = "sms_ar", columnDefinition = "TEXT")
    val smsAr: String? = null,

    /**
     * List of available variables for this template (JSON array of variable names)
     * Example: ["memberName", "invoiceNumber", "amount", "dueDate"]
     */
    @Column(name = "variables", columnDefinition = "JSONB")
    val variables: String? = null,

    /**
     * Example values for testing the template (JSON object)
     * Example: {"memberName": "John Doe", "invoiceNumber": "INV-001", "amount": "500"}
     */
    @Column(name = "example_data", columnDefinition = "JSONB")
    val exampleData: String? = null,

    /**
     * Whether this template is active and can be used
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    /**
     * Created timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    /**
     * Last updated timestamp
     */
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    /**
     * Get the subject for the specified locale
     */
    fun getSubject(locale: String): String {
        return when (locale.lowercase()) {
            "ar" -> subjectAr
            else -> subjectEn
        }
    }

    /**
     * Get the body for the specified locale
     */
    fun getBody(locale: String): String {
        return when (locale.lowercase()) {
            "ar" -> bodyAr
            else -> bodyEn
        }
    }

    /**
     * Get the SMS text for the specified locale
     */
    fun getSms(locale: String): String? {
        return when (locale.lowercase()) {
            "ar" -> smsAr
            else -> smsEn
        }
    }

    /**
     * Mark as updated
     */
    fun markAsUpdated() {
        updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is NotificationTemplate) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    override fun toString(): String {
        return "NotificationTemplate(id=$id, code='$code', category=$category, isActive=$isActive)"
    }
}

/**
 * Categories for organizing notification templates
 */
enum class TemplateCategory {
    /**
     * Billing and invoice-related templates
     */
    BILLING,

    /**
     * Membership and subscription-related templates
     */
    MEMBERSHIP,

    /**
     * Class booking and attendance templates
     */
    BOOKING,

    /**
     * Payment-related templates
     */
    PAYMENT,

    /**
     * Security and authentication templates
     */
    SECURITY,

    /**
     * System notifications
     */
    SYSTEM,

    /**
     * Marketing and promotional templates
     */
    MARKETING
}
