package com.liyaqa.platform.api

import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.platform.api.dto.ClientMemberDetailResponse
import com.liyaqa.platform.api.dto.ClientMemberInvoiceResponse
import com.liyaqa.platform.api.dto.ClientMemberSubscriptionResponse
import com.liyaqa.platform.api.dto.ClientMemberSummaryResponse
import com.liyaqa.platform.api.dto.ClientSupportOverviewResponse
import com.liyaqa.platform.api.dto.ClientUserResponse
import com.liyaqa.platform.api.dto.ImpersonateRequest
import com.liyaqa.platform.api.dto.ImpersonationResponse
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.application.services.ImpersonationService
import com.liyaqa.platform.application.services.PlatformSupportService
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Controller for platform support operations.
 * Allows viewing client data across organizations for support purposes.
 *
 * Endpoints:
 * - GET  /api/platform/support/clients/{id}/overview          - Get client overview
 * - GET  /api/platform/support/clients/{id}/clubs/{clubId}/members        - Get club members
 * - GET  /api/platform/support/clients/{id}/clubs/{clubId}/members/{memberId} - Get member detail
 * - GET  /api/platform/support/clients/{id}/clubs/{clubId}/subscriptions  - Get club subscriptions
 * - GET  /api/platform/support/clients/{id}/clubs/{clubId}/invoices       - Get club invoices
 * - GET  /api/platform/support/clients/{id}/clubs/{clubId}/users          - Get club users
 * - POST /api/platform/support/impersonate/{userId}           - Impersonate a user
 * - POST /api/platform/support/end-impersonation              - End impersonation session
 */
@RestController
@RequestMapping("/api/platform/support")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SUPPORT')")
class PlatformSupportController(
    private val supportService: PlatformSupportService,
    private val impersonationService: ImpersonationService
) {
    // ============================================
    // Client Data Viewing
    // ============================================

    /**
     * Gets a support overview for a client organization.
     */
    @GetMapping("/clients/{organizationId}/overview")
    fun getClientOverview(
        @PathVariable organizationId: UUID
    ): ResponseEntity<ClientSupportOverviewResponse> {
        val overview = supportService.getClientOverview(organizationId)
        return ResponseEntity.ok(overview)
    }

    /**
     * Gets members for a specific club.
     */
    @GetMapping("/clients/{organizationId}/clubs/{clubId}/members")
    fun getClientMembers(
        @PathVariable organizationId: UUID,
        @PathVariable clubId: UUID,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: MemberStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ClientMemberSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val membersPage = supportService.getClientMembers(clubId, search, status, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = membersPage.content,
                page = membersPage.number,
                size = membersPage.size,
                totalElements = membersPage.totalElements,
                totalPages = membersPage.totalPages,
                first = membersPage.isFirst,
                last = membersPage.isLast
            )
        )
    }

    /**
     * Gets detailed member info.
     */
    @GetMapping("/clients/{organizationId}/clubs/{clubId}/members/{memberId}")
    fun getMemberDetail(
        @PathVariable organizationId: UUID,
        @PathVariable clubId: UUID,
        @PathVariable memberId: UUID
    ): ResponseEntity<ClientMemberDetailResponse> {
        val member = supportService.getMemberDetail(clubId, memberId)
        return ResponseEntity.ok(member)
    }

    /**
     * Gets subscriptions for a specific club.
     */
    @GetMapping("/clients/{organizationId}/clubs/{clubId}/subscriptions")
    fun getClientSubscriptions(
        @PathVariable organizationId: UUID,
        @PathVariable clubId: UUID,
        @RequestParam(required = false) status: SubscriptionStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ClientMemberSubscriptionResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val subsPage = supportService.getClientSubscriptions(clubId, status, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subsPage.content,
                page = subsPage.number,
                size = subsPage.size,
                totalElements = subsPage.totalElements,
                totalPages = subsPage.totalPages,
                first = subsPage.isFirst,
                last = subsPage.isLast
            )
        )
    }

    /**
     * Gets invoices for a specific club.
     */
    @GetMapping("/clients/{organizationId}/clubs/{clubId}/invoices")
    fun getClientInvoices(
        @PathVariable organizationId: UUID,
        @PathVariable clubId: UUID,
        @RequestParam(required = false) status: InvoiceStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ClientMemberInvoiceResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val invoicesPage = supportService.getClientInvoices(clubId, status, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = invoicesPage.content,
                page = invoicesPage.number,
                size = invoicesPage.size,
                totalElements = invoicesPage.totalElements,
                totalPages = invoicesPage.totalPages,
                first = invoicesPage.isFirst,
                last = invoicesPage.isLast
            )
        )
    }

    /**
     * Gets users for a specific club.
     */
    @GetMapping("/clients/{organizationId}/clubs/{clubId}/users")
    fun getClientUsers(
        @PathVariable organizationId: UUID,
        @PathVariable clubId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ClientUserResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val usersPage = supportService.getClientUsers(clubId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = usersPage.content,
                page = usersPage.number,
                size = usersPage.size,
                totalElements = usersPage.totalElements,
                totalPages = usersPage.totalPages,
                first = usersPage.isFirst,
                last = usersPage.isLast
            )
        )
    }

    // ============================================
    // Impersonation
    // ============================================

    /**
     * Impersonates a user.
     * Creates an impersonation session and returns an access token for that user.
     * Audit log is created for this action.
     */
    @PostMapping("/impersonate/{userId}")
    fun impersonateUser(
        @PathVariable userId: UUID,
        @Valid @RequestBody request: ImpersonateRequest
    ): ResponseEntity<ImpersonationResponse> {
        val response = impersonationService.impersonate(userId, request.reason)
        return ResponseEntity.ok(response)
    }

    /**
     * Ends the current impersonation session.
     */
    @PostMapping("/end-impersonation")
    fun endImpersonation(): ResponseEntity<Void> {
        impersonationService.endImpersonation()
        return ResponseEntity.ok().build()
    }
}
