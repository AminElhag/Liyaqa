package com.liyaqa.crm.api

import com.liyaqa.crm.domain.model.FormField
import com.liyaqa.crm.domain.model.LeadCaptureForm
import com.liyaqa.crm.domain.model.LeadCaptureFormConfig
import com.liyaqa.crm.domain.model.LeadCaptureFormStyling
import com.liyaqa.crm.domain.model.LocalizedLabel
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import java.time.Instant

// ===== Request DTOs =====

data class CreateLeadCaptureFormRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    @field:NotBlank(message = "Slug is required")
    @field:Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
    val slug: String,

    val description: String? = null,
    val config: LeadCaptureFormConfig? = null,
    val styling: LeadCaptureFormStyling? = null,
    val redirectUrl: String? = null,
    val thankYouMessageEn: String? = null,
    val thankYouMessageAr: String? = null
)

data class UpdateLeadCaptureFormRequest(
    val name: String? = null,
    val description: String? = null,
    val config: LeadCaptureFormConfig? = null,
    val styling: LeadCaptureFormStyling? = null,
    val redirectUrl: String? = null,
    val thankYouMessageEn: String? = null,
    val thankYouMessageAr: String? = null
)

data class SubmitFormRequest(
    val data: Map<String, Any>,
    val utmSource: String? = null,
    val utmMedium: String? = null,
    val utmCampaign: String? = null
)

// ===== Response DTOs =====

data class LeadCaptureFormResponse(
    val id: String,
    val name: String,
    val slug: String,
    val description: String?,
    val isActive: Boolean,
    val config: LeadCaptureFormConfig,
    val styling: LeadCaptureFormStyling,
    val redirectUrl: String?,
    val thankYouMessageEn: String,
    val thankYouMessageAr: String,
    val submissionCount: Long,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(form: LeadCaptureForm) = LeadCaptureFormResponse(
            id = form.id.toString(),
            name = form.name,
            slug = form.slug,
            description = form.description,
            isActive = form.isActive,
            config = form.config,
            styling = form.styling,
            redirectUrl = form.redirectUrl,
            thankYouMessageEn = form.thankYouMessageEn,
            thankYouMessageAr = form.thankYouMessageAr,
            submissionCount = form.submissionCount,
            createdAt = form.createdAt,
            updatedAt = form.updatedAt
        )
    }
}

/**
 * Simplified form response for public endpoints (no sensitive config).
 */
data class PublicFormResponse(
    val slug: String,
    val fields: List<PublicFormField>,
    val styling: PublicFormStyling,
    val submitButtonText: LocalizedLabel,
    val showPrivacyConsent: Boolean,
    val privacyPolicyUrl: String?
) {
    companion object {
        fun from(form: LeadCaptureForm) = PublicFormResponse(
            slug = form.slug,
            fields = form.config.fields.map { PublicFormField.from(it) },
            styling = PublicFormStyling.from(form.styling),
            submitButtonText = form.config.submitButtonText,
            showPrivacyConsent = form.config.showPrivacyConsent,
            privacyPolicyUrl = form.config.privacyPolicyUrl
        )
    }
}

data class PublicFormField(
    val name: String,
    val type: String,
    val required: Boolean,
    val label: LocalizedLabel,
    val placeholder: LocalizedLabel?,
    val options: List<PublicFormFieldOption>?
) {
    companion object {
        fun from(field: FormField) = PublicFormField(
            name = field.name,
            type = field.type.name,
            required = field.required,
            label = field.label,
            placeholder = field.placeholder,
            options = field.options?.map { PublicFormFieldOption(it.value, it.label) }
        )
    }
}

data class PublicFormFieldOption(
    val value: String,
    val label: LocalizedLabel
)

data class PublicFormStyling(
    val theme: String,
    val primaryColor: String,
    val backgroundColor: String?,
    val textColor: String?,
    val borderRadius: String,
    val fontFamily: String
) {
    companion object {
        fun from(styling: LeadCaptureFormStyling) = PublicFormStyling(
            theme = styling.theme.name,
            primaryColor = styling.primaryColor,
            backgroundColor = styling.backgroundColor,
            textColor = styling.textColor,
            borderRadius = styling.borderRadius,
            fontFamily = styling.fontFamily
        )
    }
}

data class FormSubmissionResponse(
    val success: Boolean,
    val leadId: String,
    val redirectUrl: String?,
    val thankYouMessageEn: String,
    val thankYouMessageAr: String
)

data class EmbedCodeResponse(
    val embedCode: String
)
