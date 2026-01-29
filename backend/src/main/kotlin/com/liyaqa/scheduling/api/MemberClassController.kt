package com.liyaqa.scheduling.api

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.scheduling.application.services.BookingOptionsResponse
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.application.services.ClassPackBookingOption
import com.liyaqa.scheduling.application.services.ClassPackService
import com.liyaqa.scheduling.application.services.ClassService
import com.liyaqa.scheduling.application.services.CreateBookingWithPaymentCommand
import com.liyaqa.scheduling.application.services.MembershipBookingOption
import com.liyaqa.scheduling.application.services.PayPerEntryOption
import com.liyaqa.scheduling.domain.model.BookingPaymentSource
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.api.PageResponse
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Member portal API for class discovery and booking.
 * All endpoints are relative to the authenticated member.
 */
@RestController
@RequestMapping("/api/me")
class MemberClassController(
    private val gymClassRepository: GymClassRepository,
    private val sessionRepository: ClassSessionRepository,
    private val classService: ClassService,
    private val bookingService: BookingService,
    private val classPackService: ClassPackService
) {

    // ==================== CLASS DISCOVERY ====================

    /**
     * Browse all active classes available for booking.
     */
    @GetMapping("/classes")
    fun browseClasses(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam classType: String? = null,
        @RequestParam difficultyLevel: String? = null,
        @RequestParam search: String? = null,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<PageResponse<MemberClassResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("sortOrder", "name_en"))

        // Get all active classes
        val classesPage = gymClassRepository.findByStatus(GymClassStatus.ACTIVE, pageable)

        // Apply filters
        val filteredContent = classesPage.content
            .filter { classType == null || it.classType.name == classType }
            .filter { difficultyLevel == null || it.difficultyLevel.name == difficultyLevel }
            .filter { search == null || it.name.en.contains(search, ignoreCase = true) || it.name.ar?.contains(search, ignoreCase = true) == true }

        return ResponseEntity.ok(
            PageResponse(
                content = filteredContent.map { MemberClassResponse.from(it) },
                page = classesPage.number,
                size = classesPage.size,
                totalElements = filteredContent.size.toLong(),
                totalPages = classesPage.totalPages,
                first = classesPage.isFirst,
                last = classesPage.isLast
            )
        )
    }

    /**
     * Get a specific class details.
     */
    @GetMapping("/classes/{id}")
    fun getClassDetails(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MemberClassDetailResponse> {
        val gymClass = gymClassRepository.findById(id)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        // Get upcoming sessions for this class
        val pageable = PageRequest.of(0, 10, Sort.by("sessionDate", "startTime"))
        val upcomingSessions = sessionRepository.findUpcomingByGymClassId(gymClass.id, LocalDate.now(), pageable)
            .content
            .filter { it.status == SessionStatus.SCHEDULED }

        // Get schedules
        val schedules = classService.getActiveSchedulesByGymClass(gymClass.id)

        return ResponseEntity.ok(
            MemberClassDetailResponse.from(gymClass, upcomingSessions, schedules)
        )
    }

    // ==================== TIMETABLE ====================

    /**
     * Get weekly timetable from a specific date.
     */
    @GetMapping("/timetable")
    fun getWeeklyTimetable(
        @RequestParam(required = false) date: LocalDate?,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<TimetableResponse> {
        val startDate = date ?: LocalDate.now()
        val endDate = startDate.plusDays(6)

        val pageable = PageRequest.of(0, 200, Sort.by("sessionDate", "startTime"))
        val sessions = sessionRepository.findBySessionDateBetween(startDate, endDate, pageable)
            .content
            .filter { it.status == SessionStatus.SCHEDULED }

        // Get member's bookings for these sessions
        val memberId = principal.userId
        val bookedSessionIds = sessions
            .filter { bookingService.hasMemberBookedSession(it.id, memberId) }
            .map { it.id }
            .toSet()

        // Group by date
        val sessionsByDate = sessions.groupBy { it.sessionDate }

        // Get class info for each session
        val classMap = sessions.map { it.gymClassId }.distinct()
            .mapNotNull { gymClassRepository.findById(it).orElse(null) }
            .associateBy { it.id }

        val days = (0..6).map { offset ->
            val dayDate = startDate.plusDays(offset.toLong())
            val daySessions = sessionsByDate[dayDate] ?: emptyList()

            TimetableDayResponse(
                date = dayDate,
                dayOfWeek = dayDate.dayOfWeek.name,
                sessions = daySessions.map { session ->
                    val gymClass = classMap[session.gymClassId]
                    TimetableSessionResponse.from(
                        session = session,
                        gymClass = gymClass,
                        isBooked = session.id in bookedSessionIds
                    )
                }
            )
        }

        return ResponseEntity.ok(
            TimetableResponse(
                startDate = startDate,
                endDate = endDate,
                days = days
            )
        )
    }

    // ==================== SESSIONS ====================

    /**
     * Get available sessions in a date range.
     */
    @GetMapping("/sessions")
    fun getAvailableSessions(
        @RequestParam from: LocalDate,
        @RequestParam to: LocalDate,
        @RequestParam(required = false) classId: UUID?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<PageResponse<MemberSessionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("sessionDate", "startTime"))

        val sessions = if (classId != null) {
            sessionRepository.findByGymClassIdAndSessionDate(classId, from)
        } else {
            sessionRepository.findBySessionDateBetween(from, to, pageable).content
        }.filter { it.status == SessionStatus.SCHEDULED }

        val memberId = principal.userId
        val classMap = sessions.map { it.gymClassId }.distinct()
            .mapNotNull { gymClassRepository.findById(it).orElse(null) }
            .associateBy { it.id }

        val responses = sessions.map { session ->
            val gymClass = classMap[session.gymClassId]
            val isBooked = bookingService.hasMemberBookedSession(session.id, memberId)
            MemberSessionResponse.from(session, gymClass, isBooked)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = responses,
                page = page,
                size = size,
                totalElements = responses.size.toLong(),
                totalPages = 1,
                first = true,
                last = true
            )
        )
    }

    /**
     * Get booking options for a specific session.
     * Returns available payment methods for the authenticated member.
     */
    @GetMapping("/sessions/{sessionId}/booking-options")
    fun getBookingOptions(
        @PathVariable sessionId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MemberBookingOptionsResponse> {
        val memberId = principal.userId
        val options = bookingService.getBookingOptions(sessionId, memberId)
        return ResponseEntity.ok(MemberBookingOptionsResponse.from(options))
    }

    /**
     * Book a session with a specific payment source.
     */
    @PostMapping("/sessions/{sessionId}/book")
    fun bookSession(
        @PathVariable sessionId: UUID,
        @Valid @RequestBody request: BookSessionRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ClassBookingResponse> {
        val memberId = principal.userId

        val booking = bookingService.createBookingWithPayment(
            CreateBookingWithPaymentCommand(
                sessionId = sessionId,
                memberId = memberId,
                paymentSource = request.paymentSource,
                classPackBalanceId = request.classPackBalanceId,
                orderId = request.orderId,
                paidAmount = request.paidAmount?.let { Money.of(it.amount, it.currency) },
                notes = request.notes
            )
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(ClassBookingResponse.from(booking))
    }

    // ==================== CLASS PACKS ====================

    /**
     * Get member's active class pack balances.
     */
    @GetMapping("/class-packs")
    fun getMyClassPacks(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<List<MemberClassPackBalanceResponse>> {
        val memberId = principal.userId
        val balances = classPackService.getActiveMemberBalances(memberId)

        val responses = balances.map { balance ->
            val pack = classPackService.getClassPack(balance.classPackId)
            MemberClassPackBalanceResponse.from(balance, pack.name)
        }

        return ResponseEntity.ok(responses)
    }

    /**
     * Get available class packs for purchase.
     */
    @GetMapping("/class-packs/available")
    fun getAvailableClassPacks(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<List<ClassPackResponse>> {
        val packs = classPackService.getActiveClassPacks()
        return ResponseEntity.ok(packs.map { ClassPackResponse.from(it) })
    }

    /**
     * Get total remaining credits across all class packs.
     */
    @GetMapping("/class-packs/credits")
    fun getTotalCredits(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<TotalCreditsResponse> {
        val memberId = principal.userId
        val totalCredits = classPackService.getTotalRemainingCredits(memberId)
        return ResponseEntity.ok(TotalCreditsResponse(totalCredits))
    }
}

// ==================== REQUEST DTOS ====================

data class BookSessionRequest(
    val paymentSource: BookingPaymentSource,
    val classPackBalanceId: UUID? = null,
    val orderId: UUID? = null,
    val paidAmount: MoneyInput? = null,
    val notes: String? = null
)

data class MoneyInput(
    val amount: BigDecimal,
    val currency: String = "SAR"
)

// ==================== RESPONSE DTOS ====================

data class MemberClassResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val classType: String,
    val difficultyLevel: String,
    val durationMinutes: Int,
    val colorCode: String?,
    val imageUrl: String?,
    val pricingModel: String,
    val dropInPrice: MoneyResponse?,
    val maxCapacity: Int
) {
    companion object {
        fun from(gymClass: GymClass) = MemberClassResponse(
            id = gymClass.id,
            name = LocalizedTextResponse(gymClass.name.en, gymClass.name.ar),
            description = gymClass.description?.let { LocalizedTextResponse(it.en, it.ar) },
            classType = gymClass.classType.name,
            difficultyLevel = gymClass.difficultyLevel.name,
            durationMinutes = gymClass.durationMinutes,
            colorCode = gymClass.colorCode,
            imageUrl = gymClass.imageUrl,
            pricingModel = gymClass.pricingModel.name,
            dropInPrice = gymClass.dropInPrice?.let { MoneyResponse(it.amount, it.currency) },
            maxCapacity = gymClass.maxCapacity
        )
    }
}

data class MemberClassDetailResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val classType: String,
    val difficultyLevel: String,
    val durationMinutes: Int,
    val colorCode: String?,
    val imageUrl: String?,
    val pricingModel: String,
    val dropInPrice: MoneyResponse?,
    val dropInPriceWithTax: MoneyResponse?,
    val taxRate: BigDecimal?,
    val maxCapacity: Int,
    val advanceBookingDays: Int,
    val cancellationDeadlineHours: Int,
    val upcomingSessions: List<MemberSessionResponse>,
    val weeklySchedule: List<ScheduleSlotResponse>
) {
    companion object {
        fun from(
            gymClass: GymClass,
            upcomingSessions: List<ClassSession>,
            schedules: List<com.liyaqa.scheduling.domain.model.ClassSchedule>
        ) = MemberClassDetailResponse(
            id = gymClass.id,
            name = LocalizedTextResponse(gymClass.name.en, gymClass.name.ar),
            description = gymClass.description?.let { LocalizedTextResponse(it.en, it.ar) },
            classType = gymClass.classType.name,
            difficultyLevel = gymClass.difficultyLevel.name,
            durationMinutes = gymClass.durationMinutes,
            colorCode = gymClass.colorCode,
            imageUrl = gymClass.imageUrl,
            pricingModel = gymClass.pricingModel.name,
            dropInPrice = gymClass.dropInPrice?.let { MoneyResponse(it.amount, it.currency) },
            dropInPriceWithTax = gymClass.getDropInPriceWithTax()?.let { MoneyResponse(it.amount, it.currency) },
            taxRate = gymClass.taxRate,
            maxCapacity = gymClass.maxCapacity,
            advanceBookingDays = gymClass.advanceBookingDays,
            cancellationDeadlineHours = gymClass.cancellationDeadlineHours,
            upcomingSessions = upcomingSessions.map { MemberSessionResponse.from(it, gymClass, false) },
            weeklySchedule = schedules.map { ScheduleSlotResponse.from(it) }
        )
    }
}

data class ScheduleSlotResponse(
    val dayOfWeek: String,
    val startTime: LocalTime,
    val endTime: LocalTime
) {
    companion object {
        fun from(schedule: com.liyaqa.scheduling.domain.model.ClassSchedule) = ScheduleSlotResponse(
            dayOfWeek = schedule.dayOfWeek.name,
            startTime = schedule.startTime,
            endTime = schedule.endTime
        )
    }
}

data class MemberSessionResponse(
    val id: UUID,
    val gymClassId: UUID,
    val className: LocalizedTextResponse?,
    val classType: String?,
    val difficultyLevel: String?,
    val colorCode: String?,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val durationMinutes: Int,
    val maxCapacity: Int,
    val availableSpots: Int,
    val isBooked: Boolean,
    val isFull: Boolean,
    val waitlistAvailable: Boolean
) {
    companion object {
        fun from(session: ClassSession, gymClass: GymClass?, isBooked: Boolean) = MemberSessionResponse(
            id = session.id,
            gymClassId = session.gymClassId,
            className = gymClass?.let { LocalizedTextResponse(it.name.en, it.name.ar) },
            classType = gymClass?.classType?.name,
            difficultyLevel = gymClass?.difficultyLevel?.name,
            colorCode = gymClass?.colorCode,
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            durationMinutes = session.durationMinutes(),
            maxCapacity = session.maxCapacity,
            availableSpots = session.availableSpots(),
            isBooked = isBooked,
            isFull = !session.hasAvailableSpots(),
            waitlistAvailable = gymClass?.waitlistEnabled == true && session.canJoinWaitlist(gymClass.maxWaitlistSize)
        )
    }
}

data class TimetableResponse(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val days: List<TimetableDayResponse>
)

data class TimetableDayResponse(
    val date: LocalDate,
    val dayOfWeek: String,
    val sessions: List<TimetableSessionResponse>
)

data class TimetableSessionResponse(
    val id: UUID,
    val className: LocalizedTextResponse?,
    val classType: String?,
    val colorCode: String?,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val availableSpots: Int,
    val isBooked: Boolean,
    val isFull: Boolean
) {
    companion object {
        fun from(session: ClassSession, gymClass: GymClass?, isBooked: Boolean) = TimetableSessionResponse(
            id = session.id,
            className = gymClass?.let { LocalizedTextResponse(it.name.en, it.name.ar) },
            classType = gymClass?.classType?.name,
            colorCode = gymClass?.colorCode,
            startTime = session.startTime,
            endTime = session.endTime,
            availableSpots = session.availableSpots(),
            isBooked = isBooked,
            isFull = !session.hasAvailableSpots()
        )
    }
}

data class MemberBookingOptionsResponse(
    val sessionId: UUID,
    val canBook: Boolean,
    val reason: String?,
    val membershipOption: MembershipOptionResponse?,
    val classPackOptions: List<ClassPackOptionResponse>,
    val payPerEntryOption: PayPerEntryOptionResponse?
) {
    companion object {
        fun from(options: BookingOptionsResponse) = MemberBookingOptionsResponse(
            sessionId = options.sessionId,
            canBook = options.canBook,
            reason = options.reason,
            membershipOption = options.membershipOption?.let { MembershipOptionResponse.from(it) },
            classPackOptions = options.classPackOptions.map { ClassPackOptionResponse.from(it) },
            payPerEntryOption = options.payPerEntryOption?.let { PayPerEntryOptionResponse.from(it) }
        )
    }
}

data class MembershipOptionResponse(
    val available: Boolean,
    val classesRemaining: Int?,
    val reason: String?
) {
    companion object {
        fun from(option: MembershipBookingOption) = MembershipOptionResponse(
            available = option.available,
            classesRemaining = option.classesRemaining,
            reason = option.reason
        )
    }
}

data class ClassPackOptionResponse(
    val balanceId: UUID,
    val packName: LocalizedTextResponse,
    val classesRemaining: Int,
    val expiresAt: Instant?
) {
    companion object {
        fun from(option: ClassPackBookingOption) = ClassPackOptionResponse(
            balanceId = option.balanceId,
            packName = LocalizedTextResponse(option.packName.en, option.packName.ar),
            classesRemaining = option.classesRemaining,
            expiresAt = option.expiresAt
        )
    }
}

data class PayPerEntryOptionResponse(
    val available: Boolean,
    val price: MoneyResponse,
    val taxRate: BigDecimal,
    val totalWithTax: MoneyResponse
) {
    companion object {
        fun from(option: PayPerEntryOption) = PayPerEntryOptionResponse(
            available = option.available,
            price = MoneyResponse(option.price.amount, option.price.currency),
            taxRate = option.taxRate,
            totalWithTax = MoneyResponse(option.totalWithTax.amount, option.totalWithTax.currency)
        )
    }
}

data class TotalCreditsResponse(
    val totalCredits: Int
)
