package com.liyaqa.compliance.infrastructure.jobs

import com.liyaqa.compliance.application.services.*
import com.liyaqa.compliance.domain.model.ReportFormat
import com.liyaqa.compliance.domain.ports.ComplianceFrameworkRepository
import com.liyaqa.compliance.domain.ports.OrganizationComplianceStatusRepository
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

/**
 * Scheduled jobs for compliance management.
 * Uses ShedLock to ensure jobs run only once across multiple instances.
 */
@Component
class ComplianceJobs(
    private val dataRetentionService: DataRetentionService,
    private val complianceService: ComplianceService,
    private val dsrService: DataSubjectRequestService,
    private val breachService: DataBreachService,
    private val policyService: SecurityPolicyService,
    private val frameworkRepository: ComplianceFrameworkRepository,
    private val statusRepository: OrganizationComplianceStatusRepository
) {
    private val logger = LoggerFactory.getLogger(ComplianceJobs::class.java)

    /**
     * Processes data retention rules and deletes/anonymizes expired data.
     * Runs daily at 3:00 AM.
     *
     * This job is critical for PDPL compliance - it ensures data is not retained
     * longer than the defined retention period.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @SchedulerLock(name = "processDataRetention", lockAtLeastFor = "10m", lockAtMostFor = "2h")
    @Transactional
    fun processDataRetention() {
        logger.info("Running data retention processing job...")

        try {
            val result = dataRetentionService.processRetentionRules()

            logger.info(
                "Data retention job completed. Processed ${result.processedRules} rules, " +
                "deleted ${result.deletedRecords} records, anonymized ${result.anonymizedRecords} records."
            )
        } catch (e: Exception) {
            logger.error("Data retention job failed: ${e.message}", e)
        }
    }

    /**
     * Generates monthly compliance status reports for all organizations.
     * Runs on the 1st of each month at 6:00 AM.
     */
    @Scheduled(cron = "0 0 6 1 * *")
    @SchedulerLock(name = "generateMonthlyComplianceReports", lockAtLeastFor = "30m", lockAtMostFor = "4h")
    @Transactional
    fun generateMonthlyComplianceReports() {
        logger.info("Running monthly compliance report generation job...")

        try {
            // Get all organization compliance statuses
            val allStatuses = statusRepository.findAll()
            val organizationFrameworks = allStatuses.groupBy { it.organizationId }

            var reportsGenerated = 0

            for ((organizationId, statuses) in organizationFrameworks) {
                for (status in statuses) {
                    try {
                        val framework = status.framework

                        val report = complianceService.generateReport(
                            organizationId = organizationId,
                            frameworkId = framework.id,
                            reportType = "MONTHLY_STATUS",
                            title = "${framework.code} Compliance Report - ${LocalDate.now().month}",
                            reportingPeriodStart = LocalDate.now().minusMonths(1).withDayOfMonth(1),
                            reportingPeriodEnd = LocalDate.now().minusDays(1),
                            format = ReportFormat.PDF,
                            generatedBy = null // System generated
                        )

                        reportsGenerated++
                        logger.debug("Generated report ${report.id} for org $organizationId, framework ${framework.code}")
                    } catch (e: Exception) {
                        logger.warn("Failed to generate report for org $organizationId, framework ${status.framework.id}: ${e.message}")
                    }
                }
            }

            logger.info("Monthly compliance report generation completed. Generated $reportsGenerated reports.")
        } catch (e: Exception) {
            logger.error("Monthly compliance report generation failed: ${e.message}", e)
        }
    }

    /**
     * Checks for overdue DSRs (Data Subject Requests) and logs warnings.
     * Runs daily at 8:00 AM.
     *
     * Per PDPL Article 26, DSRs must be responded to within 30 days.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @SchedulerLock(name = "checkOverdueDSRs", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    fun checkOverdueDSRs() {
        logger.info("Running DSR deadline check job...")

        try {
            val overdueRequests = dsrService.getOverdueRequests()

            if (overdueRequests.isNotEmpty()) {
                logger.warn(
                    "PDPL COMPLIANCE WARNING: ${overdueRequests.size} DSRs are overdue! " +
                    "Overdue request numbers: ${overdueRequests.map { it.requestNumber }.joinToString(", ")}"
                )

                // TODO: Send alert notifications to compliance team
            } else {
                logger.info("DSR deadline check completed. No overdue requests found.")
            }
        } catch (e: Exception) {
            logger.error("DSR deadline check failed: ${e.message}", e)
        }
    }

    /**
     * Checks for pending SDAIA notifications for data breaches.
     * Runs every 4 hours.
     *
     * Per PDPL Article 29, breaches must be reported to SDAIA within 72 hours.
     */
    @Scheduled(cron = "0 0 */4 * * *")
    @SchedulerLock(name = "checkBreachNotifications", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    fun checkBreachNotifications() {
        logger.info("Running breach notification check job...")

        try {
            val pendingBreaches = breachService.getBreachesPendingSdaiaNotification()

            if (pendingBreaches.isNotEmpty()) {
                for (breach in pendingBreaches) {
                    val deadline = breach.sdaiaNotificationDeadline
                    if (deadline != null && breach.isSdaiaNotificationOverdue()) {
                        logger.error(
                            "PDPL COMPLIANCE VIOLATION: Breach ${breach.breachNumber} has exceeded " +
                            "the 72-hour SDAIA notification deadline! Discovered: ${breach.discoveredAt}, " +
                            "Deadline: $deadline"
                        )
                    } else {
                        logger.warn(
                            "PDPL COMPLIANCE ALERT: Breach ${breach.breachNumber} requires SDAIA notification. " +
                            "Deadline: $deadline"
                        )
                    }
                }

                // TODO: Send urgent alert notifications to compliance team
            } else {
                logger.info("Breach notification check completed. No pending notifications.")
            }
        } catch (e: Exception) {
            logger.error("Breach notification check failed: ${e.message}", e)
        }
    }

    /**
     * Checks for policies due for review.
     * Runs weekly on Monday at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * MON")
    @SchedulerLock(name = "checkPolicyReviews", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    fun checkPolicyReviews() {
        logger.info("Running policy review check job...")

        try {
            // Get all organizations' policies due for review
            val allOrganizations = statusRepository.findAll()
                .map { it.organizationId }
                .distinct()

            var totalPoliciesDue = 0

            for (organizationId in allOrganizations) {
                val policiesDue = policyService.getPoliciesDueForReview(organizationId)
                totalPoliciesDue += policiesDue.size

                if (policiesDue.isNotEmpty()) {
                    logger.warn(
                        "Organization $organizationId has ${policiesDue.size} policies due for review: " +
                        policiesDue.map { it.title }.joinToString(", ")
                    )
                }
            }

            logger.info("Policy review check completed. $totalPoliciesDue policies due for review.")
        } catch (e: Exception) {
            logger.error("Policy review check failed: ${e.message}", e)
        }
    }

    /**
     * Updates compliance scores for all organizations.
     * Runs daily at 4:00 AM.
     */
    @Scheduled(cron = "0 0 4 * * *")
    @SchedulerLock(name = "updateComplianceScores", lockAtLeastFor = "10m", lockAtMostFor = "1h")
    @Transactional
    fun updateComplianceScores() {
        logger.info("Running compliance score update job...")

        try {
            val allStatuses = statusRepository.findAll()
            var updatedCount = 0

            for (status in allStatuses) {
                try {
                    complianceService.recalculateComplianceScore(status.organizationId, status.framework.id)
                    updatedCount++
                } catch (e: Exception) {
                    logger.warn(
                        "Failed to update score for org ${status.organizationId}, " +
                        "framework ${status.framework.id}: ${e.message}"
                    )
                }
            }

            logger.info("Compliance score update completed. Updated $updatedCount organization-framework pairs.")
        } catch (e: Exception) {
            logger.error("Compliance score update failed: ${e.message}", e)
        }
    }

    /**
     * Checks for expiring compliance evidence.
     * Runs daily at 7:00 AM.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @SchedulerLock(name = "checkExpiringEvidence", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    fun checkExpiringEvidence() {
        logger.info("Running evidence expiration check job...")

        try {
            // Check for evidence expiring in the next 30 days
            val expiringEvidence = complianceService.getExpiringEvidence(days = 30)

            if (expiringEvidence.isNotEmpty()) {
                logger.warn(
                    "${expiringEvidence.size} compliance evidence items expiring within 30 days: " +
                    expiringEvidence.map { "${it.title} (expires ${it.validUntil})" }.joinToString("; ")
                )

                // TODO: Send notification to compliance team
            }

            // Check for already expired evidence
            val expiredEvidence = complianceService.getExpiredEvidence()

            if (expiredEvidence.isNotEmpty()) {
                logger.warn(
                    "COMPLIANCE ALERT: ${expiredEvidence.size} compliance evidence items have expired: " +
                    expiredEvidence.map { it.title }.joinToString(", ")
                )
            }

            logger.info("Evidence expiration check completed.")
        } catch (e: Exception) {
            logger.error("Evidence expiration check failed: ${e.message}", e)
        }
    }
}

/**
 * Result of data retention processing.
 */
data class RetentionProcessingResult(
    val processedRules: Int,
    val deletedRecords: Long,
    val anonymizedRecords: Long
)
