package com.liyaqa.compliance.api

import com.liyaqa.compliance.application.services.SecurityPolicyService
import com.liyaqa.compliance.domain.model.*
import com.liyaqa.shared.domain.TenantContext
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ===== DTOs =====

data class PolicyResponse(
    val id: UUID,
    val organizationId: UUID,
    val policyType: PolicyType,
    val title: String,
    val titleAr: String?,
    val content: String?,
    val contentAr: String?,
    val version: String,
    val status: PolicyStatus,
    val effectiveDate: LocalDate?,
    val reviewDate: LocalDate?,
    val nextReviewDate: LocalDate?,
    val ownerId: UUID?,
    val approvedBy: UUID?,
    val approvedAt: Instant?,
    val acknowledgementRequired: Boolean,
    val relatedFrameworkIds: List<UUID>?,
    val documentPath: String?,
    val isReviewDue: Boolean,
    val isActive: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(policy: SecurityPolicy) = PolicyResponse(
            id = policy.id,
            organizationId = policy.organizationId,
            policyType = policy.policyType,
            title = policy.title,
            titleAr = policy.titleAr,
            content = policy.content,
            contentAr = policy.contentAr,
            version = policy.policyVersion,
            status = policy.status,
            effectiveDate = policy.effectiveDate,
            reviewDate = policy.reviewDate,
            nextReviewDate = policy.nextReviewDate,
            ownerId = policy.ownerId,
            approvedBy = policy.approvedBy,
            approvedAt = policy.approvedAt,
            acknowledgementRequired = policy.acknowledgementRequired,
            relatedFrameworkIds = policy.relatedFrameworkIds,
            documentPath = policy.documentPath,
            isReviewDue = policy.isReviewDue(),
            isActive = policy.isActive(),
            createdAt = policy.createdAt
        )
    }
}

data class AcknowledgementResponse(
    val id: UUID,
    val policyId: UUID,
    val userId: UUID,
    val acknowledgedAt: Instant,
    val method: AcknowledgementMethod,
    val policyVersion: String
) {
    companion object {
        fun from(ack: PolicyAcknowledgement) = AcknowledgementResponse(
            id = ack.id,
            policyId = ack.policy.id,
            userId = ack.userId,
            acknowledgedAt = ack.acknowledgedAt,
            method = ack.acknowledgementMethod,
            policyVersion = ack.policyVersion
        )
    }
}

data class CreatePolicyRequest(
    val policyType: PolicyType,
    val title: String,
    val titleAr: String? = null,
    val content: String? = null,
    val contentAr: String? = null,
    val version: String = "1.0",
    val acknowledgementRequired: Boolean = false,
    val relatedFrameworkIds: List<UUID>? = null
)

data class UpdatePolicyRequest(
    val title: String? = null,
    val titleAr: String? = null,
    val content: String? = null,
    val contentAr: String? = null
)

data class AcknowledgePolicyRequest(
    val method: AcknowledgementMethod
)

@RestController
@RequestMapping("/api/policies")
@Tag(name = "Security Policies", description = "Security policy management and acknowledgements")
class PolicyController(
    private val policyService: SecurityPolicyService
) {
    // ===== Policies =====

    @GetMapping
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get security policies")
    fun getPolicies(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<PolicyResponse>> {
        val organizationId = getOrganizationId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val policies = policyService.getPolicies(organizationId, pageable)
        return ResponseEntity.ok(policies.content.map { PolicyResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get policy by ID")
    fun getPolicy(@PathVariable id: UUID): ResponseEntity<PolicyResponse> {
        val policy = policyService.getPolicy(id)
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get policies by type")
    fun getPoliciesByType(@PathVariable type: PolicyType): ResponseEntity<List<PolicyResponse>> {
        val organizationId = getOrganizationId()
        val policies = policyService.getPoliciesByType(organizationId, type)
        return ResponseEntity.ok(policies.map { PolicyResponse.from(it) })
    }

    @GetMapping("/type/{type}/published")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get published policy of a type")
    fun getPublishedPolicy(@PathVariable type: PolicyType): ResponseEntity<*> {
        val organizationId = getOrganizationId()
        val policy = policyService.getPublishedPolicy(organizationId, type)
        return if (policy != null) {
            ResponseEntity.ok(PolicyResponse.from(policy))
        } else {
            ResponseEntity.notFound().build<Unit>()
        }
    }

    @GetMapping("/requiring-acknowledgement")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get policies requiring acknowledgement")
    fun getPoliciesRequiringAcknowledgement(): ResponseEntity<List<PolicyResponse>> {
        val organizationId = getOrganizationId()
        val policies = policyService.getPoliciesRequiringAcknowledgement(organizationId)
        return ResponseEntity.ok(policies.map { PolicyResponse.from(it) })
    }

    @GetMapping("/review-due")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get policies due for review")
    fun getPoliciesDueForReview(): ResponseEntity<List<PolicyResponse>> {
        val organizationId = getOrganizationId()
        val policies = policyService.getPoliciesDueForReview(organizationId)
        return ResponseEntity.ok(policies.map { PolicyResponse.from(it) })
    }

    @GetMapping("/pending-acknowledgement")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get policies pending acknowledgement for current user")
    fun getPendingAcknowledgements(): ResponseEntity<List<PolicyResponse>> {
        val organizationId = getOrganizationId()
        val userId = getCurrentUserId()
        val policies = policyService.getPendingAcknowledgements(organizationId, userId)
        return ResponseEntity.ok(policies.map { PolicyResponse.from(it) })
    }

    @PostMapping
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Create a security policy")
    fun createPolicy(@Valid @RequestBody request: CreatePolicyRequest): ResponseEntity<PolicyResponse> {
        val organizationId = getOrganizationId()
        val userId = getCurrentUserId()
        val policy = policyService.createPolicy(
            organizationId = organizationId,
            policyType = request.policyType,
            title = request.title,
            titleAr = request.titleAr,
            content = request.content,
            contentAr = request.contentAr,
            version = request.version,
            ownerId = userId,
            acknowledgementRequired = request.acknowledgementRequired,
            relatedFrameworkIds = request.relatedFrameworkIds
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(PolicyResponse.from(policy))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Update policy content")
    fun updatePolicy(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdatePolicyRequest
    ): ResponseEntity<PolicyResponse> {
        val policy = policyService.updatePolicy(
            policyId = id,
            title = request.title,
            titleAr = request.titleAr,
            content = request.content,
            contentAr = request.contentAr
        )
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/new-version")
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Create new version of a policy")
    fun createNewVersion(@PathVariable id: UUID): ResponseEntity<PolicyResponse> {
        val policy = policyService.createNewVersion(id)
        return ResponseEntity.status(HttpStatus.CREATED).body(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/submit-for-review")
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Submit policy for review")
    fun submitForReview(@PathVariable id: UUID): ResponseEntity<PolicyResponse> {
        val policy = policyService.submitForReview(id)
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('policy_approve')")
    @Operation(summary = "Approve a policy")
    fun approvePolicy(@PathVariable id: UUID): ResponseEntity<PolicyResponse> {
        val userId = getCurrentUserId()
        val policy = policyService.approvePolicy(id, userId)
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('policy_approve')")
    @Operation(summary = "Publish a policy")
    fun publishPolicy(
        @PathVariable id: UUID,
        @RequestParam(required = false) effectiveDate: LocalDate?
    ): ResponseEntity<PolicyResponse> {
        val policy = policyService.publishPolicy(id, effectiveDate ?: LocalDate.now())
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/return-to-draft")
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Return policy to draft")
    fun returnToDraft(@PathVariable id: UUID): ResponseEntity<PolicyResponse> {
        val policy = policyService.returnToDraft(id)
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Archive a policy")
    fun archivePolicy(@PathVariable id: UUID): ResponseEntity<PolicyResponse> {
        val policy = policyService.archivePolicy(id)
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    @PostMapping("/{id}/complete-review")
    @PreAuthorize("hasAuthority('policy_manage')")
    @Operation(summary = "Complete policy review")
    fun completeReview(
        @PathVariable id: UUID,
        @RequestParam nextReviewDate: LocalDate
    ): ResponseEntity<PolicyResponse> {
        val policy = policyService.completeReview(id, nextReviewDate)
        return ResponseEntity.ok(PolicyResponse.from(policy))
    }

    // ===== Acknowledgements =====

    @GetMapping("/{id}/acknowledgements")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get acknowledgements for a policy")
    fun getPolicyAcknowledgements(@PathVariable id: UUID): ResponseEntity<List<AcknowledgementResponse>> {
        val acknowledgements = policyService.getPolicyAcknowledgements(id)
        return ResponseEntity.ok(acknowledgements.map { AcknowledgementResponse.from(it) })
    }

    @GetMapping("/{id}/acknowledgements/count")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get acknowledgement count for a policy")
    fun getAcknowledgementCount(@PathVariable id: UUID): ResponseEntity<Long> {
        val count = policyService.getAcknowledgementCount(id)
        return ResponseEntity.ok(count)
    }

    @GetMapping("/{id}/acknowledged")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Check if current user has acknowledged policy")
    fun hasAcknowledged(@PathVariable id: UUID): ResponseEntity<Boolean> {
        val userId = getCurrentUserId()
        val acknowledged = policyService.hasAcknowledged(id, userId)
        return ResponseEntity.ok(acknowledged)
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Acknowledge a policy")
    fun acknowledgePolicy(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AcknowledgePolicyRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<AcknowledgementResponse> {
        val userId = getCurrentUserId()
        val acknowledgement = policyService.acknowledgePolicy(
            policyId = id,
            userId = userId,
            method = request.method,
            ipAddress = httpRequest.remoteAddr,
            userAgent = httpRequest.getHeader("User-Agent")
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(AcknowledgementResponse.from(acknowledgement))
    }

    @GetMapping("/my-acknowledgements")
    @PreAuthorize("hasAuthority('policy_view')")
    @Operation(summary = "Get current user's acknowledgements")
    fun getMyAcknowledgements(): ResponseEntity<List<AcknowledgementResponse>> {
        val userId = getCurrentUserId()
        val acknowledgements = policyService.getUserAcknowledgements(userId)
        return ResponseEntity.ok(acknowledgements.map { AcknowledgementResponse.from(it) })
    }

    private fun getOrganizationId(): UUID {
        return TenantContext.getCurrentOrganizationOrNull()?.value
            ?: TenantContext.getCurrentTenant().value
    }

    private fun getCurrentUserId(): UUID {
        val auth = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        return UUID.fromString(auth.name)
    }
}
