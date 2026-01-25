package com.liyaqa.crm.application.commands

import com.liyaqa.crm.domain.model.LeadCaptureFormConfig
import com.liyaqa.crm.domain.model.LeadCaptureFormStyling
import java.util.UUID

/**
 * Command to create a new lead capture form.
 */
data class CreateLeadCaptureFormCommand(
    val name: String,
    val slug: String,
    val description: String? = null,
    val config: LeadCaptureFormConfig? = null,
    val styling: LeadCaptureFormStyling? = null,
    val redirectUrl: String? = null,
    val thankYouMessageEn: String? = null,
    val thankYouMessageAr: String? = null
)

/**
 * Command to update an existing lead capture form.
 */
data class UpdateLeadCaptureFormCommand(
    val name: String? = null,
    val description: String? = null,
    val config: LeadCaptureFormConfig? = null,
    val styling: LeadCaptureFormStyling? = null,
    val redirectUrl: String? = null,
    val thankYouMessageEn: String? = null,
    val thankYouMessageAr: String? = null
)

/**
 * Command to submit a lead through a capture form.
 */
data class SubmitLeadFormCommand(
    val formId: UUID? = null,
    val formSlug: String? = null,
    val data: Map<String, Any>,
    val ipAddress: String? = null,
    val userAgent: String? = null,
    // UTM parameters for campaign attribution
    val utmSource: String? = null,
    val utmMedium: String? = null,
    val utmCampaign: String? = null
) {
    init {
        require(formId != null || formSlug != null) {
            "Either formId or formSlug must be provided"
        }
    }
}
