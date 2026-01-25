package com.liyaqa.crm.domain.model

import com.liyaqa.shared.domain.BaseEntity
import io.hypersistence.utils.hibernate.type.json.JsonType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import org.hibernate.annotations.Type
import java.util.UUID

/**
 * Lead capture form entity for creating embeddable forms on club websites.
 * Forms collect lead information and automatically create Lead entries.
 */
@Entity
@Table(name = "lead_capture_forms")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class LeadCaptureForm(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "slug", nullable = false)
    var slug: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Type(JsonType::class)
    @Column(name = "config", nullable = false, columnDefinition = "jsonb")
    var config: LeadCaptureFormConfig = LeadCaptureFormConfig(),

    @Type(JsonType::class)
    @Column(name = "styling", columnDefinition = "jsonb")
    var styling: LeadCaptureFormStyling = LeadCaptureFormStyling(),

    @Column(name = "redirect_url")
    var redirectUrl: String? = null,

    @Column(name = "thank_you_message_en", columnDefinition = "TEXT")
    var thankYouMessageEn: String = "Thank you for your interest! We will contact you soon.",

    @Column(name = "thank_you_message_ar", columnDefinition = "TEXT")
    var thankYouMessageAr: String = "شكراً لاهتمامك! سنتواصل معك قريباً.",

    @Column(name = "submission_count", nullable = false)
    var submissionCount: Long = 0

) : BaseEntity(id) {

    /**
     * Activate the form
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivate the form
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Generate embed code for the form
     */
    fun generateEmbedCode(baseUrl: String): String {
        return """
            <iframe
                src="$baseUrl/forms/$slug"
                width="100%"
                height="600"
                frameborder="0"
                style="border: none; max-width: 500px;"
            ></iframe>
        """.trimIndent()
    }

    /**
     * Update form configuration
     */
    fun updateConfig(newConfig: LeadCaptureFormConfig) {
        config = newConfig
    }

    /**
     * Update form styling
     */
    fun updateStyling(newStyling: LeadCaptureFormStyling) {
        styling = newStyling
    }
}

/**
 * Form field configuration
 */
data class FormField(
    val name: String,
    val type: FormFieldType = FormFieldType.TEXT,
    val required: Boolean = false,
    val label: LocalizedLabel = LocalizedLabel(),
    val placeholder: LocalizedLabel? = null,
    val options: List<FormFieldOption>? = null, // For SELECT, RADIO, CHECKBOX
    val validation: FieldValidation? = null
)

/**
 * Localized label with English and Arabic support
 */
data class LocalizedLabel(
    val en: String = "",
    val ar: String = ""
)

/**
 * Form field option (for SELECT, RADIO, CHECKBOX)
 */
data class FormFieldOption(
    val value: String,
    val label: LocalizedLabel
)

/**
 * Field validation rules
 */
data class FieldValidation(
    val minLength: Int? = null,
    val maxLength: Int? = null,
    val pattern: String? = null,
    val errorMessage: LocalizedLabel? = null
)

/**
 * Form field types
 */
enum class FormFieldType {
    TEXT,
    EMAIL,
    TEL,
    NUMBER,
    TEXTAREA,
    SELECT,
    RADIO,
    CHECKBOX,
    DATE
}

/**
 * Form configuration
 */
data class LeadCaptureFormConfig(
    val fields: List<FormField> = listOf(
        FormField(
            name = "firstName",
            type = FormFieldType.TEXT,
            required = true,
            label = LocalizedLabel(en = "First Name", ar = "الاسم الأول")
        ),
        FormField(
            name = "lastName",
            type = FormFieldType.TEXT,
            required = true,
            label = LocalizedLabel(en = "Last Name", ar = "اسم العائلة")
        ),
        FormField(
            name = "email",
            type = FormFieldType.EMAIL,
            required = true,
            label = LocalizedLabel(en = "Email", ar = "البريد الإلكتروني")
        ),
        FormField(
            name = "phone",
            type = FormFieldType.TEL,
            required = false,
            label = LocalizedLabel(en = "Phone", ar = "رقم الهاتف")
        )
    ),
    val defaultSource: LeadSource = LeadSource.WEBSITE,
    val autoAssign: Boolean = false,
    val assignToUserId: UUID? = null,
    val notifyOnSubmission: Boolean = true,
    val notifyUserIds: List<UUID> = emptyList(),
    val submitButtonText: LocalizedLabel = LocalizedLabel(
        en = "Submit",
        ar = "إرسال"
    ),
    val privacyPolicyUrl: String? = null,
    val showPrivacyConsent: Boolean = false
)

/**
 * Form styling configuration
 */
data class LeadCaptureFormStyling(
    val theme: FormTheme = FormTheme.LIGHT,
    val primaryColor: String = "#0ea5e9",
    val backgroundColor: String? = null,
    val textColor: String? = null,
    val borderRadius: String = "8px",
    val fontFamily: String = "system-ui",
    val showLogo: Boolean = true,
    val customCss: String? = null
)

/**
 * Form theme options
 */
enum class FormTheme {
    LIGHT,
    DARK,
    SYSTEM
}
