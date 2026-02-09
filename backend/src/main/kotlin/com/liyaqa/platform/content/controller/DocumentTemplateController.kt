package com.liyaqa.platform.content.controller

import com.liyaqa.platform.content.dto.CreateTemplateRequest
import com.liyaqa.platform.content.dto.TemplatePreviewRequest
import com.liyaqa.platform.content.dto.TemplatePreviewResponse
import com.liyaqa.platform.content.dto.TemplateResponse
import com.liyaqa.platform.content.dto.TemplateVersionResponse
import com.liyaqa.platform.content.dto.UpdateTemplateRequest
import com.liyaqa.platform.content.service.DocumentTemplateService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
@RequestMapping("/api/v1/platform/templates")
@PlatformSecured
@Tag(name = "Document Templates", description = "Manage document templates for contracts and invoices")
class DocumentTemplateController(
    private val documentTemplateService: DocumentTemplateService
) {

    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_MANAGE])
    @Operation(summary = "Create template", description = "Create a new document template")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Template created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "409", description = "Template with this key already exists")
    )
    fun createTemplate(
        @Valid @RequestBody request: CreateTemplateRequest
    ): ResponseEntity<TemplateResponse> {
        val template = documentTemplateService.createTemplate(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(template)
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_VIEW])
    @Operation(summary = "Get template by ID", description = "Retrieve a document template by its unique identifier")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Template found"),
        ApiResponse(responseCode = "404", description = "Template not found")
    )
    fun getTemplate(@PathVariable id: UUID): ResponseEntity<TemplateResponse> {
        return ResponseEntity.ok(documentTemplateService.getTemplate(id))
    }

    @GetMapping("/key/{key}")
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_VIEW])
    @Operation(summary = "Get template by key", description = "Retrieve a document template by its unique key")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Template found"),
        ApiResponse(responseCode = "404", description = "Template not found")
    )
    fun getTemplateByKey(@PathVariable key: String): ResponseEntity<TemplateResponse> {
        return ResponseEntity.ok(documentTemplateService.getTemplateByKey(key))
    }

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_VIEW])
    @Operation(summary = "List templates", description = "List all document templates with pagination and sorting")
    @ApiResponse(responseCode = "200", description = "Templates retrieved successfully")
    fun listTemplates(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<PageResponse<TemplateResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val result = documentTemplateService.listTemplates(pageable)
        return ResponseEntity.ok(PageResponse.from(result))
    }

    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_MANAGE])
    @Operation(summary = "Update template", description = "Update an existing document template")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Template updated successfully"),
        ApiResponse(responseCode = "404", description = "Template not found")
    )
    fun updateTemplate(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTemplateRequest
    ): ResponseEntity<TemplateResponse> {
        return ResponseEntity.ok(documentTemplateService.updateTemplate(id, request))
    }

    @DeleteMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_MANAGE])
    @Operation(summary = "Delete template", description = "Delete a document template by its ID")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Template deleted successfully"),
        ApiResponse(responseCode = "404", description = "Template not found")
    )
    fun deleteTemplate(@PathVariable id: UUID): ResponseEntity<Unit> {
        documentTemplateService.deleteTemplate(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/preview")
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_VIEW])
    @Operation(summary = "Preview template", description = "Generate a preview of a template with sample or provided data")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Template preview generated successfully"),
        ApiResponse(responseCode = "404", description = "Template not found")
    )
    fun previewTemplate(
        @PathVariable id: UUID,
        @Valid @RequestBody request: TemplatePreviewRequest
    ): ResponseEntity<TemplatePreviewResponse> {
        return ResponseEntity.ok(documentTemplateService.previewTemplate(id, request))
    }

    @GetMapping("/{id}/versions")
    @PlatformSecured(permissions = [PlatformPermission.TEMPLATES_VIEW])
    @Operation(summary = "Get version history", description = "Retrieve the version history of a document template")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Version history retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Template not found")
    )
    fun getVersionHistory(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<TemplateVersionResponse>> {
        val pageable = PageRequest.of(page, size.coerceAtMost(100), Sort.by("createdAt").descending())
        val result = documentTemplateService.getTemplateVersionHistory(id, pageable)
        return ResponseEntity.ok(PageResponse.from(result))
    }
}
