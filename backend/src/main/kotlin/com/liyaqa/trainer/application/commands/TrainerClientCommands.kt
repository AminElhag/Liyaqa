package com.liyaqa.trainer.application.commands

import com.liyaqa.trainer.domain.model.TrainerClientStatus
import java.time.LocalDate
import java.util.UUID

/**
 * Command to create a new trainer-client relationship.
 * Typically called automatically on first PT session.
 */
data class CreateTrainerClientCommand(
    val trainerId: UUID,
    val memberId: UUID,
    val startDate: LocalDate = LocalDate.now(),
    val goalsEn: String? = null,
    val goalsAr: String? = null,
    val notesEn: String? = null,
    val notesAr: String? = null
)

/**
 * Command to update client goals.
 */
data class UpdateClientGoalsCommand(
    val clientId: UUID,
    val goalsEn: String? = null,
    val goalsAr: String? = null
)

/**
 * Command to update trainer notes about a client.
 */
data class UpdateClientNotesCommand(
    val clientId: UUID,
    val notesEn: String? = null,
    val notesAr: String? = null
)

/**
 * Command to change client relationship status.
 */
data class UpdateClientStatusCommand(
    val clientId: UUID,
    val status: TrainerClientStatus,
    val endDate: LocalDate? = null
)

/**
 * Command to deactivate a client relationship.
 */
data class DeactivateClientCommand(
    val clientId: UUID,
    val endDate: LocalDate = LocalDate.now()
)

/**
 * Command to reactivate a client relationship.
 */
data class ReactivateClientCommand(
    val clientId: UUID
)

/**
 * Command to mark a client relationship as completed.
 */
data class CompleteClientCommand(
    val clientId: UUID,
    val endDate: LocalDate = LocalDate.now()
)
