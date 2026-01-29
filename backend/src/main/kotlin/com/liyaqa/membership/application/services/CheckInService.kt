package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.CheckInMethod
import com.liyaqa.membership.domain.model.MemberCheckIn
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberCheckInRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

data class CheckInResult(
    val checkIn: MemberCheckIn,
    val memberName: String,
    val memberStatus: MemberStatus,
    val subscriptionStatus: SubscriptionStatus?,
    val subscriptionEndDate: LocalDate?,
    val warnings: List<String>
)

data class CheckInValidation(
    val canCheckIn: Boolean,
    val reason: String?,
    val warnings: List<String>
)

data class VisitStats(
    val totalVisits: Long,
    val visitsThisMonth: Long,
    val visitsThisWeek: Long,
    val lastVisit: Instant?,
    val averageVisitsPerWeek: Double,
    val longestStreak: Int,
    val currentStreak: Int
)

@Service
@Transactional
class CheckInService(
    private val checkInRepository: MemberCheckInRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository
) {
    private val logger = LoggerFactory.getLogger(CheckInService::class.java)

    /**
     * Validates if a member can check in.
     */
    @Transactional(readOnly = true)
    fun validateCheckIn(memberId: UUID): CheckInValidation {
        val member = memberRepository.findById(memberId).orElse(null)
            ?: return CheckInValidation(false, "Member not found", emptyList())

        val warnings = mutableListOf<String>()

        // Check member status
        when (member.status) {
            MemberStatus.SUSPENDED -> return CheckInValidation(false, "Member account is suspended", emptyList())
            MemberStatus.CANCELLED -> return CheckInValidation(false, "Member account is cancelled", emptyList())
            MemberStatus.FROZEN -> return CheckInValidation(false, "Member account is frozen", emptyList())
            MemberStatus.PENDING -> return CheckInValidation(false, "Member account is pending activation", emptyList())
            MemberStatus.ACTIVE -> { /* OK */ }
        }

        // Check subscription
        val subscription = subscriptionRepository.findActiveByMemberId(memberId).orElse(null)
        if (subscription == null) {
            return CheckInValidation(false, "No active subscription found", emptyList())
        }

        // Check subscription status
        if (!subscription.allowsAccess()) {
            return CheckInValidation(false, "Subscription does not allow access (status: ${subscription.status})", emptyList())
        }

        // Check if subscription is expired
        if (subscription.isExpired()) {
            return CheckInValidation(false, "Subscription has expired", emptyList())
        }

        // Add warnings for near-expiry or payment issues
        val daysRemaining = subscription.daysRemaining()
        if (daysRemaining <= 7) {
            warnings.add("Subscription expires in $daysRemaining days")
        }

        if (subscription.status == SubscriptionStatus.PAST_DUE) {
            warnings.add("Payment is overdue")
        }

        // Check if already checked in today
        val today = LocalDate.now()
        val startOfDay = today.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endOfDay = today.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        if (checkInRepository.existsByMemberIdAndCheckInTimeBetween(memberId, startOfDay, endOfDay)) {
            warnings.add("Member has already checked in today")
        }

        return CheckInValidation(true, null, warnings)
    }

    /**
     * Performs a check-in for a member.
     */
    fun checkIn(
        memberId: UUID,
        method: CheckInMethod,
        deviceId: String? = null,
        location: String? = null,
        staffUserId: UUID? = null,
        notes: String? = null
    ): CheckInResult {
        val validation = validateCheckIn(memberId)
        require(validation.canCheckIn) { validation.reason ?: "Cannot check in" }

        val member = memberRepository.findById(memberId).orElseThrow {
            NoSuchElementException("Member not found: $memberId")
        }

        val subscription = subscriptionRepository.findActiveByMemberId(memberId).orElse(null)

        val checkIn = MemberCheckIn(
            memberId = memberId,
            checkInTime = Instant.now(),
            method = method,
            deviceId = deviceId,
            location = location,
            processedByUserId = staffUserId,
            notes = notes
        )

        val savedCheckIn = checkInRepository.save(checkIn)
        logger.info("Member ${member.id} checked in via $method at ${savedCheckIn.checkInTime}")

        return CheckInResult(
            checkIn = savedCheckIn,
            memberName = member.fullName.en,
            memberStatus = member.status,
            subscriptionStatus = subscription?.status,
            subscriptionEndDate = subscription?.endDate,
            warnings = validation.warnings
        )
    }

    /**
     * Records a check-out for an active check-in.
     */
    fun checkOut(checkInId: UUID): MemberCheckIn {
        val checkIn = checkInRepository.findById(checkInId).orElseThrow {
            NoSuchElementException("Check-in not found: $checkInId")
        }

        checkIn.checkOut()
        val savedCheckIn = checkInRepository.save(checkIn)

        logger.info("Member ${checkIn.memberId} checked out. Duration: ${savedCheckIn.getFormattedDuration()}")
        return savedCheckIn
    }

    /**
     * Records a check-out for a member's active check-in session.
     */
    fun checkOutByMemberId(memberId: UUID): MemberCheckIn {
        val checkIn = checkInRepository.findActiveCheckIn(memberId).orElseThrow {
            NoSuchElementException("No active check-in found for member: $memberId")
        }

        checkIn.checkOut()
        val savedCheckIn = checkInRepository.save(checkIn)

        logger.info("Member $memberId checked out. Duration: ${savedCheckIn.getFormattedDuration()}")
        return savedCheckIn
    }

    /**
     * Gets check-in history for a member.
     */
    @Transactional(readOnly = true)
    fun getCheckInHistory(memberId: UUID, pageable: Pageable): Page<MemberCheckIn> {
        return checkInRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets check-in history for a member within a date range.
     */
    @Transactional(readOnly = true)
    fun getCheckInHistory(
        memberId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<MemberCheckIn> {
        val startTime = startDate.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endTime = endDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return checkInRepository.findByMemberIdAndDateRange(memberId, startTime, endTime, pageable)
    }

    /**
     * Gets today's check-ins for the dashboard.
     */
    @Transactional(readOnly = true)
    fun getTodayCheckIns(pageable: Pageable): Page<MemberCheckIn> {
        return checkInRepository.findTodayCheckIns(pageable)
    }

    /**
     * Gets check-ins for a specific date.
     */
    @Transactional(readOnly = true)
    fun getCheckInsByDate(date: LocalDate, pageable: Pageable): Page<MemberCheckIn> {
        return checkInRepository.findTodayCheckInsByDate(date, pageable)
    }

    /**
     * Gets today's check-in count.
     */
    @Transactional(readOnly = true)
    fun getTodayCheckInCount(): Long {
        return checkInRepository.countTodayCheckIns()
    }

    /**
     * Gets visit statistics for a member.
     */
    @Transactional(readOnly = true)
    fun getVisitStats(memberId: UUID): VisitStats {
        val totalVisits = checkInRepository.countByMemberId(memberId)

        val now = LocalDate.now()
        val startOfMonth = now.withDayOfMonth(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        val startOfWeek = now.minusDays(now.dayOfWeek.value.toLong() - 1).atStartOfDay().toInstant(ZoneOffset.UTC)
        val endTime = Instant.now()

        val visitsThisMonth = checkInRepository.countByMemberIdAndDateRange(memberId, startOfMonth, endTime)
        val visitsThisWeek = checkInRepository.countByMemberIdAndDateRange(memberId, startOfWeek, endTime)
        val lastCheckIn = checkInRepository.findLastCheckIn(memberId).orElse(null)
        val averageVisitsPerWeek = checkInRepository.getAverageVisitsPerWeek(memberId, 12)

        return VisitStats(
            totalVisits = totalVisits,
            visitsThisMonth = visitsThisMonth,
            visitsThisWeek = visitsThisWeek,
            lastVisit = lastCheckIn?.checkInTime,
            averageVisitsPerWeek = averageVisitsPerWeek,
            longestStreak = 0, // TODO: Calculate streak
            currentStreak = 0  // TODO: Calculate streak
        )
    }

    /**
     * Gets a member's active check-in session if any.
     */
    @Transactional(readOnly = true)
    fun getActiveCheckIn(memberId: UUID): MemberCheckIn? {
        return checkInRepository.findActiveCheckIn(memberId).orElse(null)
    }

    /**
     * Gets check-in hour distribution for heatmap.
     */
    @Transactional(readOnly = true)
    fun getCheckInHourDistribution(startDate: LocalDate, endDate: LocalDate): Map<Int, Long> {
        val startTime = startDate.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endTime = endDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return checkInRepository.getCheckInHourDistribution(startTime, endTime)
    }

    /**
     * Gets check-in day of week distribution.
     */
    @Transactional(readOnly = true)
    fun getCheckInDayDistribution(startDate: LocalDate, endDate: LocalDate): Map<Int, Long> {
        val startTime = startDate.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endTime = endDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return checkInRepository.getCheckInDayDistribution(startTime, endTime)
    }
}
