package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.scheduling.application.commands.CreateClassScheduleCommand
import com.liyaqa.scheduling.application.commands.CreateClassSessionCommand
import com.liyaqa.scheduling.application.commands.CreateGymClassCommand
import com.liyaqa.scheduling.application.commands.GenerateSessionsCommand
import com.liyaqa.scheduling.application.commands.UpdateClassScheduleCommand
import com.liyaqa.scheduling.application.commands.UpdateClassSessionCommand
import com.liyaqa.scheduling.application.commands.UpdateGymClassCommand
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassSchedule
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassScheduleRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.trainer.application.services.TrainerEarningsService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
@Transactional
class ClassService(
    private val gymClassRepository: GymClassRepository,
    private val scheduleRepository: ClassScheduleRepository,
    private val sessionRepository: ClassSessionRepository,
    private val bookingRepository: ClassBookingRepository,
    private val memberRepository: MemberRepository,
    private val locationRepository: LocationRepository,
    private val notificationService: NotificationService,
    private val trainerEarningsService: TrainerEarningsService,
    private val bookingService: BookingService,
    private val conflictValidator: SessionConflictValidationService
) {
    private val logger = LoggerFactory.getLogger(ClassService::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    // ==================== GYM CLASS OPERATIONS ====================

    /**
     * Creates a new gym class.
     * If locationId is not provided, it will be auto-resolved from the tenant's first active location.
     */
    fun createGymClass(command: CreateGymClassCommand): GymClass {
        // Auto-resolve locationId if not provided
        val resolvedLocationId = command.locationId ?: run {
            val tenantId = TenantContext.getCurrentTenant().value
            locationRepository.findByClubId(tenantId, PageRequest.of(0, 1))
                .content.firstOrNull()?.id
                ?: throw IllegalStateException("No locations found for this club. Please create a location first.")
        }

        // Validate location exists
        if (!locationRepository.existsById(resolvedLocationId)) {
            throw NoSuchElementException("Location not found: $resolvedLocationId")
        }

        val gymClass = GymClass(
            name = command.name,
            description = command.description,
            locationId = resolvedLocationId,
            defaultTrainerId = command.defaultTrainerId,
            classType = command.classType,
            difficultyLevel = command.difficultyLevel,
            durationMinutes = command.durationMinutes,
            maxCapacity = command.maxCapacity,
            waitlistEnabled = command.waitlistEnabled,
            maxWaitlistSize = command.maxWaitlistSize,
            requiresSubscription = command.requiresSubscription,
            deductsClassFromPlan = command.deductsClassFromPlan,
            colorCode = command.colorCode,
            imageUrl = command.imageUrl,
            sortOrder = command.sortOrder,
            pricingModel = command.pricingModel,
            dropInPrice = command.dropInPrice,
            taxRate = command.taxRate,
            allowNonSubscribers = command.allowNonSubscribers,
            advanceBookingDays = command.advanceBookingDays,
            cancellationDeadlineHours = command.cancellationDeadlineHours,
            lateCancellationFee = command.lateCancellationFee,
            accessPolicy = command.accessPolicy,
            onlineBookableSpots = command.onlineBookableSpots,
            noShowFee = command.noShowFee,
            spotBookingEnabled = command.spotBookingEnabled,
            roomLayoutId = command.roomLayoutId
        )
        gymClass.categoryId = command.categoryId

        // Validate pricing configuration
        gymClass.validatePricingConfiguration()

        return gymClassRepository.save(gymClass)
    }

    /**
     * Gets a gym class by ID.
     */
    @Transactional(readOnly = true)
    fun getGymClass(id: UUID): GymClass {
        return gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("Gym class not found: $id") }
    }

    /**
     * Batch-loads gym classes by IDs, returning a map keyed by class ID.
     */
    @Transactional(readOnly = true)
    fun getGymClassesMap(ids: Collection<UUID>): Map<UUID, GymClass> {
        if (ids.isEmpty()) return emptyMap()
        return gymClassRepository.findAllById(ids).associateBy { it.id }
    }

    /**
     * Gets all gym classes with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllGymClasses(pageable: Pageable): Page<GymClass> {
        return gymClassRepository.findAll(pageable)
    }

    /**
     * Gets gym classes by location.
     */
    @Transactional(readOnly = true)
    fun getGymClassesByLocation(locationId: UUID, pageable: Pageable): Page<GymClass> {
        return gymClassRepository.findByLocationId(locationId, pageable)
    }

    /**
     * Gets active gym classes by location.
     */
    @Transactional(readOnly = true)
    fun getActiveGymClassesByLocation(locationId: UUID, pageable: Pageable): Page<GymClass> {
        return gymClassRepository.findByLocationIdAndStatus(locationId, GymClassStatus.ACTIVE, pageable)
    }

    /**
     * Gets gym classes by trainer.
     */
    @Transactional(readOnly = true)
    fun getGymClassesByTrainer(trainerId: UUID, pageable: Pageable): Page<GymClass> {
        return gymClassRepository.findByDefaultTrainerId(trainerId, pageable)
    }

    /**
     * Updates a gym class.
     */
    fun updateGymClass(id: UUID, command: UpdateGymClassCommand): GymClass {
        val gymClass = gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("Gym class not found: $id") }

        command.name?.let { gymClass.name = it }
        command.description?.let { gymClass.description = it }
        command.locationId?.let { gymClass.locationId = it }
        command.defaultTrainerId?.let { gymClass.defaultTrainerId = it }
        command.classType?.let { gymClass.classType = it }
        command.difficultyLevel?.let { gymClass.difficultyLevel = it }
        command.durationMinutes?.let { gymClass.durationMinutes = it }
        command.maxCapacity?.let { gymClass.maxCapacity = it }
        command.waitlistEnabled?.let { gymClass.waitlistEnabled = it }
        command.maxWaitlistSize?.let { gymClass.maxWaitlistSize = it }
        command.requiresSubscription?.let { gymClass.requiresSubscription = it }
        command.deductsClassFromPlan?.let { gymClass.deductsClassFromPlan = it }
        command.colorCode?.let { gymClass.colorCode = it }
        command.imageUrl?.let { gymClass.imageUrl = it }
        command.sortOrder?.let { gymClass.sortOrder = it }
        // Pricing fields
        command.pricingModel?.let { gymClass.pricingModel = it }
        command.dropInPrice?.let { gymClass.dropInPrice = it }
        command.taxRate?.let { gymClass.taxRate = it }
        command.allowNonSubscribers?.let { gymClass.allowNonSubscribers = it }
        command.advanceBookingDays?.let { gymClass.advanceBookingDays = it }
        command.cancellationDeadlineHours?.let { gymClass.cancellationDeadlineHours = it }
        command.lateCancellationFee?.let { gymClass.lateCancellationFee = it }
        command.accessPolicy?.let { gymClass.accessPolicy = it }
        command.onlineBookableSpots?.let { gymClass.onlineBookableSpots = it }
        command.noShowFee?.let { gymClass.noShowFee = it }
        command.spotBookingEnabled?.let { gymClass.spotBookingEnabled = it }
        command.roomLayoutId?.let { gymClass.roomLayoutId = it }
        command.categoryId?.let { gymClass.categoryId = it }

        // Validate pricing configuration
        gymClass.validatePricingConfiguration()

        return gymClassRepository.save(gymClass)
    }

    /**
     * Activates a gym class.
     */
    fun activateGymClass(id: UUID): GymClass {
        val gymClass = gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("Gym class not found: $id") }
        gymClass.activate()
        return gymClassRepository.save(gymClass)
    }

    /**
     * Deactivates a gym class.
     */
    fun deactivateGymClass(id: UUID): GymClass {
        val gymClass = gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("Gym class not found: $id") }
        gymClass.deactivate()
        return gymClassRepository.save(gymClass)
    }

    /**
     * Archives a gym class.
     */
    fun archiveGymClass(id: UUID): GymClass {
        val gymClass = gymClassRepository.findById(id)
            .orElseThrow { NoSuchElementException("Gym class not found: $id") }
        gymClass.archive()
        return gymClassRepository.save(gymClass)
    }

    /**
     * Assigns a default trainer to a gym class.
     */
    fun assignTrainerToGymClass(classId: UUID, trainerId: UUID): GymClass {
        val gymClass = gymClassRepository.findById(classId)
            .orElseThrow { NoSuchElementException("Gym class not found: $classId") }
        gymClass.assignDefaultTrainer(trainerId)
        return gymClassRepository.save(gymClass)
    }

    // ==================== SCHEDULE OPERATIONS ====================

    /**
     * Creates a recurring schedule for a gym class.
     */
    fun createSchedule(command: CreateClassScheduleCommand): ClassSchedule {
        // Verify gym class exists
        if (!gymClassRepository.existsById(command.gymClassId)) {
            throw NoSuchElementException("Gym class not found: ${command.gymClassId}")
        }

        val schedule = ClassSchedule(
            gymClassId = command.gymClassId,
            dayOfWeek = command.dayOfWeek,
            startTime = command.startTime,
            endTime = command.endTime,
            trainerId = command.trainerId,
            effectiveFrom = command.effectiveFrom,
            effectiveUntil = command.effectiveUntil,
            overrideCapacity = command.overrideCapacity
        )
        return scheduleRepository.save(schedule)
    }

    /**
     * Gets a schedule by ID.
     */
    @Transactional(readOnly = true)
    fun getSchedule(id: UUID): ClassSchedule {
        return scheduleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Schedule not found: $id") }
    }

    /**
     * Gets all schedules for a gym class.
     */
    @Transactional(readOnly = true)
    fun getSchedulesByGymClass(gymClassId: UUID): List<ClassSchedule> {
        return scheduleRepository.findByGymClassId(gymClassId)
    }

    /**
     * Gets active schedules for a gym class.
     */
    @Transactional(readOnly = true)
    fun getActiveSchedulesByGymClass(gymClassId: UUID): List<ClassSchedule> {
        return scheduleRepository.findByGymClassIdAndIsActive(gymClassId, true)
    }

    /**
     * Updates a schedule.
     */
    fun updateSchedule(id: UUID, command: UpdateClassScheduleCommand): ClassSchedule {
        val schedule = scheduleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Schedule not found: $id") }

        command.dayOfWeek?.let { schedule.dayOfWeek = it }
        command.startTime?.let { schedule.startTime = it }
        command.endTime?.let { schedule.endTime = it }
        command.trainerId?.let { schedule.trainerId = it }
        command.effectiveFrom?.let { schedule.effectiveFrom = it }
        command.effectiveUntil?.let { schedule.effectiveUntil = it }
        command.overrideCapacity?.let { schedule.overrideCapacity = it }

        return scheduleRepository.save(schedule)
    }

    /**
     * Deactivates a schedule.
     */
    fun deactivateSchedule(id: UUID): ClassSchedule {
        val schedule = scheduleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Schedule not found: $id") }
        schedule.deactivate()
        return scheduleRepository.save(schedule)
    }

    /**
     * Deletes a schedule.
     */
    fun deleteSchedule(id: UUID) {
        if (!scheduleRepository.existsById(id)) {
            throw NoSuchElementException("Schedule not found: $id")
        }
        scheduleRepository.deleteById(id)
    }

    // ==================== SESSION OPERATIONS ====================

    /**
     * Creates a single class session.
     */
    fun createSession(command: CreateClassSessionCommand): ClassSession {
        val gymClass = gymClassRepository.findById(command.gymClassId)
            .orElseThrow { NoSuchElementException("Gym class not found: ${command.gymClassId}") }

        conflictValidator.validateNoConflicts(
            trainerId = command.trainerId ?: gymClass.defaultTrainerId,
            locationId = command.locationId,
            sessionDate = command.sessionDate,
            startTime = command.startTime,
            endTime = command.endTime
        )

        val session = ClassSession(
            gymClassId = command.gymClassId,
            locationId = command.locationId,
            trainerId = command.trainerId ?: gymClass.defaultTrainerId,
            sessionDate = command.sessionDate,
            startTime = command.startTime,
            endTime = command.endTime,
            maxCapacity = command.maxCapacity ?: gymClass.maxCapacity,
            notes = command.notes
        )
        return sessionRepository.save(session)
    }

    /**
     * Gets a session by ID.
     */
    @Transactional(readOnly = true)
    fun getSession(id: UUID): ClassSession {
        return sessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Session not found: $id") }
    }

    /**
     * Gets sessions by gym class.
     */
    @Transactional(readOnly = true)
    fun getSessionsByGymClass(gymClassId: UUID, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findByGymClassId(gymClassId, pageable)
    }

    /**
     * Gets sessions by location.
     */
    @Transactional(readOnly = true)
    fun getSessionsByLocation(locationId: UUID, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findByLocationId(locationId, pageable)
    }

    /**
     * Gets sessions by date.
     */
    @Transactional(readOnly = true)
    fun getSessionsByDate(date: LocalDate, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findBySessionDate(date, pageable)
    }

    /**
     * Gets sessions in a date range.
     */
    @Transactional(readOnly = true)
    fun getSessionsByDateRange(
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<ClassSession> {
        return sessionRepository.findBySessionDateBetween(startDate, endDate, pageable)
    }

    /**
     * Gets upcoming sessions for a gym class.
     */
    @Transactional(readOnly = true)
    fun getUpcomingSessionsByGymClass(gymClassId: UUID, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findUpcomingByGymClassId(gymClassId, LocalDate.now(), pageable)
    }

    /**
     * Gets upcoming sessions at a location.
     */
    @Transactional(readOnly = true)
    fun getUpcomingSessionsByLocation(locationId: UUID, pageable: Pageable): Page<ClassSession> {
        return sessionRepository.findUpcomingByLocationId(locationId, LocalDate.now(), pageable)
    }

    /**
     * Updates a session.
     */
    fun updateSession(id: UUID, command: UpdateClassSessionCommand): ClassSession {
        val session = sessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Session not found: $id") }

        require(session.status == SessionStatus.SCHEDULED) {
            "Can only update scheduled sessions"
        }

        // Validate conflicts using updated values (fall back to existing values)
        conflictValidator.validateNoConflicts(
            trainerId = command.trainerId ?: session.trainerId,
            locationId = command.locationId ?: session.locationId,
            sessionDate = session.sessionDate,
            startTime = command.startTime ?: session.startTime,
            endTime = command.endTime ?: session.endTime,
            excludeSessionId = id
        )

        command.locationId?.let { session.locationId = it }
        command.trainerId?.let { session.trainerId = it }
        command.startTime?.let { session.startTime = it }
        command.endTime?.let { session.endTime = it }
        command.maxCapacity?.let { session.maxCapacity = it }
        command.notes?.let { session.notes = it }

        return sessionRepository.save(session)
    }

    /**
     * Starts a session.
     */
    fun startSession(id: UUID): ClassSession {
        val session = sessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Session not found: $id") }
        session.start()
        return sessionRepository.save(session)
    }

    /**
     * Completes a session.
     */
    fun completeSession(id: UUID): ClassSession {
        val session = sessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Session not found: $id") }
        session.complete()
        val savedSession = sessionRepository.save(session)

        // Complete all bookings and deduct credits
        try {
            val gymClass = gymClassRepository.findById(savedSession.gymClassId).orElse(null)
            if (gymClass != null) {
                val completedCount = bookingService.completeBookingsForSession(savedSession.id, gymClass)
                logger.info("Completed $completedCount bookings for session ${savedSession.id}")

                // Auto-create earnings record for trainer
                if (savedSession.trainerId != null) {
                    try {
                        val durationMinutes = java.time.Duration.between(
                            savedSession.startTime,
                            savedSession.endTime
                        ).toMinutes().toInt()

                        trainerEarningsService.autoCreateEarningForClassSession(
                            sessionId = savedSession.id,
                            trainerId = savedSession.trainerId!!,
                            sessionDate = savedSession.sessionDate,
                            durationMinutes = durationMinutes,
                            attendeeCount = savedSession.currentBookings,
                            pricePerAttendee = gymClass.dropInPrice ?: com.liyaqa.shared.domain.Money(
                                java.math.BigDecimal.ZERO,
                                "SAR"
                            )
                        )
                        logger.info("Earnings record created for class session: ${savedSession.id}")
                    } catch (e: IllegalStateException) {
                        logger.warn("Earnings already exist for session: ${savedSession.id}")
                    } catch (e: Exception) {
                        logger.error("Failed to create earnings for class session ${savedSession.id}: ${e.message}", e)
                    }
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to complete bookings for session ${savedSession.id}: ${e.message}", e)
        }

        return savedSession
    }

    /**
     * Cancels a session and notifies all booked members.
     */
    fun cancelSession(id: UUID, reason: String? = null): ClassSession {
        val session = sessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Session not found: $id") }

        // Get gym class for notification details
        val gymClass = gymClassRepository.findById(session.gymClassId).orElse(null)

        session.cancel(reason)
        val savedSession = sessionRepository.save(session)

        // Notify all booked members (confirmed + waitlist)
        if (gymClass != null) {
            sendSessionCancelledNotifications(savedSession, gymClass, reason)
        }

        return savedSession
    }

    /**
     * Assigns a trainer to a session.
     */
    fun assignTrainerToSession(sessionId: UUID, trainerId: UUID): ClassSession {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { NoSuchElementException("Session not found: $sessionId") }

        conflictValidator.validateNoConflicts(
            trainerId = trainerId,
            locationId = session.locationId,
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            excludeSessionId = sessionId
        )

        session.assignTrainer(trainerId)
        return sessionRepository.save(session)
    }

    /**
     * Deletes a session.
     * Only SCHEDULED or CANCELLED sessions can be deleted.
     * Sessions that have already started or completed cannot be deleted.
     */
    fun deleteSession(id: UUID) {
        val session = sessionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Session not found: $id") }

        require(session.status == SessionStatus.SCHEDULED || session.status == SessionStatus.CANCELLED) {
            "Only scheduled or cancelled sessions can be deleted"
        }

        sessionRepository.deleteById(id)
    }

    // ==================== SESSION GENERATION ====================

    /**
     * Generates sessions from active schedules for a date range.
     * Returns the list of newly created sessions.
     */
    fun generateSessionsFromSchedules(command: GenerateSessionsCommand): List<ClassSession> {
        val createdSessions = mutableListOf<ClassSession>()
        var currentDate = command.fromDate

        while (!currentDate.isAfter(command.toDate)) {
            val activeSchedules = scheduleRepository.findActiveSchedulesForDate(currentDate)
                .filter { schedule ->
                    // Filter by gym class if specified
                    command.gymClassId == null || schedule.gymClassId == command.gymClassId
                }

            for (schedule in activeSchedules) {
                // Check if session already exists for this schedule and date
                if (sessionRepository.existsByScheduleIdAndSessionDate(schedule.id, currentDate)) {
                    continue
                }

                val gymClass = gymClassRepository.findById(schedule.gymClassId).orElse(null)
                if (gymClass == null || !gymClass.isActive()) {
                    continue
                }

                val session = ClassSession.fromSchedule(gymClass, schedule, currentDate)
                try {
                    conflictValidator.validateNoConflicts(
                        trainerId = session.trainerId,
                        locationId = session.locationId,
                        sessionDate = session.sessionDate,
                        startTime = session.startTime,
                        endTime = session.endTime
                    )
                    createdSessions.add(sessionRepository.save(session))
                } catch (e: IllegalStateException) {
                    logger.warn("Skipping session generation for schedule ${schedule.id} on $currentDate: ${e.message}")
                }
            }

            currentDate = currentDate.plusDays(1)
        }

        return createdSessions
    }

    // ==================== NOTIFICATION METHODS ====================

    /**
     * Sends session cancelled notifications to all booked members.
     */
    private fun sendSessionCancelledNotifications(session: ClassSession, gymClass: GymClass, reason: String?) {
        try {
            // Get all confirmed and waitlisted bookings for this session
            val bookings = bookingRepository.findBySessionId(session.id)
                .filter { it.status == BookingStatus.CONFIRMED || it.status == BookingStatus.WAITLISTED }

            if (bookings.isEmpty()) {
                return
            }

            val reasonText = reason ?: "operational reasons"
            val reasonTextAr = reason ?: "أسباب تشغيلية"

            for (booking in bookings) {
                try {
                    val member = memberRepository.findById(booking.memberId).orElse(null) ?: continue

                    val subject = LocalizedText(
                        en = "Class Cancelled - ${gymClass.name.en}",
                        ar = "تم إلغاء الحصة - ${gymClass.name.ar ?: gymClass.name.en}"
                    )
                    val body = LocalizedText(
                        en = """
                            <h2>Class Session Cancelled</h2>
                            <p>Dear ${member.firstName},</p>
                            <p>We regret to inform you that the following class has been cancelled:</p>
                            <p><strong>Class:</strong> ${gymClass.name.en}</p>
                            <p><strong>Date:</strong> ${session.sessionDate.format(dateFormatter)}</p>
                            <p><strong>Time:</strong> ${session.startTime.format(timeFormatter)} - ${session.endTime.format(timeFormatter)}</p>
                            <p><strong>Reason:</strong> $reasonText</p>
                            <p>We apologize for any inconvenience. Please check the schedule for alternative classes.</p>
                            <p>If you had a class deducted for this booking, it will be refunded to your subscription.</p>
                        """.trimIndent(),
                        ar = """
                            <h2>تم إلغاء الحصة</h2>
                            <p>عزيزي ${member.firstName}،</p>
                            <p>نأسف لإبلاغك بإلغاء الحصة التالية:</p>
                            <p><strong>الحصة:</strong> ${gymClass.name.ar ?: gymClass.name.en}</p>
                            <p><strong>التاريخ:</strong> ${session.sessionDate.format(dateFormatter)}</p>
                            <p><strong>الوقت:</strong> ${session.startTime.format(timeFormatter)} - ${session.endTime.format(timeFormatter)}</p>
                            <p><strong>السبب:</strong> $reasonTextAr</p>
                            <p>نعتذر عن أي إزعاج. يرجى مراجعة الجدول للحصص البديلة.</p>
                            <p>إذا تم خصم حصة من اشتراكك لهذا الحجز، سيتم إعادتها.</p>
                        """.trimIndent()
                    )

                    notificationService.sendMultiChannelIfNotDuplicate(
                        memberId = member.id,
                        email = member.email,
                        phone = member.phone,
                        type = NotificationType.CLASS_SESSION_CANCELLED,
                        subject = subject,
                        body = body,
                        priority = NotificationPriority.HIGH,
                        referenceId = session.id,
                        referenceType = "class_session"
                    )
                } catch (e: Exception) {
                    logger.error("Failed to send session cancelled notification to member ${booking.memberId}: ${e.message}", e)
                }
            }

            logger.info("Sent session cancelled notifications to ${bookings.size} members for session ${session.id}")
        } catch (e: Exception) {
            logger.error("Failed to send session cancelled notifications: ${e.message}", e)
        }
    }
}
