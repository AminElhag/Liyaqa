package com.liyaqa.trainer.application.services

import com.liyaqa.trainer.application.commands.*
import com.liyaqa.trainer.domain.model.TrainerClient
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.domain.ports.TrainerClientRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service for managing trainer-client relationships.
 *
 * Handles:
 * - Auto-creation of trainer-client relationships on first PT session
 * - Session statistics tracking (completed, cancelled, no-shows)
 * - Client goals and notes management
 * - Relationship lifecycle (active, on hold, completed, inactive)
 *
 * Integration points:
 * - Called by PersonalTrainingService on session lifecycle events
 */
@Service
@Transactional
class TrainerClientService(
    private val trainerClientRepository: TrainerClientRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerClientService::class.java)

    // ==================== AUTO-CREATION ====================

    /**
     * Get existing trainer-client relationship or create a new one.
     * Called automatically on first PT session between a trainer and member.
     *
     * @param trainerId The trainer ID
     * @param memberId The member ID
     * @return Existing or newly created TrainerClient relationship
     */
    fun getOrCreateClientRelationship(trainerId: UUID, memberId: UUID): TrainerClient {
        return trainerClientRepository.findByTrainerIdAndMemberId(trainerId, memberId)
            .orElseGet {
                val newClient = TrainerClient(
                    trainerId = trainerId,
                    memberId = memberId,
                    startDate = LocalDate.now(),
                    status = TrainerClientStatus.ACTIVE
                )
                val saved = trainerClientRepository.save(newClient)
                logger.info("Created new trainer-client relationship: trainer=$trainerId, member=$memberId, id=${saved.id}")
                saved
            }
    }

    // ==================== SESSION TRACKING ====================

    /**
     * Record that a session was created for this client.
     * Increments total session count.
     */
    fun recordSessionCreated(trainerId: UUID, memberId: UUID) {
        val client = getOrCreateClientRelationship(trainerId, memberId)
        client.recordSessionCreated()
        trainerClientRepository.save(client)
        logger.debug("Recorded session created for client: ${client.id}")
    }

    /**
     * Record that a session was completed.
     * Updates completed session count and last session date.
     */
    fun recordSessionCompleted(trainerId: UUID, memberId: UUID, sessionDate: LocalDate) {
        val client = getOrCreateClientRelationship(trainerId, memberId)
        client.recordSessionCompleted(sessionDate)
        trainerClientRepository.save(client)
        logger.debug("Recorded session completed for client: ${client.id}")
    }

    /**
     * Record that a session was cancelled.
     * Updates cancelled session count.
     */
    fun recordSessionCancelled(trainerId: UUID, memberId: UUID) {
        val client = getOrCreateClientRelationship(trainerId, memberId)
        client.recordSessionCancelled()
        trainerClientRepository.save(client)
        logger.debug("Recorded session cancelled for client: ${client.id}")
    }

    /**
     * Record that a member did not show up for a session.
     * Updates no-show count and last session date.
     */
    fun recordNoShow(trainerId: UUID, memberId: UUID, sessionDate: LocalDate) {
        val client = getOrCreateClientRelationship(trainerId, memberId)
        client.recordNoShow(sessionDate)
        trainerClientRepository.save(client)
        logger.debug("Recorded no-show for client: ${client.id}")
    }

    // ==================== CREATE & UPDATE ====================

    /**
     * Create a new trainer-client relationship manually.
     * Used for pre-existing relationships or admin setup.
     */
    fun createClient(command: CreateTrainerClientCommand): TrainerClient {
        // Check if relationship already exists
        val existing = trainerClientRepository.findByTrainerIdAndMemberId(command.trainerId, command.memberId)
        if (existing.isPresent) {
            throw IllegalStateException("Trainer-client relationship already exists: trainerId=${command.trainerId}, memberId=${command.memberId}")
        }

        val client = TrainerClient(
            trainerId = command.trainerId,
            memberId = command.memberId,
            startDate = command.startDate,
            status = TrainerClientStatus.ACTIVE,
            goalsEn = command.goalsEn,
            goalsAr = command.goalsAr,
            notesEn = command.notesEn,
            notesAr = command.notesAr
        )

        val saved = trainerClientRepository.save(client)
        logger.info("Created trainer-client relationship: ${saved.id} (trainer=${command.trainerId}, member=${command.memberId})")
        return saved
    }

    /**
     * Update client goals (fitness objectives).
     */
    fun updateClientGoals(command: UpdateClientGoalsCommand): TrainerClient {
        val client = getClient(command.clientId)

        command.goalsEn?.let { client.goalsEn = it }
        command.goalsAr?.let { client.goalsAr = it }

        val saved = trainerClientRepository.save(client)
        logger.info("Updated goals for client: ${command.clientId}")
        return saved
    }

    /**
     * Update trainer notes about a client.
     */
    fun updateClientNotes(command: UpdateClientNotesCommand): TrainerClient {
        val client = getClient(command.clientId)

        command.notesEn?.let { client.notesEn = it }
        command.notesAr?.let { client.notesAr = it }

        val saved = trainerClientRepository.save(client)
        logger.info("Updated notes for client: ${command.clientId}")
        return saved
    }

    // ==================== STATUS TRANSITIONS ====================

    /**
     * Deactivate a client relationship.
     */
    fun deactivate(command: DeactivateClientCommand): TrainerClient {
        val client = getClient(command.clientId)
        client.deactivate(command.endDate)
        val saved = trainerClientRepository.save(client)
        logger.info("Deactivated client: ${command.clientId}")
        return saved
    }

    /**
     * Reactivate a client relationship from ON_HOLD or INACTIVE.
     */
    fun reactivate(command: ReactivateClientCommand): TrainerClient {
        val client = getClient(command.clientId)
        client.reactivate()
        val saved = trainerClientRepository.save(client)
        logger.info("Reactivated client: ${command.clientId}")
        return saved
    }

    /**
     * Mark relationship as completed (goals achieved).
     */
    fun complete(command: CompleteClientCommand): TrainerClient {
        val client = getClient(command.clientId)
        client.complete(command.endDate)
        val saved = trainerClientRepository.save(client)
        logger.info("Completed client relationship: ${command.clientId}")
        return saved
    }

    /**
     * Put client relationship on hold (temporary pause).
     */
    fun putOnHold(clientId: UUID): TrainerClient {
        val client = getClient(clientId)
        client.putOnHold()
        val saved = trainerClientRepository.save(client)
        logger.info("Put client on hold: $clientId")
        return saved
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Search clients for a trainer by name, email, or phone.
     */
    fun searchClientsForTrainer(trainerId: UUID, search: String, pageable: Pageable): Page<TrainerClient> {
        return trainerClientRepository.searchByTrainerIdAndTerm(trainerId, search, pageable)
    }

    /**
     * Get a client relationship by ID.
     */
    fun getClient(id: UUID): TrainerClient {
        return trainerClientRepository.findById(id)
            .orElseThrow { NoSuchElementException("Trainer client not found: $id") }
    }

    /**
     * Get all clients for a trainer.
     */
    fun getClientsForTrainer(trainerId: UUID, pageable: Pageable): Page<TrainerClient> {
        return trainerClientRepository.findByTrainerId(trainerId, pageable)
    }

    /**
     * Get clients for a trainer filtered by status.
     */
    fun getClientsForTrainerByStatus(
        trainerId: UUID,
        status: TrainerClientStatus,
        pageable: Pageable
    ): Page<TrainerClient> {
        return trainerClientRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    /**
     * Get active clients for a trainer.
     */
    fun getActiveClientsForTrainer(trainerId: UUID, pageable: Pageable): Page<TrainerClient> {
        return trainerClientRepository.findActiveByTrainerId(trainerId, pageable)
    }

    /**
     * Get all trainers for a member (member's PT history).
     */
    fun getTrainersForMember(memberId: UUID, pageable: Pageable): Page<TrainerClient> {
        return trainerClientRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Check if a trainer-client relationship exists.
     */
    fun relationshipExists(trainerId: UUID, memberId: UUID): Boolean {
        return trainerClientRepository.existsByTrainerIdAndMemberId(trainerId, memberId)
    }

    /**
     * Get client relationship by trainer and member.
     */
    fun getClientByTrainerAndMember(trainerId: UUID, memberId: UUID): TrainerClient? {
        return trainerClientRepository.findByTrainerIdAndMemberId(trainerId, memberId).orElse(null)
    }

    /**
     * Delete a client relationship.
     * Should be used sparingly - prefer deactivate() instead.
     */
    fun deleteClient(id: UUID) {
        require(trainerClientRepository.existsById(id)) {
            "Trainer client not found: $id"
        }
        trainerClientRepository.deleteById(id)
        logger.warn("Deleted client relationship: $id")
    }
}
