package com.liyaqa.marketing.infrastructure.jobs

import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.marketing.application.commands.EnrollMemberCommand
import com.liyaqa.marketing.application.services.CampaignExecutionService
import com.liyaqa.marketing.application.services.SegmentService
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.TriggerType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.attendance.domain.ports.AttendanceRepository
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Scheduled jobs for marketing automation.
 * Uses ShedLock to ensure jobs run only once across multiple instances.
 */
@Component
class MarketingJobs(
    private val campaignRepository: CampaignRepository,
    private val campaignExecutionService: CampaignExecutionService,
    private val segmentService: SegmentService,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val attendanceRepository: AttendanceRepository,
    private val invoiceRepository: InvoiceRepository
) {
    private val logger = LoggerFactory.getLogger(MarketingJobs::class.java)

    // ==================== PROCESS CAMPAIGN STEPS ====================

    /**
     * Process due campaign steps.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @SchedulerLock(name = "processCampaignSteps", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    @Transactional
    fun processCampaignSteps() {
        logger.debug("Processing due campaign steps...")
        val processed = campaignExecutionService.processDueSteps()
        if (processed > 0) {
            logger.info("Processed $processed campaign steps")
        }
    }

    // ==================== EXPIRY REMINDER TRIGGERS ====================

    /**
     * Trigger 30-day expiry reminder campaigns.
     * Runs daily at 7:00 AM.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @SchedulerLock(name = "triggerExpiryReminder30Days", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerExpiryReminder30Days() {
        logger.info("Triggering 30-day expiry reminder campaigns...")
        enrollMembersForExpiryReminder(30)
    }

    /**
     * Trigger 7-day expiry reminder campaigns.
     * Runs daily at 7:00 AM.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @SchedulerLock(name = "triggerExpiryReminder7Days", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerExpiryReminder7Days() {
        logger.info("Triggering 7-day expiry reminder campaigns...")
        enrollMembersForExpiryReminder(7)
    }

    /**
     * Trigger 1-day expiry reminder campaigns.
     * Runs daily at 7:00 AM.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @SchedulerLock(name = "triggerExpiryReminder1Day", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerExpiryReminder1Day() {
        logger.info("Triggering 1-day expiry reminder campaigns...")
        enrollMembersForExpiryReminder(1)
    }

    private fun enrollMembersForExpiryReminder(daysBeforeExpiry: Int) {
        val campaigns = campaignRepository.findActiveByTriggerTypeAndDays(
            TriggerType.DAYS_BEFORE_EXPIRY,
            daysBeforeExpiry
        )

        if (campaigns.isEmpty()) {
            logger.debug("No active $daysBeforeExpiry-day expiry reminder campaigns")
            return
        }

        val expiringDate = LocalDate.now().plusDays(daysBeforeExpiry.toLong())
        val expiringSubscriptions = subscriptionRepository.findByStatusAndEndDateBetween(
            SubscriptionStatus.ACTIVE,
            expiringDate,
            expiringDate,
            PageRequest.of(0, 1000)
        )

        var totalEnrolled = 0
        for (campaign in campaigns) {
            for (subscription in expiringSubscriptions) {
                val enrolled = campaignExecutionService.enrollMember(
                    EnrollMemberCommand(
                        campaignId = campaign.id,
                        memberId = subscription.memberId,
                        triggerReferenceId = subscription.id,
                        triggerReferenceType = "subscription"
                    )
                )
                if (enrolled != null) totalEnrolled++
            }
        }

        logger.info("Enrolled $totalEnrolled members in $daysBeforeExpiry-day expiry campaigns")
    }

    // ==================== WIN-BACK TRIGGERS ====================

    /**
     * Trigger win-back campaigns for expired members.
     * Runs daily at 10:00 AM.
     */
    @Scheduled(cron = "0 0 10 * * *")
    @SchedulerLock(name = "triggerWinBackCampaigns", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerWinBackCampaigns() {
        logger.info("Triggering win-back campaigns...")

        val winBackDays = listOf(7, 30, 90)

        for (days in winBackDays) {
            val campaigns = campaignRepository.findActiveByTriggerTypeAndDays(
                TriggerType.DAYS_AFTER_EXPIRY,
                days
            )

            if (campaigns.isEmpty()) continue

            val expiredDate = LocalDate.now().minusDays(days.toLong())
            val expiredSubscriptions = subscriptionRepository.findByStatusAndEndDateBetween(
                SubscriptionStatus.EXPIRED,
                expiredDate,
                expiredDate,
                PageRequest.of(0, 1000)
            )

            var enrolled = 0
            for (campaign in campaigns) {
                for (subscription in expiredSubscriptions) {
                    val result = campaignExecutionService.enrollMember(
                        EnrollMemberCommand(
                            campaignId = campaign.id,
                            memberId = subscription.memberId,
                            triggerReferenceId = subscription.id,
                            triggerReferenceType = "subscription"
                        )
                    )
                    if (result != null) enrolled++
                }
            }

            if (enrolled > 0) {
                logger.info("Enrolled $enrolled members in $days-day win-back campaigns")
            }
        }
    }

    // ==================== BIRTHDAY TRIGGERS ====================

    /**
     * Trigger birthday campaigns.
     * Runs daily at 8:00 AM.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @SchedulerLock(name = "triggerBirthdayCampaigns", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerBirthdayCampaigns() {
        logger.info("Triggering birthday campaigns...")

        val campaigns = campaignRepository.findActiveByTriggerType(TriggerType.BIRTHDAY)
        if (campaigns.isEmpty()) {
            logger.debug("No active birthday campaigns")
            return
        }

        val today = LocalDate.now()
        val members = memberRepository.findAll(PageRequest.of(0, 10000))
        val birthdayMembers = members.content.filter { member ->
            member.dateOfBirth?.let {
                it.monthValue == today.monthValue && it.dayOfMonth == today.dayOfMonth
            } ?: false
        }

        var totalEnrolled = 0
        for (campaign in campaigns) {
            for (member in birthdayMembers) {
                val result = campaignExecutionService.enrollMember(
                    EnrollMemberCommand(
                        campaignId = campaign.id,
                        memberId = member.id,
                        triggerReferenceType = "birthday"
                    )
                )
                if (result != null) totalEnrolled++
            }
        }

        logger.info("Enrolled $totalEnrolled members in birthday campaigns")
    }

    // ==================== INACTIVITY TRIGGERS ====================

    /**
     * Trigger inactivity campaigns.
     * Runs daily at 11:00 AM.
     */
    @Scheduled(cron = "0 0 11 * * *")
    @SchedulerLock(name = "triggerInactivityCampaigns", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerInactivityCampaigns() {
        logger.info("Triggering inactivity campaigns...")

        val inactivityDays = listOf(14, 30)

        for (days in inactivityDays) {
            val campaigns = campaignRepository.findActiveByTriggerTypeAndDays(
                TriggerType.DAYS_INACTIVE,
                days
            )

            if (campaigns.isEmpty()) continue

            val cutoffInstant = Instant.now().minus(java.time.Duration.ofDays(days.toLong()))

            // Find members with active subscriptions who haven't checked in
            val activeMembers = memberRepository.search(
                search = null,
                status = MemberStatus.ACTIVE,
                joinedAfter = null,
                joinedBefore = null,
                pageable = PageRequest.of(0, 5000)
            )

            var enrolled = 0
            for (member in activeMembers.content) {
                // Check last attendance - get most recent by sorting by checkInTime desc
                val lastAttendancePage = attendanceRepository.findByMemberId(
                    member.id,
                    PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "checkInTime"))
                )
                val lastAttendance = lastAttendancePage.content.firstOrNull()
                val isInactive = lastAttendance == null ||
                    lastAttendance.checkInTime.isBefore(cutoffInstant)

                if (isInactive) {
                    for (campaign in campaigns) {
                        val result = campaignExecutionService.enrollMember(
                            EnrollMemberCommand(
                                campaignId = campaign.id,
                                memberId = member.id,
                                triggerReferenceType = "inactivity"
                            )
                        )
                        if (result != null) enrolled++
                    }
                }
            }

            if (enrolled > 0) {
                logger.info("Enrolled $enrolled inactive members ($days days) in campaigns")
            }
        }
    }

    // ==================== WELCOME SEQUENCE TRIGGERS ====================

    /**
     * Trigger welcome sequence campaigns for newly created members.
     * Runs daily at 8:30 AM.
     * Finds members who joined today and enrolls them in MEMBER_CREATED campaigns.
     */
    @Scheduled(cron = "0 30 8 * * *")
    @SchedulerLock(name = "triggerWelcomeSequences", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerWelcomeSequences() {
        logger.info("Triggering welcome sequence campaigns...")

        val campaigns = campaignRepository.findActiveByTriggerType(TriggerType.MEMBER_CREATED)
        if (campaigns.isEmpty()) {
            logger.debug("No active welcome sequence campaigns")
            return
        }

        // Find members who joined today
        val today = LocalDate.now()
        val newMembers = memberRepository.search(
            search = null,
            status = MemberStatus.ACTIVE,
            joinedAfter = today,
            joinedBefore = today.plusDays(1),
            pageable = PageRequest.of(0, 1000)
        )

        var totalEnrolled = 0
        for (campaign in campaigns) {
            for (member in newMembers.content) {
                val result = campaignExecutionService.enrollMember(
                    EnrollMemberCommand(
                        campaignId = campaign.id,
                        memberId = member.id,
                        triggerReferenceType = "member_created"
                    )
                )
                if (result != null) totalEnrolled++
            }
        }

        if (totalEnrolled > 0) {
            logger.info("Enrolled $totalEnrolled new members in welcome sequence campaigns")
        }
    }

    // ==================== PAYMENT FAILURE TRIGGERS ====================

    /**
     * Trigger payment failure campaigns for overdue invoices.
     * Runs daily at 9:00 AM (after the overdue invoice marking job).
     * Enrolls members with overdue invoices in PAYMENT_FAILED campaigns.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @SchedulerLock(name = "triggerPaymentFailureCampaigns", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun triggerPaymentFailureCampaigns() {
        logger.info("Triggering payment failure campaigns...")

        val campaigns = campaignRepository.findActiveByTriggerType(TriggerType.PAYMENT_FAILED)
        if (campaigns.isEmpty()) {
            logger.debug("No active payment failure campaigns")
            return
        }

        // Find overdue invoices
        val overdueInvoices = invoiceRepository.findByStatus(
            InvoiceStatus.OVERDUE,
            PageRequest.of(0, 1000)
        )

        var totalEnrolled = 0
        val processedMembers = mutableSetOf<java.util.UUID>()

        for (invoice in overdueInvoices.content) {
            // Only enroll each member once per day (even if they have multiple overdue invoices)
            if (invoice.memberId in processedMembers) continue
            processedMembers.add(invoice.memberId)

            for (campaign in campaigns) {
                val result = campaignExecutionService.enrollMember(
                    EnrollMemberCommand(
                        campaignId = campaign.id,
                        memberId = invoice.memberId,
                        triggerReferenceId = invoice.id,
                        triggerReferenceType = "payment_failed"
                    )
                )
                if (result != null) totalEnrolled++
            }
        }

        if (totalEnrolled > 0) {
            logger.info("Enrolled $totalEnrolled members with overdue invoices in payment failure campaigns")
        }
    }

    // ==================== SEGMENT RECALCULATION ====================

    /**
     * Recalculate segment member counts.
     * Runs hourly.
     */
    @Scheduled(cron = "0 0 * * * *")
    @SchedulerLock(name = "calculateSegmentCounts", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun calculateSegmentCounts() {
        logger.debug("Recalculating segment counts...")
        val updated = segmentService.recalculateAllDynamicSegments()
        if (updated > 0) {
            logger.info("Recalculated $updated segment counts")
        }
    }
}
