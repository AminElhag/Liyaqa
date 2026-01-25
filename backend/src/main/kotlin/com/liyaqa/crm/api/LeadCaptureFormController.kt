package com.liyaqa.crm.api

import com.liyaqa.crm.application.commands.CreateLeadCaptureFormCommand
import com.liyaqa.crm.application.commands.UpdateLeadCaptureFormCommand
import com.liyaqa.crm.application.services.LeadCaptureFormService
import com.liyaqa.crm.domain.model.LeadCaptureFormConfig
import com.liyaqa.crm.domain.model.LeadCaptureFormStyling
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/lead-capture-forms")
@Tag(name = "Lead Capture Forms", description = "Manage embeddable lead capture forms")
class LeadCaptureFormController(
    private val formService: LeadCaptureFormService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('leads_create')")
    @Operation(summary = "Create a new lead capture form")
    fun createForm(@Valid @RequestBody request: CreateLeadCaptureFormRequest): ResponseEntity<LeadCaptureFormResponse> {
        val command = CreateLeadCaptureFormCommand(
            name = request.name,
            slug = request.slug,
            description = request.description,
            config = request.config,
            styling = request.styling,
            redirectUrl = request.redirectUrl,
            thankYouMessageEn = request.thankYouMessageEn,
            thankYouMessageAr = request.thankYouMessageAr
        )
        val form = formService.createForm(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(LeadCaptureFormResponse.from(form))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get a lead capture form by ID")
    fun getForm(@PathVariable id: UUID): ResponseEntity<LeadCaptureFormResponse> {
        val form = formService.getForm(id)
        return ResponseEntity.ok(LeadCaptureFormResponse.from(form))
    }

    @GetMapping("/slug/{slug}")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get a lead capture form by slug")
    fun getFormBySlug(@PathVariable slug: String): ResponseEntity<LeadCaptureFormResponse> {
        val form = formService.getFormBySlug(slug)
        return ResponseEntity.ok(LeadCaptureFormResponse.from(form))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get all lead capture forms")
    fun getAllForms(
        @RequestParam(defaultValue = "") search: String?,
        @RequestParam isActive: Boolean?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<org.springframework.data.domain.Page<LeadCaptureFormResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val forms = formService.searchForms(search, isActive, pageable)
        return ResponseEntity.ok(forms.map { LeadCaptureFormResponse.from(it) })
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Update a lead capture form")
    fun updateForm(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateLeadCaptureFormRequest
    ): ResponseEntity<LeadCaptureFormResponse> {
        val command = UpdateLeadCaptureFormCommand(
            name = request.name,
            description = request.description,
            config = request.config,
            styling = request.styling,
            redirectUrl = request.redirectUrl,
            thankYouMessageEn = request.thankYouMessageEn,
            thankYouMessageAr = request.thankYouMessageAr
        )
        val form = formService.updateForm(id, command)
        return ResponseEntity.ok(LeadCaptureFormResponse.from(form))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Activate a lead capture form")
    fun activateForm(@PathVariable id: UUID): ResponseEntity<LeadCaptureFormResponse> {
        val form = formService.activateForm(id)
        return ResponseEntity.ok(LeadCaptureFormResponse.from(form))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Deactivate a lead capture form")
    fun deactivateForm(@PathVariable id: UUID): ResponseEntity<LeadCaptureFormResponse> {
        val form = formService.deactivateForm(id)
        return ResponseEntity.ok(LeadCaptureFormResponse.from(form))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_delete')")
    @Operation(summary = "Delete a lead capture form")
    fun deleteForm(@PathVariable id: UUID): ResponseEntity<Void> {
        formService.deleteForm(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}/embed-code")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get embed code for a lead capture form")
    fun getEmbedCode(
        @PathVariable id: UUID,
        @RequestParam(required = false) baseUrl: String?
    ): ResponseEntity<EmbedCodeResponse> {
        val actualBaseUrl = baseUrl ?: "https://your-domain.com"
        val embedCode = formService.generateEmbedCode(id, actualBaseUrl)
        return ResponseEntity.ok(EmbedCodeResponse(embedCode))
    }

    @GetMapping("/top")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get top performing forms")
    fun getTopForms(@RequestParam(defaultValue = "5") limit: Int): ResponseEntity<List<LeadCaptureFormResponse>> {
        val forms = formService.getTopForms(limit)
        return ResponseEntity.ok(forms.map { LeadCaptureFormResponse.from(it) })
    }
}
