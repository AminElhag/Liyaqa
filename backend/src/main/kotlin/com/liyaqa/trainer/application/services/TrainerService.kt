package com.liyaqa.trainer.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.trainer.application.commands.*
import com.liyaqa.trainer.domain.model.Trainer
import com.liyaqa.trainer.domain.model.TrainerClubAssignment
import com.liyaqa.trainer.domain.model.TrainerClubAssignmentStatus
import com.liyaqa.trainer.domain.model.TrainerStatus
import com.liyaqa.trainer.domain.model.TrainerType
import com.liyaqa.trainer.domain.ports.TrainerClubAssignmentRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

/**
 * Service for managing trainers.
 *
 * Handles:
 * - Trainer CRUD operations
 * - Trainer status transitions
 * - Trainer-club assignments
 * - JSON serialization of specializations, certifications, and availability
 */
@Service
@Transactional
class TrainerService(
    private val trainerRepository: TrainerRepository,
    private val trainerClubAssignmentRepository: TrainerClubAssignmentRepository,
    private val userRepository: UserRepository,
    private val clubRepository: ClubRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(TrainerService::class.java)

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new trainer from an existing user.
     */
    fun createTrainer(command: CreateTrainerCommand): Trainer {
        // Verify user exists
        require(userRepository.existsById(command.userId)) {
            "User not found with id: ${command.userId}"
        }

        // Verify trainer doesn't already exist for this user in this organization
        require(!trainerRepository.existsByUserIdAndOrganizationId(command.userId, command.organizationId)) {
            "A trainer profile already exists for user ${command.userId} in organization ${command.organizationId}"
        }

        // Verify primary club if specified
        command.primaryClubId?.let { primaryClubId ->
            require(clubRepository.existsById(primaryClubId)) {
                "Primary club not found with id: $primaryClubId"
            }
        }

        val trainer = Trainer.create(
            userId = command.userId,
            organizationId = command.organizationId,
            tenantId = command.tenantId,
            employmentType = command.employmentType,
            trainerType = command.trainerType,
            displayName = command.displayName,
            dateOfBirth = command.dateOfBirth,
            gender = command.gender
        ).apply {
            bio = command.bio
            profileImageUrl = command.profileImageUrl
            experienceYears = command.experienceYears
            specializations = command.specializations?.let { serializeToJson(it) }
            certifications = command.certifications?.let { serializeCertifications(it) }
            hourlyRate = command.hourlyRate
            ptSessionRate = command.ptSessionRate
            compensationModel = command.compensationModel
            phone = command.phone
            notes = command.notes
        }

        val savedTrainer = trainerRepository.save(trainer)
        logger.info("Created trainer ${savedTrainer.id} for user ${command.userId}")

        // Assign to clubs if specified
        command.assignedClubIds?.forEach { clubId ->
            val isPrimary = clubId == command.primaryClubId
            assignTrainerToClub(
                AssignTrainerToClubCommand(
                    trainerId = savedTrainer.id,
                    clubId = clubId,
                    isPrimary = isPrimary
                )
            )
        }

        // If primary club specified but not in assignedClubIds, assign it
        command.primaryClubId?.let { primaryClubId ->
            if (command.assignedClubIds?.contains(primaryClubId) != true) {
                assignTrainerToClub(
                    AssignTrainerToClubCommand(
                        trainerId = savedTrainer.id,
                        clubId = primaryClubId,
                        isPrimary = true
                    )
                )
            }
        }

        return savedTrainer
    }

    /**
     * Get trainer by ID.
     */
    @Transactional(readOnly = true)
    fun getTrainer(id: UUID): Trainer {
        return trainerRepository.findById(id)
            .orElseThrow { NoSuchElementException("Trainer not found with id: $id") }
    }

    /**
     * Get trainer by user ID.
     */
    @Transactional(readOnly = true)
    fun getTrainerByUserId(userId: UUID): Trainer {
        return trainerRepository.findByUserId(userId)
            .orElseThrow { NoSuchElementException("Trainer not found for user: $userId") }
    }

    /**
     * Find trainer by user ID (returns null if not found).
     */
    @Transactional(readOnly = true)
    fun findTrainerByUserId(userId: UUID): Trainer? {
        return trainerRepository.findByUserId(userId).orElse(null)
    }

    /**
     * Get trainer by user ID and organization ID.
     */
    @Transactional(readOnly = true)
    fun getTrainerByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Trainer {
        return trainerRepository.findByUserIdAndOrganizationId(userId, organizationId)
            .orElseThrow { NoSuchElementException("Trainer not found for user $userId in organization $organizationId") }
    }

    /**
     * Get all trainers with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllTrainers(pageable: Pageable): Page<Trainer> {
        return trainerRepository.findAll(pageable)
    }

    /**
     * Search trainers with filters.
     */
    @Transactional(readOnly = true)
    fun searchTrainers(
        search: String?,
        status: TrainerStatus?,
        trainerType: TrainerType?,
        pageable: Pageable
    ): Page<Trainer> {
        return trainerRepository.search(search, status, trainerType, pageable)
    }

    /**
     * Get trainers by organization.
     */
    @Transactional(readOnly = true)
    fun getTrainersByOrganization(organizationId: UUID, pageable: Pageable): Page<Trainer> {
        return trainerRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Get trainers by club.
     */
    @Transactional(readOnly = true)
    fun getTrainersByClub(clubId: UUID, pageable: Pageable): Page<Trainer> {
        return trainerRepository.findByClubId(clubId, pageable)
    }

    /**
     * Get active trainers who can teach group classes.
     */
    @Transactional(readOnly = true)
    fun getActiveGroupFitnessTrainers(pageable: Pageable): Page<Trainer> {
        return trainerRepository.findActiveGroupFitnessTrainers(pageable)
    }

    /**
     * Get active trainers who can provide personal training.
     */
    @Transactional(readOnly = true)
    fun getActivePersonalTrainers(pageable: Pageable): Page<Trainer> {
        return trainerRepository.findActivePersonalTrainers(pageable)
    }

    // ==================== UPDATE OPERATIONS ====================

    /**
     * Update trainer profile information.
     */
    fun updateTrainerProfile(command: UpdateTrainerProfileCommand): Trainer {
        val trainer = getTrainer(command.trainerId)

        trainer.updateProfile(
            bio = command.bio ?: trainer.bio,
            profileImageUrl = command.profileImageUrl ?: trainer.profileImageUrl,
            experienceYears = command.experienceYears ?: trainer.experienceYears,
            phone = command.phone ?: trainer.phone
        )

        return trainerRepository.save(trainer)
    }

    /**
     * Update trainer classification (employment type and trainer type).
     */
    fun updateTrainerClassification(command: UpdateTrainerClassificationCommand): Trainer {
        val trainer = getTrainer(command.trainerId)

        trainer.updateClassification(
            employmentType = command.employmentType,
            trainerType = command.trainerType
        )

        return trainerRepository.save(trainer)
    }

    /**
     * Update trainer qualifications (specializations and certifications).
     */
    fun updateTrainerQualifications(command: UpdateTrainerQualificationsCommand): Trainer {
        val trainer = getTrainer(command.trainerId)

        trainer.updateQualifications(
            specializations = command.specializations?.let { serializeToJson(it) },
            certifications = command.certifications?.let { serializeCertifications(it) }
        )

        return trainerRepository.save(trainer)
    }

    /**
     * Update trainer compensation information.
     */
    fun updateTrainerCompensation(command: UpdateTrainerCompensationCommand): Trainer {
        val trainer = getTrainer(command.trainerId)

        trainer.updateCompensation(
            hourlyRate = command.hourlyRate,
            ptSessionRate = command.ptSessionRate,
            compensationModel = command.compensationModel
        )

        return trainerRepository.save(trainer)
    }

    /**
     * Update trainer availability for personal training.
     */
    fun updateTrainerAvailability(command: UpdateTrainerAvailabilityCommand): Trainer {
        val trainer = getTrainer(command.trainerId)

        trainer.updateAvailability(serializeAvailability(command.availability))

        return trainerRepository.save(trainer)
    }

    /**
     * Update trainer basic info (display name, date of birth, gender).
     */
    fun updateTrainerBasicInfo(command: UpdateTrainerBasicInfoCommand): Trainer {
        val trainer = getTrainer(command.trainerId)

        trainer.updateBasicInfo(
            displayName = command.displayName ?: trainer.displayName,
            dateOfBirth = command.dateOfBirth ?: trainer.dateOfBirth,
            gender = command.gender ?: trainer.gender
        )

        return trainerRepository.save(trainer)
    }

    // ==================== STATUS TRANSITIONS ====================

    /**
     * Activate a trainer.
     */
    fun activateTrainer(id: UUID): Trainer {
        val trainer = getTrainer(id)
        trainer.activate()
        return trainerRepository.save(trainer)
    }

    /**
     * Deactivate a trainer.
     */
    fun deactivateTrainer(id: UUID): Trainer {
        val trainer = getTrainer(id)
        trainer.deactivate()
        return trainerRepository.save(trainer)
    }

    /**
     * Set trainer on leave.
     */
    fun setTrainerOnLeave(id: UUID): Trainer {
        val trainer = getTrainer(id)
        trainer.setOnLeave()
        return trainerRepository.save(trainer)
    }

    /**
     * Return trainer from leave.
     */
    fun returnTrainerFromLeave(id: UUID): Trainer {
        val trainer = getTrainer(id)
        trainer.returnFromLeave()
        return trainerRepository.save(trainer)
    }

    /**
     * Terminate a trainer.
     */
    fun terminateTrainer(id: UUID): Trainer {
        val trainer = getTrainer(id)
        trainer.terminate()

        // Deactivate all club assignments
        trainerClubAssignmentRepository.findActiveByTrainerId(id).forEach { assignment ->
            assignment.deactivate()
            trainerClubAssignmentRepository.save(assignment)
        }

        return trainerRepository.save(trainer)
    }

    // ==================== CLUB ASSIGNMENTS ====================

    /**
     * Assign a trainer to a club.
     */
    fun assignTrainerToClub(command: AssignTrainerToClubCommand): TrainerClubAssignment {
        val trainer = getTrainer(command.trainerId)

        // Verify club exists
        require(clubRepository.existsById(command.clubId)) {
            "Club not found with id: ${command.clubId}"
        }

        // Check if assignment already exists
        val existingAssignment = trainerClubAssignmentRepository.findByTrainerIdAndClubId(
            command.trainerId, command.clubId
        )

        if (existingAssignment.isPresent) {
            // Reactivate existing assignment
            val assignment = existingAssignment.get()
            assignment.activate()
            if (command.isPrimary) {
                // Clear other primary assignments
                clearPrimaryClub(command.trainerId)
                assignment.makePrimary()
            }
            logger.info("Reactivated trainer ${command.trainerId} assignment to club ${command.clubId}")
            return trainerClubAssignmentRepository.save(assignment)
        }

        // Create new assignment
        if (command.isPrimary) {
            clearPrimaryClub(command.trainerId)
        }

        val assignment = TrainerClubAssignment.create(
            trainerId = command.trainerId,
            clubId = command.clubId,
            isPrimary = command.isPrimary
        )

        val savedAssignment = trainerClubAssignmentRepository.save(assignment)
        logger.info("Assigned trainer ${command.trainerId} to club ${command.clubId} (primary: ${command.isPrimary})")

        return savedAssignment
    }

    /**
     * Remove a trainer from a club.
     */
    fun removeTrainerFromClub(command: RemoveTrainerFromClubCommand) {
        val assignment = trainerClubAssignmentRepository.findByTrainerIdAndClubId(
            command.trainerId, command.clubId
        ).orElseThrow {
            NoSuchElementException("Trainer ${command.trainerId} is not assigned to club ${command.clubId}")
        }

        assignment.deactivate()
        trainerClubAssignmentRepository.save(assignment)
        logger.info("Removed trainer ${command.trainerId} from club ${command.clubId}")
    }

    /**
     * Set a club as the trainer's primary club.
     */
    fun setPrimaryClub(trainerId: UUID, clubId: UUID): TrainerClubAssignment {
        val assignment = trainerClubAssignmentRepository.findByTrainerIdAndClubId(trainerId, clubId)
            .orElseThrow {
                NoSuchElementException("Trainer $trainerId is not assigned to club $clubId")
            }

        require(assignment.isActive()) {
            "Cannot set inactive assignment as primary"
        }

        // Clear other primary assignments
        clearPrimaryClub(trainerId)

        assignment.makePrimary()
        return trainerClubAssignmentRepository.save(assignment)
    }

    /**
     * Get all club assignments for a trainer.
     */
    @Transactional(readOnly = true)
    fun getTrainerClubAssignments(trainerId: UUID): List<TrainerClubAssignment> {
        return trainerClubAssignmentRepository.findByTrainerId(trainerId)
    }

    /**
     * Get active club assignments for a trainer.
     */
    @Transactional(readOnly = true)
    fun getActiveTrainerClubAssignments(trainerId: UUID): List<TrainerClubAssignment> {
        return trainerClubAssignmentRepository.findActiveByTrainerId(trainerId)
    }

    /**
     * Get the trainer's primary club assignment.
     */
    @Transactional(readOnly = true)
    fun getPrimaryClubAssignment(trainerId: UUID): TrainerClubAssignment? {
        return trainerClubAssignmentRepository.findPrimaryByTrainerId(trainerId).orElse(null)
    }

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete a trainer and all club assignments.
     */
    fun deleteTrainer(id: UUID) {
        // Delete all club assignments first
        trainerClubAssignmentRepository.deleteByTrainerId(id)

        // Delete the trainer
        trainerRepository.deleteById(id)
        logger.info("Deleted trainer $id")
    }

    // ==================== STATISTICS ====================

    /**
     * Count all trainers.
     */
    @Transactional(readOnly = true)
    fun countTrainers(): Long {
        return trainerRepository.count()
    }

    // ==================== HELPER METHODS ====================

    /**
     * Clear primary flag from all club assignments for a trainer.
     */
    private fun clearPrimaryClub(trainerId: UUID) {
        trainerClubAssignmentRepository.findPrimaryByTrainerId(trainerId).ifPresent { assignment ->
            assignment.makeSecondary()
            trainerClubAssignmentRepository.save(assignment)
        }
    }

    /**
     * Serialize a list to JSON string.
     */
    private fun serializeToJson(list: List<String>): String {
        return objectMapper.writeValueAsString(list)
    }

    /**
     * Deserialize JSON string to list.
     */
    fun deserializeSpecializations(json: String?): List<String> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            objectMapper.readValue(json)
        } catch (e: Exception) {
            logger.warn("Failed to deserialize specializations: ${e.message}")
            emptyList()
        }
    }

    /**
     * Serialize certifications to JSON string.
     */
    private fun serializeCertifications(certifications: List<CertificationInput>): String {
        val certList = certifications.map { cert ->
            mapOf(
                "name" to cert.name,
                "issuedBy" to cert.issuedBy,
                "issuedAt" to cert.issuedAt,
                "expiresAt" to cert.expiresAt
            )
        }
        return objectMapper.writeValueAsString(certList)
    }

    /**
     * Deserialize certifications JSON.
     */
    fun deserializeCertifications(json: String?): List<CertificationData> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            val list: List<Map<String, String?>> = objectMapper.readValue(json)
            list.map { map ->
                CertificationData(
                    name = map["name"] ?: "",
                    issuedBy = map["issuedBy"],
                    issuedAt = map["issuedAt"]?.let { LocalDate.parse(it, DateTimeFormatter.ISO_DATE) },
                    expiresAt = map["expiresAt"]?.let { LocalDate.parse(it, DateTimeFormatter.ISO_DATE) }
                )
            }
        } catch (e: Exception) {
            logger.warn("Failed to deserialize certifications: ${e.message}")
            emptyList()
        }
    }

    /**
     * Serialize availability to JSON string.
     */
    private fun serializeAvailability(availability: AvailabilityInput): String {
        val availMap = mapOf(
            "monday" to availability.monday?.map { mapOf("start" to it.start, "end" to it.end) },
            "tuesday" to availability.tuesday?.map { mapOf("start" to it.start, "end" to it.end) },
            "wednesday" to availability.wednesday?.map { mapOf("start" to it.start, "end" to it.end) },
            "thursday" to availability.thursday?.map { mapOf("start" to it.start, "end" to it.end) },
            "friday" to availability.friday?.map { mapOf("start" to it.start, "end" to it.end) },
            "saturday" to availability.saturday?.map { mapOf("start" to it.start, "end" to it.end) },
            "sunday" to availability.sunday?.map { mapOf("start" to it.start, "end" to it.end) }
        ).filterValues { it != null }
        return objectMapper.writeValueAsString(availMap)
    }

    /**
     * Deserialize availability JSON.
     */
    fun deserializeAvailability(json: String?): AvailabilityData? {
        if (json.isNullOrBlank()) return null
        return try {
            val map: Map<String, List<Map<String, String>>> = objectMapper.readValue(json)
            AvailabilityData(
                monday = map["monday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") },
                tuesday = map["tuesday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") },
                wednesday = map["wednesday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") },
                thursday = map["thursday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") },
                friday = map["friday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") },
                saturday = map["saturday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") },
                sunday = map["sunday"]?.map { TimeSlotData(it["start"] ?: "", it["end"] ?: "") }
            )
        } catch (e: Exception) {
            logger.warn("Failed to deserialize availability: ${e.message}")
            null
        }
    }
}

/**
 * Data class for deserialized certification information.
 */
data class CertificationData(
    val name: String,
    val issuedBy: String?,
    val issuedAt: LocalDate?,
    val expiresAt: LocalDate?
)

/**
 * Data class for deserialized availability information.
 */
data class AvailabilityData(
    val monday: List<TimeSlotData>?,
    val tuesday: List<TimeSlotData>?,
    val wednesday: List<TimeSlotData>?,
    val thursday: List<TimeSlotData>?,
    val friday: List<TimeSlotData>?,
    val saturday: List<TimeSlotData>?,
    val sunday: List<TimeSlotData>?
)

/**
 * Data class for deserialized time slot.
 */
data class TimeSlotData(
    val start: String,
    val end: String
)
