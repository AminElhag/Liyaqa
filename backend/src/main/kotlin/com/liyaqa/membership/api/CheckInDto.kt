package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.CheckInResult
import com.liyaqa.membership.application.services.CheckInValidation
import com.liyaqa.membership.application.services.VisitStats
import com.liyaqa.membership.domain.model.CheckInMethod
import com.liyaqa.membership.domain.model.MemberCheckIn
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CheckInRequest(
    @field:NotNull(message = "Method is required")
    val method: CheckInMethod,

    val deviceId: String? = null,
    val location: String? = null,
    val notes: String? = null
)

data class CheckInByIdentifierRequest(
    @field:NotNull(message = "Method is required")
    val method: CheckInMethod,

    val identifier: String? = null,
    val memberId: UUID? = null,
    val deviceId: String? = null,
    val location: String? = null,
    val notes: String? = null
)

data class CheckInResponse(
    val id: UUID,
    val memberId: UUID,
    val memberName: String,
    val memberStatus: MemberStatus,
    val subscriptionStatus: SubscriptionStatus?,
    val subscriptionEndDate: LocalDate?,
    val checkInTime: Instant,
    val checkOutTime: Instant?,
    val method: CheckInMethod,
    val deviceId: String?,
    val location: String?,
    val processedByUserId: UUID?,
    val notes: String?,
    val duration: String?,
    val warnings: List<String>,
    val createdAt: Instant
) {
    companion object {
        fun from(result: CheckInResult): CheckInResponse = CheckInResponse(
            id = result.checkIn.id,
            memberId = result.checkIn.memberId,
            memberName = result.memberName,
            memberStatus = result.memberStatus,
            subscriptionStatus = result.subscriptionStatus,
            subscriptionEndDate = result.subscriptionEndDate,
            checkInTime = result.checkIn.checkInTime,
            checkOutTime = result.checkIn.checkOutTime,
            method = result.checkIn.method,
            deviceId = result.checkIn.deviceId,
            location = result.checkIn.location,
            processedByUserId = result.checkIn.processedByUserId,
            notes = result.checkIn.notes,
            duration = result.checkIn.getFormattedDuration(),
            warnings = result.warnings,
            createdAt = result.checkIn.createdAt
        )

        fun from(checkIn: MemberCheckIn, memberName: String = ""): CheckInResponse = CheckInResponse(
            id = checkIn.id,
            memberId = checkIn.memberId,
            memberName = memberName,
            memberStatus = MemberStatus.ACTIVE,
            subscriptionStatus = null,
            subscriptionEndDate = null,
            checkInTime = checkIn.checkInTime,
            checkOutTime = checkIn.checkOutTime,
            method = checkIn.method,
            deviceId = checkIn.deviceId,
            location = checkIn.location,
            processedByUserId = checkIn.processedByUserId,
            notes = checkIn.notes,
            duration = checkIn.getFormattedDuration(),
            warnings = emptyList(),
            createdAt = checkIn.createdAt
        )
    }
}

data class CheckInHistoryResponse(
    val id: UUID,
    val memberId: UUID,
    val checkInTime: Instant,
    val checkOutTime: Instant?,
    val method: CheckInMethod,
    val deviceId: String?,
    val location: String?,
    val processedByUserId: UUID?,
    val notes: String?,
    val duration: String?,
    val isCheckedOut: Boolean
) {
    companion object {
        fun from(checkIn: MemberCheckIn): CheckInHistoryResponse = CheckInHistoryResponse(
            id = checkIn.id,
            memberId = checkIn.memberId,
            checkInTime = checkIn.checkInTime,
            checkOutTime = checkIn.checkOutTime,
            method = checkIn.method,
            deviceId = checkIn.deviceId,
            location = checkIn.location,
            processedByUserId = checkIn.processedByUserId,
            notes = checkIn.notes,
            duration = checkIn.getFormattedDuration(),
            isCheckedOut = checkIn.isCheckedOut()
        )
    }
}

data class CheckInValidationResponse(
    val canCheckIn: Boolean,
    val reason: String?,
    val warnings: List<String>
) {
    companion object {
        fun from(validation: CheckInValidation): CheckInValidationResponse = CheckInValidationResponse(
            canCheckIn = validation.canCheckIn,
            reason = validation.reason,
            warnings = validation.warnings
        )
    }
}

data class VisitStatsResponse(
    val totalVisits: Long,
    val visitsThisMonth: Long,
    val visitsThisWeek: Long,
    val lastVisit: Instant?,
    val averageVisitsPerWeek: Double,
    val longestStreak: Int,
    val currentStreak: Int
) {
    companion object {
        fun from(stats: VisitStats): VisitStatsResponse = VisitStatsResponse(
            totalVisits = stats.totalVisits,
            visitsThisMonth = stats.visitsThisMonth,
            visitsThisWeek = stats.visitsThisWeek,
            lastVisit = stats.lastVisit,
            averageVisitsPerWeek = stats.averageVisitsPerWeek,
            longestStreak = stats.longestStreak,
            currentStreak = stats.currentStreak
        )
    }
}

data class CheckInHeatmapResponse(
    val hourDistribution: Map<Int, Long>,
    val dayDistribution: Map<Int, Long>,
    val startDate: LocalDate,
    val endDate: LocalDate
)

data class TodayCheckInsResponse(
    val totalCheckIns: Long,
    val checkIns: List<TodayCheckInItem>
)

data class TodayCheckInItem(
    val id: UUID,
    val memberId: UUID,
    val memberName: String,
    val memberPhoto: String?,
    val checkInTime: Instant,
    val checkOutTime: Instant?,
    val method: CheckInMethod,
    val isCheckedOut: Boolean,
    val duration: String?
)
