package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.DataProcessingActivityRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class DataProtectionService(
    private val activityRepository: DataProcessingActivityRepository
) {
    private val logger = LoggerFactory.getLogger(DataProtectionService::class.java)

    // ===== Data Processing Activities =====

    /**
     * Create a data processing activity (PDPL Article 7).
     */
    fun createActivity(
        organizationId: UUID,
        activityName: String,
        activityNameAr: String? = null,
        description: String? = null,
        descriptionAr: String? = null,
        purpose: String,
        purposeAr: String? = null,
        legalBasis: LegalBasis,
        dataCategories: List<String>,
        dataSubjects: List<String>,
        recipients: List<String>? = null,
        retentionPeriodDays: Int? = null,
        retentionJustification: String? = null,
        crossBorderTransfer: Boolean = false,
        transferCountry: String? = null,
        transferSafeguards: String? = null,
        securityMeasures: String? = null,
        automatedDecisionMaking: Boolean = false,
        profiling: Boolean = false,
        ownerId: UUID? = null
    ): DataProcessingActivity {
        val tenantId = TenantContext.getCurrentTenant().value

        val activity = DataProcessingActivity(
            organizationId = organizationId,
            tenantId = tenantId,
            activityName = activityName,
            activityNameAr = activityNameAr,
            description = description,
            descriptionAr = descriptionAr,
            purpose = purpose,
            purposeAr = purposeAr,
            legalBasis = legalBasis,
            dataCategories = dataCategories,
            dataSubjects = dataSubjects,
            recipients = recipients,
            retentionPeriodDays = retentionPeriodDays,
            retentionJustification = retentionJustification,
            crossBorderTransfer = crossBorderTransfer,
            transferCountry = transferCountry,
            transferSafeguards = transferSafeguards,
            securityMeasures = securityMeasures,
            automatedDecisionMaking = automatedDecisionMaking,
            profiling = profiling,
            ownerId = ownerId
        )

        // Check if privacy impact assessment is required
        activity.privacyImpactRequired = activity.isHighRiskProcessing()

        val saved = activityRepository.save(activity)
        logger.info("Created data processing activity '{}' for organization {}",
            activityName, organizationId)
        return saved
    }

    /**
     * Get an activity by ID.
     */
    @Transactional(readOnly = true)
    fun getActivity(id: UUID): DataProcessingActivity {
        return activityRepository.findById(id)
            .orElseThrow { NoSuchElementException("Data processing activity not found: $id") }
    }

    /**
     * Get activities for an organization.
     */
    @Transactional(readOnly = true)
    fun getActivities(organizationId: UUID, pageable: Pageable): Page<DataProcessingActivity> {
        return activityRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Get activities by legal basis.
     */
    @Transactional(readOnly = true)
    fun getActivitiesByLegalBasis(organizationId: UUID, legalBasis: LegalBasis): List<DataProcessingActivity> {
        return activityRepository.findByOrganizationIdAndLegalBasis(organizationId, legalBasis)
    }

    /**
     * Get activities with cross-border transfers.
     */
    @Transactional(readOnly = true)
    fun getCrossBorderActivities(organizationId: UUID): List<DataProcessingActivity> {
        return activityRepository.findCrossBorderActivities(organizationId)
    }

    /**
     * Get activities due for review.
     */
    @Transactional(readOnly = true)
    fun getActivitiesDueForReview(organizationId: UUID): List<DataProcessingActivity> {
        return activityRepository.findActivitiesDueForReview(organizationId, LocalDate.now())
    }

    /**
     * Update an activity.
     */
    fun updateActivity(
        activityId: UUID,
        activityName: String? = null,
        activityNameAr: String? = null,
        description: String? = null,
        purpose: String? = null,
        legalBasis: LegalBasis? = null,
        dataCategories: List<String>? = null,
        dataSubjects: List<String>? = null,
        recipients: List<String>? = null,
        retentionPeriodDays: Int? = null,
        securityMeasures: String? = null
    ): DataProcessingActivity {
        val activity = getActivity(activityId)

        activityName?.let { activity.activityName = it }
        activityNameAr?.let { activity.activityNameAr = it }
        description?.let { activity.description = it }
        purpose?.let { activity.purpose = it }
        legalBasis?.let { activity.legalBasis = it }
        dataCategories?.let { activity.dataCategories = it }
        dataSubjects?.let { activity.dataSubjects = it }
        recipients?.let { activity.recipients = it }
        retentionPeriodDays?.let { activity.retentionPeriodDays = it }
        securityMeasures?.let { activity.securityMeasures = it }

        // Re-assess if privacy impact is required
        activity.privacyImpactRequired = activity.isHighRiskProcessing()

        return activityRepository.save(activity)
    }

    /**
     * Activate an activity.
     */
    fun activateActivity(activityId: UUID): DataProcessingActivity {
        val activity = getActivity(activityId)
        activity.activate()
        return activityRepository.save(activity)
    }

    /**
     * Mark activity for review.
     */
    fun markForReview(activityId: UUID): DataProcessingActivity {
        val activity = getActivity(activityId)
        activity.markForReview()
        return activityRepository.save(activity)
    }

    /**
     * Complete activity review.
     */
    fun completeReview(activityId: UUID, nextReviewDate: LocalDate): DataProcessingActivity {
        val activity = getActivity(activityId)
        activity.completeReview(nextReviewDate)
        return activityRepository.save(activity)
    }

    /**
     * Archive an activity.
     */
    fun archiveActivity(activityId: UUID): DataProcessingActivity {
        val activity = getActivity(activityId)
        activity.archive()
        return activityRepository.save(activity)
    }

    /**
     * Mark privacy impact assessment as completed.
     */
    fun markPrivacyImpactCompleted(activityId: UUID): DataProcessingActivity {
        val activity = getActivity(activityId)
        require(activity.privacyImpactRequired) { "Privacy impact assessment not required for this activity" }
        activity.privacyImpactCompleted = true
        return activityRepository.save(activity)
    }

    /**
     * Get data processing statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(organizationId: UUID): DataProtectionStats {
        val activities = activityRepository.findByOrganizationId(organizationId, Pageable.unpaged())
        val activeActivities = activities.content.filter { it.status == ProcessingActivityStatus.ACTIVE }

        return DataProtectionStats(
            totalActivities = activities.totalElements.toInt(),
            activeActivities = activeActivities.size,
            crossBorderActivities = activeActivities.count { it.crossBorderTransfer },
            activitiesRequiringPia = activeActivities.count { it.privacyImpactRequired },
            activitiesWithPiaCompleted = activeActivities.count { it.privacyImpactCompleted },
            activitiesWithAutomatedDecisions = activeActivities.count { it.automatedDecisionMaking },
            activitiesWithProfiling = activeActivities.count { it.profiling },
            activitiesPerLegalBasis = activeActivities.groupingBy { it.legalBasis }.eachCount(),
            activitiesDueForReview = getActivitiesDueForReview(organizationId).size
        )
    }
}

data class DataProtectionStats(
    val totalActivities: Int,
    val activeActivities: Int,
    val crossBorderActivities: Int,
    val activitiesRequiringPia: Int,
    val activitiesWithPiaCompleted: Int,
    val activitiesWithAutomatedDecisions: Int,
    val activitiesWithProfiling: Int,
    val activitiesPerLegalBasis: Map<LegalBasis, Int>,
    val activitiesDueForReview: Int
)
