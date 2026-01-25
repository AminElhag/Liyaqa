package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.application.commands.EnrollMemberCommand
import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignEnrollment
import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.model.EnrollmentStatus
import com.liyaqa.marketing.domain.model.MarketingChannel
import com.liyaqa.marketing.domain.model.MessageLog
import com.liyaqa.marketing.domain.model.TrackingPixel
import com.liyaqa.marketing.domain.model.TrackingType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import com.liyaqa.marketing.domain.ports.EnrollmentRepository
import com.liyaqa.marketing.domain.ports.MessageLogRepository
import com.liyaqa.marketing.domain.ports.TrackingPixelRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID
import kotlin.random.Random

@Service
@Transactional
class CampaignExecutionService(
    private val campaignRepository: CampaignRepository,
    private val stepRepository: CampaignStepRepository,
    private val enrollmentRepository: EnrollmentRepository,
    private val messageLogRepository: MessageLogRepository,
    private val trackingPixelRepository: TrackingPixelRepository,
    private val memberRepository: MemberRepository,
    private val notificationService: NotificationService
) {
    private val logger = LoggerFactory.getLogger(CampaignExecutionService::class.java)

    // ==================== ENROLLMENT ====================

    /**
     * Enroll a member in a campaign.
     */
    fun enrollMember(command: EnrollMemberCommand): CampaignEnrollment? {
        val campaign = campaignRepository.findById(command.campaignId)
            .orElseThrow { NoSuchElementException("Campaign not found: ${command.campaignId}") }

        if (!campaign.canEnroll()) {
            logger.debug("Campaign ${campaign.id} not accepting enrollments")
            return null
        }

        // Check if already enrolled
        if (enrollmentRepository.existsByMemberIdAndCampaignIdAndStatus(
                command.memberId, command.campaignId, EnrollmentStatus.ACTIVE
            )) {
            logger.debug("Member ${command.memberId} already enrolled in campaign ${command.campaignId}")
            return null
        }

        val enrollment = CampaignEnrollment.create(
            campaignId = command.campaignId,
            memberId = command.memberId,
            triggerReferenceId = command.triggerReferenceId,
            triggerReferenceType = command.triggerReferenceType
        )

        // Assign A/B group if campaign has A/B tests
        val steps = stepRepository.findActiveByCampaignId(command.campaignId)
        if (steps.any { it.isAbTest }) {
            enrollment.assignAbGroup(if (Random.nextBoolean()) 'A' else 'B')
        }

        // Calculate first step execution time
        val firstStep = steps.minByOrNull { it.stepNumber }
        if (firstStep != null) {
            val delayHours = firstStep.getTotalDelayHours()
            val nextDueAt = Instant.now().plusSeconds(delayHours * 3600L)
            enrollment.advanceToStep(0, nextDueAt) // Step 0 means ready for step 1
        }

        val saved = enrollmentRepository.save(enrollment)
        campaign.incrementEnrolled()
        campaignRepository.save(campaign)

        logger.info("Enrolled member ${command.memberId} in campaign ${command.campaignId}")
        return saved
    }

    /**
     * Cancel an enrollment.
     */
    fun cancelEnrollment(enrollmentId: UUID) {
        val enrollment = enrollmentRepository.findById(enrollmentId)
            .orElseThrow { NoSuchElementException("Enrollment not found: $enrollmentId") }

        enrollment.cancel()
        enrollmentRepository.save(enrollment)
        logger.info("Cancelled enrollment $enrollmentId")
    }

    /**
     * Get enrollments for a campaign.
     */
    @Transactional(readOnly = true)
    fun getEnrollments(campaignId: UUID, pageable: Pageable): Page<CampaignEnrollment> {
        return enrollmentRepository.findByCampaignId(campaignId, pageable)
    }

    /**
     * Get enrollment by ID.
     */
    @Transactional(readOnly = true)
    fun getEnrollment(enrollmentId: UUID): CampaignEnrollment {
        return enrollmentRepository.findById(enrollmentId)
            .orElseThrow { NoSuchElementException("Enrollment not found: $enrollmentId") }
    }

    // ==================== STEP EXECUTION ====================

    /**
     * Process due campaign steps.
     * Called by scheduled job every 5 minutes.
     */
    fun processDueSteps(batchSize: Int = 100): Int {
        val now = Instant.now()
        val dueEnrollments = enrollmentRepository.findActiveWithNextStepDueBefore(
            now,
            PageRequest.of(0, batchSize)
        )

        var processedCount = 0
        for (enrollment in dueEnrollments) {
            try {
                processEnrollmentStep(enrollment)
                processedCount++
            } catch (e: Exception) {
                logger.error("Error processing enrollment ${enrollment.id}: ${e.message}", e)
            }
        }

        if (processedCount > 0) {
            logger.info("Processed $processedCount campaign steps")
        }
        return processedCount
    }

    /**
     * Process the next step for an enrollment.
     */
    private fun processEnrollmentStep(enrollment: CampaignEnrollment) {
        val campaign = campaignRepository.findById(enrollment.campaignId).orElse(null)
        if (campaign == null || !campaign.isRunning()) {
            enrollment.cancel()
            enrollmentRepository.save(enrollment)
            return
        }

        val member = memberRepository.findById(enrollment.memberId).orElse(null)
        if (member == null) {
            enrollment.cancel()
            enrollmentRepository.save(enrollment)
            return
        }

        val steps = stepRepository.findActiveByCampaignId(enrollment.campaignId)
        val nextStepNumber = enrollment.currentStep + 1
        val nextStep = steps.find { it.stepNumber == nextStepNumber }

        if (nextStep == null) {
            // No more steps - complete the enrollment
            enrollment.complete()
            campaign.incrementCompleted()
            campaignRepository.save(campaign)
            enrollmentRepository.save(enrollment)
            logger.info("Completed enrollment ${enrollment.id}")
            return
        }

        // Handle A/B test variant selection
        val stepToExecute = if (nextStep.isAbTest && enrollment.abGroup != null) {
            val variants = stepRepository.findAbVariants(enrollment.campaignId, nextStepNumber)
            variants.find { it.abVariant == enrollment.abGroup } ?: nextStep
        } else {
            nextStep
        }

        // Execute the step
        executeStep(enrollment, stepToExecute, member, campaign)

        // Schedule next step or complete
        val furtherSteps = steps.filter { it.stepNumber > nextStepNumber }
        if (furtherSteps.isEmpty()) {
            enrollment.complete()
            campaign.incrementCompleted()
            campaignRepository.save(campaign)
        } else {
            val nextNextStep = furtherSteps.minByOrNull { it.stepNumber }!!
            val delayHours = nextNextStep.getTotalDelayHours()
            val nextDueAt = Instant.now().plusSeconds(delayHours * 3600L)
            enrollment.advanceToStep(nextStepNumber, nextDueAt)
        }

        enrollmentRepository.save(enrollment)
    }

    /**
     * Execute a campaign step (send message).
     */
    private fun executeStep(
        enrollment: CampaignEnrollment,
        step: CampaignStep,
        member: Member,
        campaign: Campaign
    ) {
        // Create message log
        val messageLog = MessageLog.create(
            campaignId = campaign.id,
            stepId = step.id,
            enrollmentId = enrollment.id,
            memberId = member.id,
            channel = step.channel
        )
        val savedLog = messageLogRepository.save(messageLog)

        // Create tracking pixels
        val trackingPixels = mutableListOf<TrackingPixel>()
        if (step.channel == MarketingChannel.EMAIL) {
            trackingPixels.add(TrackingPixel.createOpenPixel(savedLog.id))
            // Click pixels would be created for each link in the email body
        }
        if (trackingPixels.isNotEmpty()) {
            trackingPixelRepository.saveAll(trackingPixels)
        }

        // Send the message using NotificationService
        try {
            val subject = LocalizedText(
                en = step.subjectEn ?: campaign.name,
                ar = step.subjectAr ?: campaign.name
            )
            val body = LocalizedText(
                en = personalizeMessage(step.bodyEn, member),
                ar = personalizeMessage(step.bodyAr, member)
            )

            when (step.channel) {
                MarketingChannel.EMAIL -> {
                    if (member.email != null) {
                        val notification = notificationService.sendEmail(
                            memberId = member.id,
                            email = member.email!!,
                            type = NotificationType.CUSTOM,
                            subject = subject,
                            body = body,
                            priority = NotificationPriority.NORMAL,
                            referenceId = campaign.id,
                            referenceType = "marketing_campaign"
                        )
                        savedLog.markSent(notificationId = notification.id)
                    } else {
                        savedLog.markFailed("No email address")
                    }
                }
                MarketingChannel.SMS -> {
                    if (member.phone != null) {
                        val notification = notificationService.sendSms(
                            memberId = member.id,
                            phone = member.phone!!,
                            type = NotificationType.CUSTOM,
                            body = body,
                            priority = NotificationPriority.NORMAL,
                            referenceId = campaign.id,
                            referenceType = "marketing_campaign"
                        )
                        savedLog.markSent(notificationId = notification.id)
                    } else {
                        savedLog.markFailed("No phone number")
                    }
                }
                MarketingChannel.WHATSAPP -> {
                    // WhatsApp requires templates - mark for later processing
                    savedLog.markSent()
                }
                MarketingChannel.PUSH -> {
                    // Push notifications - future implementation
                    savedLog.markSent()
                }
            }
        } catch (e: Exception) {
            savedLog.markFailed(e.message ?: "Unknown error")
            logger.error("Error sending campaign message: ${e.message}", e)
        }

        messageLogRepository.save(savedLog)
        logger.debug("Executed step ${step.stepNumber} for enrollment ${enrollment.id}")
    }

    /**
     * Personalize a message with member data.
     */
    private fun personalizeMessage(template: String, member: Member): String {
        return template
            .replace("{{firstName}}", member.firstName.en)
            .replace("{{lastName}}", member.lastName.en)
            .replace("{{fullName}}", member.fullName.en)
            .replace("{{email}}", member.email)
            .replace("{{phone}}", member.phone ?: "")
    }

    // ==================== BULK ENROLLMENT ====================

    /**
     * Enroll multiple members in a campaign.
     */
    fun enrollMembers(campaignId: UUID, memberIds: List<UUID>): Int {
        var enrolled = 0
        for (memberId in memberIds) {
            val result = enrollMember(
                EnrollMemberCommand(
                    campaignId = campaignId,
                    memberId = memberId
                )
            )
            if (result != null) enrolled++
        }
        logger.info("Enrolled $enrolled members in campaign $campaignId")
        return enrolled
    }

    /**
     * Enroll members from a segment.
     */
    fun enrollSegment(campaignId: UUID, segmentMemberIds: List<UUID>): Int {
        return enrollMembers(campaignId, segmentMemberIds)
    }
}
