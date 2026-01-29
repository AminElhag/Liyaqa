package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.DataBreachRepository
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
class DataBreachService(
    private val breachRepository: DataBreachRepository
) {
    private val logger = LoggerFactory.getLogger(DataBreachService::class.java)

    /**
     * Report a new data breach.
     */
    fun reportBreach(
        organizationId: UUID,
        title: String,
        description: String? = null,
        discoveredAt: Instant,
        discoveredBy: UUID? = null,
        occurredAt: Instant? = null,
        breachType: BreachType,
        breachSource: BreachSource? = null,
        affectedDataTypes: List<String>? = null,
        affectedRecordsCount: Int? = null,
        affectedMembersCount: Int? = null,
        severity: SecuritySeverity
    ): DataBreach {
        val tenantId = TenantContext.getCurrentTenant().value

        val breach = DataBreach(
            organizationId = organizationId,
            tenantId = tenantId,
            breachNumber = DataBreach.generateBreachNumber(),
            title = title,
            description = description,
            discoveredAt = discoveredAt,
            discoveredBy = discoveredBy,
            occurredAt = occurredAt,
            breachType = breachType,
            breachSource = breachSource,
            affectedDataTypes = affectedDataTypes,
            affectedRecordsCount = affectedRecordsCount,
            affectedMembersCount = affectedMembersCount,
            severity = severity,
            status = BreachStatus.DETECTED
        )

        // Assess notification requirements (PDPL Article 29)
        breach.assessNotificationRequirements()

        val saved = breachRepository.save(breach)
        logger.error("DATA BREACH REPORTED: {} - {} severity, affects {} records",
            saved.breachNumber, severity, affectedRecordsCount ?: "unknown")
        return saved
    }

    /**
     * Get a breach by ID.
     */
    @Transactional(readOnly = true)
    fun getBreach(id: UUID): DataBreach {
        return breachRepository.findById(id)
            .orElseThrow { NoSuchElementException("Data breach not found: $id") }
    }

    /**
     * Get a breach by breach number.
     */
    @Transactional(readOnly = true)
    fun getBreachByNumber(organizationId: UUID, breachNumber: String): DataBreach {
        return breachRepository.findByOrganizationIdAndBreachNumber(organizationId, breachNumber)
            .orElseThrow { NoSuchElementException("Data breach not found: $breachNumber") }
    }

    /**
     * Get all breaches for an organization.
     */
    @Transactional(readOnly = true)
    fun getBreaches(organizationId: UUID, pageable: Pageable): Page<DataBreach> {
        return breachRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Get breaches by status.
     */
    @Transactional(readOnly = true)
    fun getBreachesByStatus(organizationId: UUID, status: BreachStatus): List<DataBreach> {
        return breachRepository.findByOrganizationIdAndStatus(organizationId, status)
    }

    /**
     * Get breaches with overdue SDAIA notifications.
     */
    @Transactional(readOnly = true)
    fun getOverdueSdaiaNotifications(organizationId: UUID): List<DataBreach> {
        return breachRepository.findOverdueSdaiaNotifications(organizationId, Instant.now())
    }

    /**
     * Start breach investigation.
     */
    fun startInvestigation(breachId: UUID, investigatorId: UUID): DataBreach {
        val breach = getBreach(breachId)
        breach.startInvestigation(investigatorId)
        logger.info("Started investigation for breach {} by {}", breach.breachNumber, investigatorId)
        return breachRepository.save(breach)
    }

    /**
     * Mark breach as contained.
     */
    fun containBreach(breachId: UUID): DataBreach {
        val breach = getBreach(breachId)
        breach.contain()
        logger.info("Breach {} marked as contained", breach.breachNumber)
        return breachRepository.save(breach)
    }

    /**
     * Resolve the breach.
     */
    fun resolveBreach(breachId: UUID, rootCause: String, remediation: String): DataBreach {
        val breach = getBreach(breachId)
        breach.resolve(rootCause, remediation)
        logger.info("Breach {} resolved", breach.breachNumber)
        return breachRepository.save(breach)
    }

    /**
     * Close the breach.
     */
    fun closeBreach(breachId: UUID, lessonsLearned: String?): DataBreach {
        val breach = getBreach(breachId)
        breach.close(lessonsLearned)
        logger.info("Breach {} closed", breach.breachNumber)
        return breachRepository.save(breach)
    }

    /**
     * Record SDAIA notification.
     */
    fun recordSdaiaNotification(breachId: UUID, reference: String): DataBreach {
        val breach = getBreach(breachId)
        breach.recordSdaiaNotification(reference)
        logger.info("SDAIA notification recorded for breach {} - ref: {}", breach.breachNumber, reference)
        return breachRepository.save(breach)
    }

    /**
     * Record notification to affected individuals.
     */
    fun recordIndividualsNotification(breachId: UUID, method: String): DataBreach {
        val breach = getBreach(breachId)
        breach.recordIndividualsNotification(method)
        logger.info("Individuals notification recorded for breach {} via {}", breach.breachNumber, method)
        return breachRepository.save(breach)
    }

    /**
     * Update breach impact assessment.
     */
    fun updateImpactAssessment(breachId: UUID, assessment: String): DataBreach {
        val breach = getBreach(breachId)
        breach.impactAssessment = assessment
        return breachRepository.save(breach)
    }

    /**
     * Update affected counts.
     */
    fun updateAffectedCounts(breachId: UUID, recordsCount: Int, membersCount: Int): DataBreach {
        val breach = getBreach(breachId)
        breach.affectedRecordsCount = recordsCount
        breach.affectedMembersCount = membersCount
        breach.assessNotificationRequirements()
        return breachRepository.save(breach)
    }

    /**
     * Get breach statistics.
     */
    @Transactional(readOnly = true)
    fun getBreachStats(organizationId: UUID): BreachStats {
        return BreachStats(
            totalBreaches = breachRepository.findByOrganizationId(organizationId, Pageable.unpaged()).totalElements,
            activeBreaches = breachRepository.countByOrganizationIdAndStatus(organizationId, BreachStatus.DETECTED) +
                    breachRepository.countByOrganizationIdAndStatus(organizationId, BreachStatus.INVESTIGATING) +
                    breachRepository.countByOrganizationIdAndStatus(organizationId, BreachStatus.CONTAINED),
            resolvedBreaches = breachRepository.countByOrganizationIdAndStatus(organizationId, BreachStatus.RESOLVED) +
                    breachRepository.countByOrganizationIdAndStatus(organizationId, BreachStatus.CLOSED),
            overdueSdaiaNotifications = getOverdueSdaiaNotifications(organizationId).size
        )
    }

    /**
     * Get all breaches pending SDAIA notification.
     * These are breaches that require notification but haven't been notified yet.
     */
    @Transactional(readOnly = true)
    fun getBreachesPendingSdaiaNotification(): List<DataBreach> {
        return breachRepository.findPendingSdaiaNotifications()
    }
}

data class BreachStats(
    val totalBreaches: Long,
    val activeBreaches: Long,
    val resolvedBreaches: Long,
    val overdueSdaiaNotifications: Int
)
