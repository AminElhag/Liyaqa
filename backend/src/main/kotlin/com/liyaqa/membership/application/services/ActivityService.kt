package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.ActivityType
import com.liyaqa.membership.domain.model.MemberActivity
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberActivityRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

@Service
@Transactional
class ActivityService(
    private val activityRepository: MemberActivityRepository
) {
    private val logger = LoggerFactory.getLogger(ActivityService::class.java)

    /**
     * Logs an activity for a member.
     */
    fun logActivity(activity: MemberActivity): MemberActivity {
        val saved = activityRepository.save(activity)
        logger.debug("Logged activity {} for member {}", activity.activityType, activity.memberId)
        return saved
    }

    /**
     * Logs an activity asynchronously to avoid blocking the main transaction.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun logActivityAsync(activity: MemberActivity) {
        try {
            activityRepository.save(activity)
            logger.debug("Async logged activity {} for member {}", activity.activityType, activity.memberId)
        } catch (e: Exception) {
            logger.error("Failed to log activity for member ${activity.memberId}: ${e.message}", e)
        }
    }

    /**
     * Logs a status change activity.
     */
    fun logStatusChange(
        memberId: UUID,
        oldStatus: MemberStatus,
        newStatus: MemberStatus,
        reason: String? = null,
        performedByUserId: UUID? = null,
        performedByName: String? = null
    ) {
        val activity = MemberActivity.statusChanged(
            memberId = memberId,
            oldStatus = oldStatus,
            newStatus = newStatus,
            reason = reason,
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Logs a subscription created activity.
     */
    fun logSubscriptionCreated(
        memberId: UUID,
        planName: String,
        startDate: LocalDate,
        endDate: LocalDate,
        performedByUserId: UUID? = null,
        performedByName: String? = null
    ) {
        val activity = MemberActivity.subscriptionCreated(
            memberId = memberId,
            planName = planName,
            startDate = startDate.toString(),
            endDate = endDate.toString(),
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Logs a payment received activity.
     */
    fun logPaymentReceived(
        memberId: UUID,
        amount: String,
        paymentMethod: String,
        reference: String? = null,
        performedByUserId: UUID? = null,
        performedByName: String? = null
    ) {
        val activity = MemberActivity.paymentReceived(
            memberId = memberId,
            amount = amount,
            paymentMethod = paymentMethod,
            reference = reference,
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Logs a check-in activity.
     */
    fun logCheckIn(memberId: UUID, method: String, location: String? = null) {
        val activity = MemberActivity.checkIn(
            memberId = memberId,
            method = method,
            location = location
        )
        logActivity(activity)
    }

    /**
     * Logs a note added activity.
     */
    fun logNoteAdded(
        memberId: UUID,
        notePreview: String,
        performedByUserId: UUID,
        performedByName: String
    ) {
        val activity = MemberActivity.noteAdded(
            memberId = memberId,
            notePreview = notePreview,
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Logs a profile updated activity.
     */
    fun logProfileUpdated(
        memberId: UUID,
        fieldsChanged: List<String>,
        performedByUserId: UUID? = null,
        performedByName: String? = null
    ) {
        val activity = MemberActivity.profileUpdated(
            memberId = memberId,
            fieldsChanged = fieldsChanged,
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Logs a communication sent activity.
     */
    fun logCommunicationSent(
        memberId: UUID,
        channel: String,
        subject: String,
        performedByUserId: UUID? = null,
        performedByName: String? = null
    ) {
        val activity = MemberActivity.communicationSent(
            memberId = memberId,
            channel = channel,
            subject = subject,
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Logs a generic activity.
     */
    fun logGenericActivity(
        memberId: UUID,
        activityType: ActivityType,
        title: String,
        description: String? = null,
        metadata: Map<String, Any>? = null,
        performedByUserId: UUID? = null,
        performedByName: String? = null
    ) {
        val activity = MemberActivity(
            memberId = memberId,
            activityType = activityType,
            title = title,
            description = description,
            metadata = metadata,
            performedByUserId = performedByUserId,
            performedByName = performedByName
        )
        logActivity(activity)
    }

    /**
     * Gets the activity timeline for a member.
     */
    @Transactional(readOnly = true)
    fun getActivityTimeline(
        memberId: UUID,
        types: List<ActivityType>? = null,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null,
        pageable: Pageable
    ): Page<MemberActivity> {
        val startTime = startDate?.atStartOfDay()?.toInstant(ZoneOffset.UTC)
        val endTime = endDate?.plusDays(1)?.atStartOfDay()?.toInstant(ZoneOffset.UTC)

        return when {
            types != null && startTime != null && endTime != null ->
                activityRepository.findByMemberIdAndTypesAndDateRange(memberId, types, startTime, endTime, pageable)
            types != null ->
                activityRepository.findByMemberIdAndTypes(memberId, types, pageable)
            startTime != null && endTime != null ->
                activityRepository.findByMemberIdAndDateRange(memberId, startTime, endTime, pageable)
            else ->
                activityRepository.findByMemberId(memberId, pageable)
        }
    }

    /**
     * Gets recent activities for a member.
     */
    @Transactional(readOnly = true)
    fun getRecentActivities(memberId: UUID, limit: Int = 10): List<MemberActivity> {
        return activityRepository.findRecentByMemberId(memberId, limit)
    }

    /**
     * Gets the latest activity of a specific type for a member.
     */
    @Transactional(readOnly = true)
    fun getLatestActivityByType(memberId: UUID, type: ActivityType): MemberActivity? {
        return activityRepository.findLatestByMemberIdAndType(memberId, type).orElse(null)
    }

    /**
     * Gets activities performed by a specific user (staff audit).
     */
    @Transactional(readOnly = true)
    fun getActivitiesByPerformer(userId: UUID, pageable: Pageable): Page<MemberActivity> {
        return activityRepository.findByPerformedByUserId(userId, pageable)
    }

    /**
     * Counts total activities for a member.
     */
    @Transactional(readOnly = true)
    fun countActivities(memberId: UUID): Long {
        return activityRepository.countByMemberId(memberId)
    }

    /**
     * Counts activities of a specific type for a member.
     */
    @Transactional(readOnly = true)
    fun countActivitiesByType(memberId: UUID, type: ActivityType): Long {
        return activityRepository.countByMemberIdAndType(memberId, type)
    }
}
