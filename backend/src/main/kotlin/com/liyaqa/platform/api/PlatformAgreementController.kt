package com.liyaqa.platform.api

import com.liyaqa.membership.api.AgreementResponse
import com.liyaqa.membership.api.CreateAgreementRequest
import com.liyaqa.membership.api.PageResponse
import com.liyaqa.membership.api.UpdateAgreementRequest
import com.liyaqa.platform.application.services.PlatformAgreementService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
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

/**
 * REST controller for platform-level agreement management.
 * Allows platform admins to manage club-specific agreements.
 *
 * Endpoints:
 * - GET    /api/platform/clubs/{clubId}/agreements           - List agreements for club
 * - GET    /api/platform/clubs/{clubId}/agreements/{id}      - Get specific agreement
 * - POST   /api/platform/clubs/{clubId}/agreements           - Create agreement for club
 * - PUT    /api/platform/clubs/{clubId}/agreements/{id}      - Update agreement
 * - POST   /api/platform/clubs/{clubId}/agreements/{id}/activate   - Activate agreement
 * - POST   /api/platform/clubs/{clubId}/agreements/{id}/deactivate - Deactivate agreement
 * - DELETE /api/platform/clubs/{clubId}/agreements/{id}      - Delete (deactivate) agreement
 */
@RestController
@RequestMapping("/api/platform/clubs/{clubId}/agreements")
@Tag(name = "Platform Agreement Management", description = "Platform admin endpoints for club agreement management")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
class PlatformAgreementController(
    private val platformAgreementService: PlatformAgreementService
) {

    /**
     * Gets paginated list of agreements for a club.
     */
    @GetMapping
    @Operation(summary = "Get club agreements", description = "Get paginated list of agreements for a club")
    fun getClubAgreements(
        @PathVariable clubId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "asc") sortDirection: String
    ): ResponseEntity<PageResponse<AgreementResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val agreementsPage = platformAgreementService.getAgreementsByClub(clubId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = agreementsPage.content.map { AgreementResponse.from(it) },
                page = agreementsPage.number,
                size = agreementsPage.size,
                totalElements = agreementsPage.totalElements,
                totalPages = agreementsPage.totalPages,
                first = agreementsPage.isFirst,
                last = agreementsPage.isLast
            )
        )
    }

    /**
     * Gets a specific agreement for a club.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get agreement", description = "Get a specific agreement for a club")
    fun getAgreement(
        @PathVariable clubId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<AgreementResponse> {
        val agreement = platformAgreementService.getAgreement(clubId, id)
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    /**
     * Creates a new agreement for a club.
     * Only PLATFORM_ADMIN can create agreements.
     */
    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Create agreement", description = "Create a new agreement for a club (admin only)")
    fun createAgreement(
        @PathVariable clubId: UUID,
        @Valid @RequestBody request: CreateAgreementRequest
    ): ResponseEntity<AgreementResponse> {
        val agreement = platformAgreementService.createAgreement(
            clubId = clubId,
            title = request.title.toLocalizedText(),
            content = request.content.toLocalizedText(),
            type = request.type,
            isMandatory = request.isMandatory,
            sortOrder = request.sortOrder,
            hasHealthQuestions = request.hasHealthQuestions,
            effectiveDate = request.effectiveDate
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(AgreementResponse.from(agreement))
    }

    /**
     * Updates an existing agreement.
     * Only PLATFORM_ADMIN can update agreements.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update agreement", description = "Update an existing agreement (admin only)")
    fun updateAgreement(
        @PathVariable clubId: UUID,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateAgreementRequest
    ): ResponseEntity<AgreementResponse> {
        val agreement = platformAgreementService.updateAgreement(
            clubId = clubId,
            agreementId = id,
            title = request.title?.toLocalizedText(),
            content = request.content?.toLocalizedText(),
            isMandatory = request.isMandatory,
            sortOrder = request.sortOrder,
            hasHealthQuestions = request.hasHealthQuestions,
            effectiveDate = request.effectiveDate
        )
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    /**
     * Activates an agreement.
     * Only PLATFORM_ADMIN can activate agreements.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Activate agreement", description = "Activate an agreement (admin only)")
    fun activateAgreement(
        @PathVariable clubId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<AgreementResponse> {
        val agreement = platformAgreementService.activateAgreement(clubId, id)
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    /**
     * Deactivates an agreement.
     * Only PLATFORM_ADMIN can deactivate agreements.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Deactivate agreement", description = "Deactivate an agreement (admin only)")
    fun deactivateAgreement(
        @PathVariable clubId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<AgreementResponse> {
        val agreement = platformAgreementService.deactivateAgreement(clubId, id)
        return ResponseEntity.ok(AgreementResponse.from(agreement))
    }

    /**
     * Deletes (deactivates) an agreement.
     * Only PLATFORM_ADMIN can delete agreements.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Delete agreement", description = "Delete (deactivate) an agreement (admin only)")
    fun deleteAgreement(
        @PathVariable clubId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<Void> {
        platformAgreementService.deleteAgreement(clubId, id)
        return ResponseEntity.noContent().build()
    }
}
