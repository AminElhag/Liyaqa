package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.application.commands.CreatePTClassCommand
import com.liyaqa.scheduling.application.commands.CompletePTSessionCommand
import com.liyaqa.scheduling.application.commands.SchedulePTSessionCommand
import com.liyaqa.scheduling.domain.model.*
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.trainer.application.services.TrainerAvailabilityService
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class PTSessionService(
    private val gymClassRepository: GymClassRepository,
    private val sessionRepository: ClassSessionRepository,
    private val trainerRepository: TrainerRepository,
    private val trainerAvailabilityService: TrainerAvailabilityService,
    private val conflictValidator: SessionConflictValidationService
) {
    private val logger = LoggerFactory.getLogger(PTSessionService::class.java)

    // ==================== PT CLASS OPERATIONS ====================

    /**
     * Creates a PT-specific gym class template.
     */
    fun createPTClass(command: CreatePTClassCommand): GymClass {
        // Validate trainer exists
        val trainer = trainerRepository.findById(command.trainerId)
            .orElseThrow { NoSuchElementException("Trainer not found: ${command.trainerId}") }

        require(trainer.isActive()) { "Trainer is not active" }

        // Validate PT configuration
        if (command.ptSessionType == PTSessionType.ONE_ON_ONE) {
            require(command.maxCapacity == 1) { "ONE_ON_ONE sessions must have maxCapacity = 1" }
        } else {
            require(command.maxCapacity in 2..4) { "SEMI_PRIVATE sessions must have maxCapacity between 2 and 4" }
            require(command.minCapacity in 1..command.maxCapacity) {
                "minCapacity must be between 1 and maxCapacity"
            }
        }

        // If HOME PT, travel fee should be set
        if (command.ptLocationType == PTLocationType.HOME && command.travelFee == null) {
            logger.warn("Creating HOME PT class without travel fee for trainer ${command.trainerId}")
        }

        val gymClass = GymClass(
            name = command.name,
            description = command.description,
            classType = ClassType.PERSONAL_TRAINING,
            locationId = command.locationId ?: UUID.randomUUID(), // Will be resolved
            maxCapacity = command.maxCapacity,
            pricingModel = command.pricingModel,
            dropInPrice = command.dropInPrice,
            taxRate = command.taxRate,
            defaultTrainerId = command.trainerId,
            ptSessionType = command.ptSessionType,
            ptLocationType = command.ptLocationType,
            travelFee = command.travelFee,
            trainerProfileId = command.trainerId,
            minCapacity = command.minCapacity,
            categoryId = command.categoryId
        )

        val saved = gymClassRepository.save(gymClass)
        logger.info("Created PT class: ${saved.id} (${command.ptSessionType}, ${command.ptLocationType}) for trainer ${command.trainerId}")
        return saved
    }

    /**
     * Updates an existing PT class.
     */
    fun updatePTClass(id: UUID, command: CreatePTClassCommand): GymClass {
        val gymClass = gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("PT class not found: $id") }

        require(gymClass.classType == ClassType.PERSONAL_TRAINING) {
            "Class $id is not a Personal Training class"
        }

        gymClass.name = command.name
        gymClass.description = command.description
        gymClass.maxCapacity = command.maxCapacity
        gymClass.pricingModel = command.pricingModel
        gymClass.dropInPrice = command.dropInPrice
        gymClass.taxRate = command.taxRate
        gymClass.defaultTrainerId = command.trainerId
        gymClass.ptSessionType = command.ptSessionType
        gymClass.ptLocationType = command.ptLocationType
        gymClass.travelFee = command.travelFee
        gymClass.trainerProfileId = command.trainerId
        gymClass.minCapacity = command.minCapacity
        gymClass.categoryId = command.categoryId

        val saved = gymClassRepository.save(gymClass)
        logger.info("Updated PT class: ${saved.id}")
        return saved
    }

    /**
     * Lists PT classes (filtered by classType = PERSONAL_TRAINING).
     */
    @Transactional(readOnly = true)
    fun listPTClasses(pageable: Pageable): Page<GymClass> {
        return gymClassRepository.findByClassType(ClassType.PERSONAL_TRAINING, pageable)
    }

    /**
     * Gets a PT class by ID with validation that it's a PT class.
     */
    @Transactional(readOnly = true)
    fun getPTClass(id: UUID): GymClass {
        val gymClass = gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("PT class not found: $id") }
        require(gymClass.classType == ClassType.PERSONAL_TRAINING) {
            "Class $id is not a Personal Training class"
        }
        return gymClass
    }

    // ==================== PT SESSION OPERATIONS ====================

    /**
     * Schedules a PT session, validating trainer availability.
     */
    fun schedulePTSession(command: SchedulePTSessionCommand): ClassSession {
        val gymClass = gymClassRepository.findById(command.gymClassId)
            .orElseThrow { NoSuchElementException("PT class not found: ${command.gymClassId}") }

        require(gymClass.classType == ClassType.PERSONAL_TRAINING) {
            "Class ${command.gymClassId} is not a Personal Training class"
        }

        require(gymClass.status == GymClassStatus.ACTIVE) {
            "PT class is not active"
        }

        // Validate trainer availability (unless explicitly skipped by admin)
        val trainerId = gymClass.trainerProfileId ?: gymClass.defaultTrainerId
        if (trainerId != null && !command.skipAvailabilityCheck) {
            val isAvailable = trainerAvailabilityService.isTrainerAvailable(
                trainerId, command.sessionDate, command.startTime, command.endTime
            )
            require(isAvailable) {
                "Trainer is not available at the requested time"
            }
        }

        // Validate no scheduling conflicts with existing sessions
        conflictValidator.validateNoConflicts(
            trainerId = trainerId,
            locationId = gymClass.locationId,
            sessionDate = command.sessionDate,
            startTime = command.startTime,
            endTime = command.endTime
        )

        val session = ClassSession(
            gymClassId = gymClass.id,
            locationId = gymClass.locationId,
            trainerId = trainerId,
            sessionDate = command.sessionDate,
            startTime = command.startTime,
            endTime = command.endTime,
            maxCapacity = gymClass.maxCapacity,
            ptLocationType = gymClass.ptLocationType,
            clientAddress = command.clientAddress,
            travelFeeApplied = if (gymClass.ptLocationType == PTLocationType.HOME) gymClass.travelFee else null,
            notes = command.notes
        )

        val saved = sessionRepository.save(session)
        logger.info("Scheduled PT session: ${saved.id} on ${command.sessionDate} ${command.startTime}-${command.endTime}")
        return saved
    }

    /**
     * Completes a PT session with notes.
     */
    fun completePTSession(command: CompletePTSessionCommand): ClassSession {
        val session = sessionRepository.findById(command.sessionId)
            .orElseThrow { NoSuchElementException("Session not found: ${command.sessionId}") }

        val gymClass = gymClassRepository.findById(session.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${session.gymClassId}") }

        require(gymClass.classType == ClassType.PERSONAL_TRAINING) {
            "Session is not for a Personal Training class"
        }

        require(session.status == SessionStatus.SCHEDULED || session.status == SessionStatus.IN_PROGRESS) {
            "Session cannot be completed (current status: ${session.status})"
        }

        session.completionNotes = command.completionNotes
        session.trainerNotes = command.trainerNotes
        session.status = SessionStatus.COMPLETED

        val saved = sessionRepository.save(session)
        logger.info("Completed PT session: ${saved.id}")
        return saved
    }

    /**
     * Cancels a PT session.
     */
    fun cancelPTSession(sessionId: UUID, reason: String? = null): ClassSession {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { NoSuchElementException("Session not found: $sessionId") }

        require(session.status == SessionStatus.SCHEDULED) {
            "Only scheduled sessions can be cancelled"
        }

        session.cancel(reason)
        val saved = sessionRepository.save(session)
        logger.info("Cancelled PT session: ${saved.id}")
        return saved
    }

    /**
     * Gets PT sessions for a specific trainer.
     */
    @Transactional(readOnly = true)
    fun getPTSessionsForTrainer(trainerId: UUID, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findByTrainerIdAndClassType(trainerId, ClassType.PERSONAL_TRAINING, pageable)
    }

    /**
     * Gets PT sessions for a date range.
     */
    @Transactional(readOnly = true)
    fun getPTSessionsInRange(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findBySessionDateBetweenAndClassType(startDate, endDate, ClassType.PERSONAL_TRAINING, pageable)
    }

    // ==================== PT DASHBOARD STATS ====================

    /**
     * Gets aggregated PT dashboard statistics.
     */
    @Transactional(readOnly = true)
    fun getPTDashboardStats(): com.liyaqa.scheduling.api.PTDashboardStatsResponse {
        val totalPTClasses = gymClassRepository.count()
        val activePTClasses = gymClassRepository.countByStatus(GymClassStatus.ACTIVE)
        val totalSessions = sessionRepository.count()
        val completedSessions = sessionRepository.countByStatus(SessionStatus.COMPLETED)
        val cancelledSessions = sessionRepository.countByStatus(SessionStatus.CANCELLED)
        val upcomingSessions = sessionRepository.countByStatus(SessionStatus.SCHEDULED)

        return com.liyaqa.scheduling.api.PTDashboardStatsResponse(
            totalPTClasses = totalPTClasses,
            activePTClasses = activePTClasses,
            totalPTSessions = totalSessions,
            completedPTSessions = completedSessions,
            cancelledPTSessions = cancelledSessions,
            upcomingPTSessions = upcomingSessions
        )
    }
}
