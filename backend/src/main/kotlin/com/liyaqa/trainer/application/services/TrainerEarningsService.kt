package com.liyaqa.trainer.application.services

import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.application.commands.*
import com.liyaqa.trainer.domain.model.CompensationModel
import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.EarningType
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.model.TrainerEarnings
import com.liyaqa.trainer.domain.ports.PersonalTrainingSessionRepository
import com.liyaqa.trainer.domain.ports.TrainerEarningsRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Service for managing trainer earnings.
 *
 * Handles:
 * - Auto-creation of earnings on session completion
 * - Approval workflow (PENDING → APPROVED → PAID)
 * - Payment tracking with reference numbers
 * - Dispute management
 * - Compensation calculations (hourly, per-session, revenue share, salary+commission)
 *
 * Integration points:
 * - Called by PersonalTrainingService.completeSession() for PT earnings
 * - Called by ClassService.completeSession() for class earnings
 * - Calls TrainerNotificationService for approval/payment notifications
 *
 * Risk mitigation:
 * - Checks existsBySessionId to prevent duplicate earnings
 */
@Service
@Transactional
class TrainerEarningsService(
    private val earningsRepository: TrainerEarningsRepository,
    private val trainerRepository: TrainerRepository,
    private val ptSessionRepository: PersonalTrainingSessionRepository,
    private val notificationService: TrainerNotificationService
) {
    private val logger = LoggerFactory.getLogger(TrainerEarningsService::class.java)

    // ==================== AUTO-CREATION ====================

    /**
     * Auto-create earning for a completed PT session.
     * Called by PersonalTrainingService.completeSession().
     *
     * @param sessionId The completed PT session ID
     * @return Created TrainerEarnings entity
     * @throws IllegalStateException if earnings already exist for this session
     */
    fun autoCreateEarningForPTSession(sessionId: UUID): TrainerEarnings {
        // Check for duplicates (critical!)
        if (earningsRepository.findBySessionId(sessionId).isPresent) {
            logger.warn("Earnings already exist for session $sessionId, skipping creation")
            throw IllegalStateException("Earnings already exist for session: $sessionId")
        }

        val session = ptSessionRepository.findById(sessionId)
            .orElseThrow { NoSuchElementException("PT session not found: $sessionId") }

        require(session.status.name == "COMPLETED") {
            "Can only create earnings for completed sessions"
        }

        val trainer = trainerRepository.findById(session.trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: ${session.trainerId}") }

        val amount = calculatePTSessionEarning(session, trainer.compensationModel, trainer.hourlyRate, trainer.ptSessionRate)

        val earning = TrainerEarnings(
            trainerId = session.trainerId,
            earningType = EarningType.PT_SESSION,
            sessionId = sessionId,
            earningDate = session.sessionDate,
            amount = amount,
            deductions = null, // Can be set later by admin
            netAmount = amount, // Same as amount initially
            status = EarningStatus.PENDING
        )

        val saved = earningsRepository.save(earning)
        logger.info("Auto-created PT session earning: ${saved.id} for session $sessionId, amount: $amount")
        return saved
    }

    /**
     * Auto-create earning for a completed group class session.
     * Called by ClassService.completeSession().
     *
     * @param sessionId The completed class session ID
     * @param trainerId The trainer ID
     * @param sessionDate The session date
     * @param durationMinutes The session duration
     * @param attendeeCount Number of attendees
     * @param pricePerAttendee Price charged per attendee
     * @return Created TrainerEarnings entity
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    fun autoCreateEarningForClassSession(
        sessionId: UUID,
        trainerId: UUID,
        sessionDate: LocalDate,
        durationMinutes: Int,
        attendeeCount: Int,
        pricePerAttendee: Money?
    ): TrainerEarnings {
        // Check for duplicates (critical!)
        if (earningsRepository.findBySessionId(sessionId).isPresent) {
            logger.warn("Earnings already exist for class session $sessionId, skipping creation")
            throw IllegalStateException("Earnings already exist for session: $sessionId")
        }

        val trainer = trainerRepository.findById(trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: $trainerId") }

        val amount = calculateClassSessionEarning(
            compensationModel = trainer.compensationModel,
            hourlyRate = trainer.hourlyRate,
            durationMinutes = durationMinutes,
            attendeeCount = attendeeCount,
            pricePerAttendee = pricePerAttendee
        )

        val earning = TrainerEarnings(
            trainerId = trainerId,
            earningType = EarningType.GROUP_CLASS,
            sessionId = sessionId,
            earningDate = sessionDate,
            amount = amount,
            deductions = null,
            netAmount = amount,
            status = EarningStatus.PENDING
        )

        val saved = earningsRepository.save(earning)
        logger.info("Auto-created class earning: ${saved.id} for session $sessionId, amount: $amount")
        return saved
    }

    // ==================== COMPENSATION CALCULATIONS ====================

    /**
     * Calculate earning for a PT session based on compensation model.
     */
    private fun calculatePTSessionEarning(
        session: PersonalTrainingSession,
        compensationModel: CompensationModel?,
        hourlyRate: BigDecimal?,
        ptSessionRate: BigDecimal?
    ): Money {
        val model = compensationModel ?: CompensationModel.PER_SESSION
        val currency = "SAR" // Default currency

        val amount = when (model) {
            CompensationModel.HOURLY -> {
                val rate = hourlyRate ?: throw IllegalStateException("Hourly rate not set for trainer")
                val hours = session.durationMinutes.toBigDecimal().divide(BigDecimal(60), 2, java.math.RoundingMode.HALF_UP)
                rate.multiply(hours)
            }
            CompensationModel.PER_SESSION -> {
                ptSessionRate ?: session.price ?: throw IllegalStateException("PT session rate not set")
            }
            CompensationModel.REVENUE_SHARE -> {
                // Default 70% revenue share for PT sessions
                val sessionPrice = session.price ?: throw IllegalStateException("Session price not set")
                sessionPrice.multiply(BigDecimal("0.70"))
            }
            CompensationModel.SALARY_PLUS_COMMISSION -> {
                // Commission-only for PT (base salary is separate)
                val commissionRate = BigDecimal("0.30") // 30% commission
                val sessionPrice = session.price ?: throw IllegalStateException("Session price not set")
                sessionPrice.multiply(commissionRate)
            }
        }

        return Money(amount.setScale(2, java.math.RoundingMode.HALF_UP), currency)
    }

    /**
     * Calculate earning for a group class based on compensation model.
     */
    private fun calculateClassSessionEarning(
        compensationModel: CompensationModel?,
        hourlyRate: BigDecimal?,
        durationMinutes: Int,
        attendeeCount: Int,
        pricePerAttendee: Money?
    ): Money {
        val model = compensationModel ?: CompensationModel.HOURLY
        val currency = "SAR" // Default currency

        val amount = when (model) {
            CompensationModel.HOURLY -> {
                val rate = hourlyRate ?: throw IllegalStateException("Hourly rate not set for trainer")
                val hours = durationMinutes.toBigDecimal().divide(BigDecimal(60), 2, java.math.RoundingMode.HALF_UP)
                rate.multiply(hours)
            }
            CompensationModel.PER_SESSION -> {
                // Fixed rate per class
                hourlyRate ?: throw IllegalStateException("Per-session rate not set for trainer")
            }
            CompensationModel.REVENUE_SHARE -> {
                // 50% of total revenue from class
                if (pricePerAttendee != null) {
                    val totalRevenue = pricePerAttendee.amount.multiply(attendeeCount.toBigDecimal())
                    totalRevenue.multiply(BigDecimal("0.50"))
                } else {
                    throw IllegalStateException("Class pricing not set")
                }
            }
            CompensationModel.SALARY_PLUS_COMMISSION -> {
                // Commission per attendee
                val commissionPerAttendee = BigDecimal("10.00") // SAR 10 per attendee
                commissionPerAttendee.multiply(attendeeCount.toBigDecimal())
            }
        }

        return Money(amount.setScale(2, java.math.RoundingMode.HALF_UP), currency)
    }

    // ==================== APPROVAL WORKFLOW ====================

    /**
     * Approve an earning for payment.
     * Changes status from PENDING to APPROVED and notifies trainer.
     */
    fun approveEarning(command: ApproveEarningCommand): TrainerEarnings {
        val earning = getEarning(command.earningId)
        earning.approve()
        val saved = earningsRepository.save(earning)

        logger.info("Approved earning: ${command.earningId} by ${command.approvedBy}")

        // Notify trainer
        try {
            notificationService.notifyEarningsApproved(
                trainerId = earning.trainerId,
                earningId = earning.id,
                amount = "${earning.netAmount.amount} ${earning.netAmount.currency}",
                earningType = earning.earningType.name
            )
        } catch (e: Exception) {
            logger.error("Failed to send earnings approval notification: ${e.message}", e)
        }

        return saved
    }

    /**
     * Mark an earning as paid with payment details.
     * Changes status from APPROVED to PAID and notifies trainer.
     */
    fun markAsPaid(command: MarkAsPaidCommand): TrainerEarnings {
        val earning = getEarning(command.earningId)
        earning.markAsPaid(command.paymentDate, command.paymentReference)
        val saved = earningsRepository.save(earning)

        logger.info("Marked earning as paid: ${command.earningId}, ref: ${command.paymentReference}")

        // Notify trainer
        try {
            notificationService.notifyEarningsPaid(
                trainerId = earning.trainerId,
                earningId = earning.id,
                amount = "${earning.netAmount.amount} ${earning.netAmount.currency}",
                paymentReference = command.paymentReference
            )
        } catch (e: Exception) {
            logger.error("Failed to send payment notification: ${e.message}", e)
        }

        return saved
    }

    /**
     * Dispute an earning.
     */
    fun disputeEarning(command: DisputeEarningCommand): TrainerEarnings {
        val earning = getEarning(command.earningId)
        earning.dispute(command.reason)
        val saved = earningsRepository.save(earning)
        logger.info("Disputed earning: ${command.earningId}, reason: ${command.reason}")
        return saved
    }

    /**
     * Resolve a disputed earning.
     */
    fun resolveDispute(command: ResolveDisputeCommand): TrainerEarnings {
        val earning = getEarning(command.earningId)
        earning.resolveDispute(command.approved)

        if (command.resolution != null) {
            earning.notes = if (earning.notes != null) {
                "${earning.notes}\nRESOLUTION: ${command.resolution}"
            } else {
                "RESOLUTION: ${command.resolution}"
            }
        }

        val saved = earningsRepository.save(earning)
        logger.info("Resolved dispute for earning: ${command.earningId}, approved: ${command.approved}")
        return saved
    }

    // ==================== UPDATE OPERATIONS ====================

    /**
     * Update earning notes.
     */
    fun updateNotes(command: UpdateEarningNotesCommand): TrainerEarnings {
        val earning = getEarning(command.earningId)
        earning.notes = command.notes
        val saved = earningsRepository.save(earning)
        logger.debug("Updated notes for earning: ${command.earningId}")
        return saved
    }

    /**
     * Update deductions and recalculate net amount.
     */
    fun updateDeductions(earningId: UUID, deductions: Money?): TrainerEarnings {
        val earning = getEarning(earningId)

        require(earning.canEdit()) {
            "Cannot edit earning in ${earning.status} status"
        }

        earning.deductions = deductions
        earning.netAmount = if (deductions != null) {
            Money(
                earning.amount.amount.subtract(deductions.amount),
                earning.amount.currency
            )
        } else {
            earning.amount
        }

        val saved = earningsRepository.save(earning)
        logger.info("Updated deductions for earning: $earningId")
        return saved
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get an earning by ID.
     */
    fun getEarning(id: UUID): TrainerEarnings {
        return earningsRepository.findById(id)
            .orElseThrow { NoSuchElementException("Trainer earning not found: $id") }
    }

    /**
     * Get all earnings for a trainer.
     */
    fun getEarningsForTrainer(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings> {
        return earningsRepository.findByTrainerId(trainerId, pageable)
    }

    /**
     * Get earnings by trainer and status.
     */
    fun getEarningsByStatus(trainerId: UUID, status: EarningStatus, pageable: Pageable): Page<TrainerEarnings> {
        return earningsRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    /**
     * Get earnings by trainer and date range.
     */
    fun getEarningsByDateRange(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings> {
        return earningsRepository.findByTrainerIdAndEarningDateBetween(trainerId, startDate, endDate, pageable)
    }

    /**
     * Get pending payment earnings for a trainer (PENDING or APPROVED).
     */
    fun getPendingPaymentEarnings(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings> {
        return earningsRepository.findPendingPaymentByTrainerId(trainerId, pageable)
    }

    /**
     * Get all pending earnings (for admin approval).
     */
    fun getAllPendingEarnings(pageable: Pageable): Page<TrainerEarnings> {
        return earningsRepository.findByStatus(EarningStatus.PENDING, pageable)
    }

    /**
     * Calculate total earnings for a trainer.
     * Can be filtered by status (e.g., only PAID earnings).
     */
    fun calculateTotalEarnings(trainerId: UUID, status: EarningStatus? = null): BigDecimal {
        return earningsRepository.calculateTotalEarnings(trainerId, status)
    }

    /**
     * Get earning by session ID.
     */
    fun getEarningBySessionId(sessionId: UUID): TrainerEarnings? {
        return earningsRepository.findBySessionId(sessionId).orElse(null)
    }

    /**
     * Delete an earning.
     * Should be used sparingly - only for data corrections.
     */
    fun deleteEarning(id: UUID) {
        require(earningsRepository.existsById(id)) {
            "Trainer earning not found: $id"
        }
        earningsRepository.deleteById(id)
        logger.warn("Deleted earning: $id")
    }
}
