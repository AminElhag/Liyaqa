package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.DataDeletionLogRepository
import com.liyaqa.compliance.domain.ports.DataRetentionRuleRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class DataRetentionService(
    private val retentionRuleRepository: DataRetentionRuleRepository,
    private val deletionLogRepository: DataDeletionLogRepository,
    private val anonymizationService: DataAnonymizationService
) {
    private val logger = LoggerFactory.getLogger(DataRetentionService::class.java)

    // ===== Retention Rules =====

    /**
     * Create a data retention rule.
     */
    fun createRetentionRule(
        organizationId: UUID,
        entityType: String,
        retentionPeriodDays: Int,
        actionOnExpiry: RetentionAction,
        legalBasis: String? = null,
        appliesToDeletedOnly: Boolean = false
    ): DataRetentionRule {
        // Check if rule already exists for this entity type
        retentionRuleRepository.findByOrganizationIdAndEntityType(organizationId, entityType)
            .ifPresent { throw IllegalArgumentException("Retention rule already exists for $entityType") }

        val rule = DataRetentionRule(
            organizationId = organizationId,
            entityType = entityType,
            retentionPeriodDays = retentionPeriodDays,
            actionOnExpiry = actionOnExpiry,
            legalBasis = legalBasis,
            appliesToDeletedOnly = appliesToDeletedOnly
        )

        val saved = retentionRuleRepository.save(rule)
        logger.info("Created retention rule for {} - {} days, action: {}",
            entityType, retentionPeriodDays, actionOnExpiry)
        return saved
    }

    /**
     * Get a retention rule by ID.
     */
    @Transactional(readOnly = true)
    fun getRetentionRule(id: UUID): DataRetentionRule {
        return retentionRuleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Retention rule not found: $id") }
    }

    /**
     * Get all retention rules for an organization.
     */
    @Transactional(readOnly = true)
    fun getRetentionRules(organizationId: UUID): List<DataRetentionRule> {
        return retentionRuleRepository.findByOrganizationId(organizationId)
    }

    /**
     * Get active retention rules.
     */
    @Transactional(readOnly = true)
    fun getActiveRetentionRules(organizationId: UUID): List<DataRetentionRule> {
        return retentionRuleRepository.findByOrganizationIdAndIsActive(organizationId, true)
    }

    /**
     * Get retention rule for an entity type.
     */
    @Transactional(readOnly = true)
    fun getRetentionRuleForEntityType(organizationId: UUID, entityType: String): DataRetentionRule? {
        return retentionRuleRepository.findByOrganizationIdAndEntityType(organizationId, entityType)
            .orElse(null)
    }

    /**
     * Update retention rule.
     */
    fun updateRetentionRule(
        ruleId: UUID,
        retentionPeriodDays: Int? = null,
        actionOnExpiry: RetentionAction? = null,
        legalBasis: String? = null
    ): DataRetentionRule {
        val rule = getRetentionRule(ruleId)
        retentionPeriodDays?.let { rule.updateRetentionPeriod(it, legalBasis) }
        actionOnExpiry?.let { rule.actionOnExpiry = it }
        return retentionRuleRepository.save(rule)
    }

    /**
     * Activate/deactivate retention rule.
     */
    fun setRetentionRuleActive(ruleId: UUID, active: Boolean): DataRetentionRule {
        val rule = getRetentionRule(ruleId)
        if (active) rule.activate() else rule.deactivate()
        return retentionRuleRepository.save(rule)
    }

    // ===== Deletion Log =====

    /**
     * Log a data deletion.
     */
    fun logDeletion(
        entityType: String,
        entityId: UUID,
        deletionType: DeletionType,
        deletedBy: UUID? = null,
        deletionReason: DeletionReason? = null,
        retentionRuleId: UUID? = null,
        dsrRequestId: UUID? = null,
        originalDataHash: String? = null
    ): DataDeletionLog {
        val tenantId = TenantContext.getCurrentTenant().value

        val log = DataDeletionLog(
            tenantId = tenantId,
            entityType = entityType,
            entityId = entityId,
            deletionType = deletionType,
            deletedBy = deletedBy,
            deletionReason = deletionReason,
            retentionRule = retentionRuleId?.let { getRetentionRule(it) },
            dsrRequest = null, // Would need to inject DSR repository
            originalDataHash = originalDataHash
        )

        val saved = deletionLogRepository.save(log)
        logger.info("Logged {} of {} entity {} - reason: {}",
            deletionType, entityType, entityId, deletionReason)
        return saved
    }

    /**
     * Get deletion log for an entity.
     */
    @Transactional(readOnly = true)
    fun getDeletionLog(entityType: String, entityId: UUID): List<DataDeletionLog> {
        return deletionLogRepository.findByEntityTypeAndEntityId(entityType, entityId)
    }

    /**
     * Get deletion log by date range.
     */
    @Transactional(readOnly = true)
    fun getDeletionLogByDateRange(
        startDate: Instant,
        endDate: Instant,
        pageable: Pageable
    ): Page<DataDeletionLog> {
        val tenantId = TenantContext.getCurrentTenant().value
        return deletionLogRepository.findByDateRange(tenantId, startDate, endDate, pageable)
    }

    /**
     * Get deletion log by reason.
     */
    @Transactional(readOnly = true)
    fun getDeletionLogByReason(reason: DeletionReason, pageable: Pageable): Page<DataDeletionLog> {
        return deletionLogRepository.findByDeletionReason(reason, pageable)
    }

    // ===== Helper Methods =====

    /**
     * Check if data should be retained based on retention rules.
     */
    @Transactional(readOnly = true)
    fun shouldRetain(organizationId: UUID, entityType: String, dataAgeInDays: Long): Boolean {
        val rule = getRetentionRuleForEntityType(organizationId, entityType)
        return rule?.shouldRetain(dataAgeInDays) ?: true // Retain if no rule exists
    }

    /**
     * Get action to take when retention period expires.
     */
    @Transactional(readOnly = true)
    fun getExpiryAction(organizationId: UUID, entityType: String): RetentionAction? {
        return getRetentionRuleForEntityType(organizationId, entityType)?.actionOnExpiry
    }

    /**
     * Calculate SHA-256 hash of data for audit trail.
     */
    fun calculateDataHash(data: String): String {
        val md = java.security.MessageDigest.getInstance("SHA-256")
        val hash = md.digest(data.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }

    /**
     * Get default retention rules for common entity types.
     */
    fun getDefaultRetentionRules(): Map<String, Pair<Int, RetentionAction>> {
        return mapOf(
            "MEMBER" to (2555 to RetentionAction.ANONYMIZE), // 7 years after contract end
            "INVOICE" to (2555 to RetentionAction.ARCHIVE), // 7 years for tax purposes
            "ATTENDANCE" to (365 to RetentionAction.DELETE), // 1 year
            "AUDIT_LOG" to (2555 to RetentionAction.ARCHIVE), // 7 years
            "SECURITY_EVENT" to (365 to RetentionAction.DELETE), // 1 year
            "LEAD" to (730 to RetentionAction.DELETE), // 2 years if not converted
            "CONSENT_RECORD" to (2555 to RetentionAction.ARCHIVE), // 7 years (proof)
            "DSR_REQUEST" to (2555 to RetentionAction.ARCHIVE), // 7 years (proof)
            "NOTIFICATION" to (90 to RetentionAction.DELETE) // 3 months
        )
    }

    // ===== Scheduled Processing =====

    /**
     * Process all active retention rules and delete/anonymize expired data.
     * This is called by the scheduled job.
     */
    fun processRetentionRules(): RetentionProcessingResult {
        logger.info("Starting retention rules processing...")

        val allActiveRules = retentionRuleRepository.findByIsActive(true)
        var processedRules = 0
        var deletedRecords = 0L
        var anonymizedRecords = 0L

        for (rule in allActiveRules) {
            try {
                val result = processRule(rule)
                deletedRecords += result.first
                anonymizedRecords += result.second
                processedRules++
            } catch (e: Exception) {
                logger.error("Failed to process retention rule {}: {}", rule.id, e.message)
            }
        }

        logger.info(
            "Retention processing completed - rules: {}, deleted: {}, anonymized: {}",
            processedRules, deletedRecords, anonymizedRecords
        )

        return RetentionProcessingResult(processedRules, deletedRecords, anonymizedRecords)
    }

    /**
     * Process a single retention rule.
     * Returns (deletedCount, anonymizedCount).
     *
     * NOTE: Actual entity deletion would require repositories for each entity type.
     * This is a placeholder that logs what would be deleted.
     */
    private fun processRule(rule: DataRetentionRule): Pair<Long, Long> {
        val cutoffDate = rule.getRetentionCutoffDate()
        logger.debug(
            "Processing rule {} for entity {} - cutoff date: {}, action: {}",
            rule.id, rule.entityType, cutoffDate, rule.actionOnExpiry
        )

        // In a real implementation, this would:
        // 1. Query the appropriate repository for records older than cutoff
        // 2. Apply the retention action (DELETE, ANONYMIZE, or ARCHIVE)
        // 3. Log each deletion
        // 4. Return the counts

        // For now, we just mark the rule as having been processed
        rule.lastProcessedAt = Instant.now()
        retentionRuleRepository.save(rule)

        // Placeholder return - actual implementation would return real counts
        return 0L to 0L
    }

    /**
     * Get all active retention rules across all organizations.
     */
    @Transactional(readOnly = true)
    fun getAllActiveRetentionRules(): List<DataRetentionRule> {
        return retentionRuleRepository.findByIsActive(true)
    }
}

/**
 * Result of retention processing.
 */
data class RetentionProcessingResult(
    val processedRules: Int,
    val deletedRecords: Long,
    val anonymizedRecords: Long
)
