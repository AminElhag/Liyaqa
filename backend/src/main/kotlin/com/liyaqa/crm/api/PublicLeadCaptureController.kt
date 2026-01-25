package com.liyaqa.crm.api

import com.liyaqa.crm.application.commands.SubmitLeadFormCommand
import com.liyaqa.crm.application.services.LeadCaptureFormService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Public (unauthenticated) endpoints for lead capture form submission.
 * These endpoints are accessible without authentication.
 */
@RestController
@RequestMapping("/api/public/forms")
@Tag(name = "Public Lead Forms", description = "Public endpoints for lead capture form submission")
class PublicLeadCaptureController(
    private val formService: LeadCaptureFormService
) {

    @GetMapping("/{slug}")
    @Operation(summary = "Get a public lead capture form by slug")
    fun getPublicForm(@PathVariable slug: String): ResponseEntity<PublicFormResponse> {
        val form = formService.getActiveFormBySlug(slug)
        return ResponseEntity.ok(PublicFormResponse.from(form))
    }

    @PostMapping("/{slug}/submit")
    @Operation(summary = "Submit a lead capture form")
    fun submitForm(
        @PathVariable slug: String,
        @Valid @RequestBody request: SubmitFormRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<FormSubmissionResponse> {
        val command = SubmitLeadFormCommand(
            formSlug = slug,
            data = request.data,
            ipAddress = getClientIp(httpRequest),
            userAgent = httpRequest.getHeader("User-Agent"),
            utmSource = request.utmSource,
            utmMedium = request.utmMedium,
            utmCampaign = request.utmCampaign
        )

        val lead = formService.submitForm(command)

        // Get form to return thank you message
        val form = formService.getActiveFormBySlug(slug)

        return ResponseEntity.status(HttpStatus.CREATED).body(
            FormSubmissionResponse(
                success = true,
                leadId = lead.id.toString(),
                redirectUrl = form.redirectUrl,
                thankYouMessageEn = form.thankYouMessageEn,
                thankYouMessageAr = form.thankYouMessageAr
            )
        )
    }

    private fun getClientIp(request: HttpServletRequest): String? {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return if (!xForwardedFor.isNullOrBlank()) {
            xForwardedFor.split(",").firstOrNull()?.trim()
        } else {
            request.remoteAddr
        }
    }
}
