package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.PolicyAcknowledgementRepository
import com.liyaqa.compliance.domain.ports.SecurityPolicyRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class SecurityPolicyService(
    private val policyRepository: SecurityPolicyRepository,
    private val acknowledgementRepository: PolicyAcknowledgementRepository
) {
    private val logger = LoggerFactory.getLogger(SecurityPolicyService::class.java)

    // ===== Policies =====

    /**
     * Create a new security policy.
     */
    fun createPolicy(
        organizationId: UUID,
        policyType: PolicyType,
        title: String,
        titleAr: String? = null,
        content: String? = null,
        contentAr: String? = null,
        version: String = "1.0",
        ownerId: UUID? = null,
        acknowledgementRequired: Boolean = false,
        relatedFrameworkIds: List<UUID>? = null
    ): SecurityPolicy {
        val policy = SecurityPolicy(
            organizationId = organizationId,
            policyType = policyType,
            title = title,
            titleAr = titleAr,
            content = content,
            contentAr = contentAr,
            policyVersion = version,
            ownerId = ownerId,
            acknowledgementRequired = acknowledgementRequired,
            relatedFrameworkIds = relatedFrameworkIds
        )

        val saved = policyRepository.save(policy)
        logger.info("Created policy '{}' v{} for organization {}", title, version, organizationId)
        return saved
    }

    /**
     * Get a policy by ID.
     */
    @Transactional(readOnly = true)
    fun getPolicy(id: UUID): SecurityPolicy {
        return policyRepository.findById(id)
            .orElseThrow { NoSuchElementException("Security policy not found: $id") }
    }

    /**
     * Get policies for an organization.
     */
    @Transactional(readOnly = true)
    fun getPolicies(organizationId: UUID, pageable: Pageable): Page<SecurityPolicy> {
        return policyRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Get policies by type.
     */
    @Transactional(readOnly = true)
    fun getPoliciesByType(organizationId: UUID, policyType: PolicyType): List<SecurityPolicy> {
        return policyRepository.findByOrganizationIdAndPolicyType(organizationId, policyType)
    }

    /**
     * Get published policy of a specific type.
     */
    @Transactional(readOnly = true)
    fun getPublishedPolicy(organizationId: UUID, policyType: PolicyType): SecurityPolicy? {
        return policyRepository.findByOrganizationIdAndPolicyTypeAndStatus(
            organizationId, policyType, PolicyStatus.PUBLISHED
        ).orElse(null)
    }

    /**
     * Get policies requiring acknowledgement.
     */
    @Transactional(readOnly = true)
    fun getPoliciesRequiringAcknowledgement(organizationId: UUID): List<SecurityPolicy> {
        return policyRepository.findPoliciesRequiringAcknowledgement(organizationId)
    }

    /**
     * Get policies due for review.
     */
    @Transactional(readOnly = true)
    fun getPoliciesDueForReview(organizationId: UUID): List<SecurityPolicy> {
        return policyRepository.findPoliciesDueForReview(organizationId, LocalDate.now())
    }

    /**
     * Update policy content.
     */
    fun updatePolicy(
        policyId: UUID,
        title: String? = null,
        titleAr: String? = null,
        content: String? = null,
        contentAr: String? = null
    ): SecurityPolicy {
        val policy = getPolicy(policyId)
        require(policy.status == PolicyStatus.DRAFT) { "Can only update DRAFT policies" }

        title?.let { policy.title = it }
        titleAr?.let { policy.titleAr = it }
        content?.let { policy.content = it }
        contentAr?.let { policy.contentAr = it }

        return policyRepository.save(policy)
    }

    /**
     * Create a new version of a policy.
     */
    fun createNewVersion(policyId: UUID): SecurityPolicy {
        val existingPolicy = getPolicy(policyId)
        require(existingPolicy.status == PolicyStatus.PUBLISHED) { "Can only version PUBLISHED policies" }

        val newVersion = SecurityPolicy(
            organizationId = existingPolicy.organizationId,
            policyType = existingPolicy.policyType,
            title = existingPolicy.title,
            titleAr = existingPolicy.titleAr,
            content = existingPolicy.content,
            contentAr = existingPolicy.contentAr,
            policyVersion = existingPolicy.incrementVersion(),
            ownerId = existingPolicy.ownerId,
            acknowledgementRequired = existingPolicy.acknowledgementRequired,
            relatedFrameworkIds = existingPolicy.relatedFrameworkIds
        )

        val saved = policyRepository.save(newVersion)
        logger.info("Created new version {} of policy {}", saved.policyVersion, existingPolicy.title)
        return saved
    }

    /**
     * Submit policy for review.
     */
    fun submitForReview(policyId: UUID): SecurityPolicy {
        val policy = getPolicy(policyId)
        policy.submitForReview()
        return policyRepository.save(policy)
    }

    /**
     * Approve policy.
     */
    fun approvePolicy(policyId: UUID, approverId: UUID): SecurityPolicy {
        val policy = getPolicy(policyId)
        policy.approve(approverId)
        logger.info("Policy '{}' approved by {}", policy.title, approverId)
        return policyRepository.save(policy)
    }

    /**
     * Publish policy.
     */
    fun publishPolicy(policyId: UUID, effectiveDate: LocalDate = LocalDate.now()): SecurityPolicy {
        val policy = getPolicy(policyId)

        // Archive any existing published policy of the same type
        policyRepository.findByOrganizationIdAndPolicyTypeAndStatus(
            policy.organizationId, policy.policyType, PolicyStatus.PUBLISHED
        ).ifPresent {
            it.archive()
            policyRepository.save(it)
        }

        policy.publish(effectiveDate)
        logger.info("Policy '{}' published, effective {}", policy.title, effectiveDate)
        return policyRepository.save(policy)
    }

    /**
     * Return policy to draft.
     */
    fun returnToDraft(policyId: UUID): SecurityPolicy {
        val policy = getPolicy(policyId)
        policy.returnToDraft()
        return policyRepository.save(policy)
    }

    /**
     * Archive policy.
     */
    fun archivePolicy(policyId: UUID): SecurityPolicy {
        val policy = getPolicy(policyId)
        policy.archive()
        return policyRepository.save(policy)
    }

    /**
     * Complete review.
     */
    fun completeReview(policyId: UUID, nextReviewDate: LocalDate): SecurityPolicy {
        val policy = getPolicy(policyId)
        policy.completeReview(nextReviewDate)
        return policyRepository.save(policy)
    }

    // ===== Acknowledgements =====

    /**
     * Record policy acknowledgement.
     */
    fun acknowledgePolicy(
        policyId: UUID,
        userId: UUID,
        method: AcknowledgementMethod,
        ipAddress: String? = null,
        userAgent: String? = null
    ): PolicyAcknowledgement {
        val policy = getPolicy(policyId)
        require(policy.status == PolicyStatus.PUBLISHED) { "Can only acknowledge PUBLISHED policies" }

        // Check if already acknowledged this version
        if (acknowledgementRepository.existsByPolicyIdAndUserIdAndPolicyVersion(policyId, userId, policy.policyVersion)) {
            throw IllegalStateException("User has already acknowledged this policy version")
        }

        val acknowledgement = PolicyAcknowledgement(
            policy = policy,
            userId = userId,
            acknowledgementMethod = method,
            ipAddress = ipAddress,
            userAgent = userAgent,
            policyVersion = policy.policyVersion
        )

        val saved = acknowledgementRepository.save(acknowledgement)
        logger.info("User {} acknowledged policy '{}' v{}", userId, policy.title, policy.policyVersion)
        return saved
    }

    /**
     * Get acknowledgements for a policy.
     */
    @Transactional(readOnly = true)
    fun getPolicyAcknowledgements(policyId: UUID): List<PolicyAcknowledgement> {
        return acknowledgementRepository.findByPolicyId(policyId)
    }

    /**
     * Get acknowledgements by user.
     */
    @Transactional(readOnly = true)
    fun getUserAcknowledgements(userId: UUID): List<PolicyAcknowledgement> {
        return acknowledgementRepository.findByUserId(userId)
    }

    /**
     * Check if user has acknowledged a policy.
     */
    @Transactional(readOnly = true)
    fun hasAcknowledged(policyId: UUID, userId: UUID): Boolean {
        val policy = getPolicy(policyId)
        return acknowledgementRepository.existsByPolicyIdAndUserIdAndPolicyVersion(
            policyId, userId, policy.policyVersion
        )
    }

    /**
     * Get acknowledgement count for a policy.
     */
    @Transactional(readOnly = true)
    fun getAcknowledgementCount(policyId: UUID): Long {
        return acknowledgementRepository.countByPolicyId(policyId)
    }

    /**
     * Get policies pending acknowledgement for a user.
     */
    @Transactional(readOnly = true)
    fun getPendingAcknowledgements(organizationId: UUID, userId: UUID): List<SecurityPolicy> {
        val policies = policyRepository.findPoliciesRequiringAcknowledgement(organizationId)
        return policies.filter { policy ->
            !acknowledgementRepository.existsByPolicyIdAndUserIdAndPolicyVersion(
                policy.id, userId, policy.policyVersion
            )
        }
    }
}
