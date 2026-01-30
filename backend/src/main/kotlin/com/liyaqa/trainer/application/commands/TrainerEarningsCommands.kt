package com.liyaqa.trainer.application.commands

import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.domain.model.EarningType
import java.time.LocalDate
import java.util.UUID

/**
 * Command to manually create a trainer earning.
 * Note: Earnings are typically auto-created by the system.
 */
data class CreateEarningCommand(
    val trainerId: UUID,
    val earningType: EarningType,
    val sessionId: UUID? = null,
    val earningDate: LocalDate,
    val amount: Money,
    val deductions: Money? = null,
    val netAmount: Money,
    val notes: String? = null
)

/**
 * Command to approve an earning for payment.
 */
data class ApproveEarningCommand(
    val earningId: UUID,
    val approvedBy: UUID? = null
)

/**
 * Command to mark an earning as paid.
 */
data class MarkAsPaidCommand(
    val earningId: UUID,
    val paymentDate: LocalDate = LocalDate.now(),
    val paymentReference: String
)

/**
 * Command to dispute an earning.
 */
data class DisputeEarningCommand(
    val earningId: UUID,
    val reason: String
)

/**
 * Command to resolve a disputed earning.
 */
data class ResolveDisputeCommand(
    val earningId: UUID,
    val approved: Boolean,
    val resolution: String? = null
)

/**
 * Command to update earning notes.
 */
data class UpdateEarningNotesCommand(
    val earningId: UUID,
    val notes: String
)
