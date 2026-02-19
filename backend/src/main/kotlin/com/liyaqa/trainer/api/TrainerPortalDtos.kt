package com.liyaqa.trainer.api

import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.domain.model.*
import jakarta.validation.Valid
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

// ==================== CLIENT MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer client.
 */
data class TrainerClientResponse(
    val id: UUID,
    val trainerId: UUID,
    val memberId: UUID,
    val memberName: String?,
    val memberEmail: String?,
    val memberPhone: String?,
    val status: TrainerClientStatus,
    val startDate: LocalDate,
    val endDate: LocalDate?,
    val completedSessions: Int,
    val cancelledSessions: Int,
    val noShowSessions: Int,
    val goalsEn: String?,
    val goalsAr: String?,
    val notesEn: String?,
    val notesAr: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            client: com.liyaqa.trainer.domain.model.TrainerClient,
            memberName: String? = null,
            memberEmail: String? = null,
            memberPhone: String? = null
        ): TrainerClientResponse = TrainerClientResponse(
            id = client.id,
            trainerId = client.trainerId,
            memberId = client.memberId,
            memberName = memberName,
            memberEmail = memberEmail,
            memberPhone = memberPhone,
            status = client.status,
            startDate = client.startDate,
            endDate = client.endDate,
            completedSessions = client.completedSessions,
            cancelledSessions = client.cancelledSessions,
            noShowSessions = client.noShowSessions,
            goalsEn = client.goalsEn,
            goalsAr = client.goalsAr,
            notesEn = client.notesEn,
            notesAr = client.notesAr,
            createdAt = client.createdAt,
            updatedAt = client.updatedAt
        )
    }
}

/**
 * Request to update trainer client information.
 */
data class UpdateTrainerClientRequest(
    val goalsEn: String? = null,
    val goalsAr: String? = null,
    val notesEn: String? = null,
    val notesAr: String? = null,
    val status: TrainerClientStatus? = null
)

// ==================== EARNINGS MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer earnings.
 */
data class TrainerEarningsResponse(
    val id: UUID,
    val trainerId: UUID,
    val earningType: EarningType,
    val sessionId: UUID?,
    val earningDate: LocalDate,
    val amount: Money,
    val deductions: Money?,
    val netAmount: Money,
    val status: EarningStatus,
    val paymentDate: LocalDate?,
    val paymentReference: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(earning: com.liyaqa.trainer.domain.model.TrainerEarnings): TrainerEarningsResponse =
            TrainerEarningsResponse(
                id = earning.id,
                trainerId = earning.trainerId,
                earningType = earning.earningType,
                sessionId = earning.sessionId,
                earningDate = earning.earningDate,
                amount = earning.amount,
                deductions = earning.deductions,
                netAmount = earning.netAmount,
                status = earning.status,
                paymentDate = earning.paymentDate,
                paymentReference = earning.paymentReference,
                createdAt = earning.createdAt,
                updatedAt = earning.updatedAt
            )
    }
}

/**
 * Summary response for earnings statistics.
 */
data class EarningsSummaryResponse(
    val totalEarnings: Money,
    val pendingEarnings: Money,
    val approvedEarnings: Money,
    val paidEarnings: Money,
    val currentMonthEarnings: Money,
    val lastMonthEarnings: Money,
    val earningsByType: Map<EarningType, Money>,
    val recentEarnings: List<TrainerEarningsResponse>
)

/**
 * Request to update earning status (admin only).
 */
data class UpdateEarningStatusRequest(
    @field:NotNull(message = "Status is required")
    val status: EarningStatus,

    val paymentDate: LocalDate? = null,

    val notes: String? = null
)

// ==================== NOTIFICATION MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer notification.
 */
data class TrainerNotificationResponse(
    val id: UUID,
    val trainerId: UUID,
    val notificationType: NotificationType,
    val titleEn: String,
    val titleAr: String,
    val messageEn: String?,
    val messageAr: String?,
    val isRead: Boolean,
    val relatedEntityId: UUID?,
    val createdAt: Instant,
    val readAt: Instant?
) {
    companion object {
        fun from(notification: com.liyaqa.trainer.domain.model.TrainerNotification): TrainerNotificationResponse =
            TrainerNotificationResponse(
                id = notification.id,
                trainerId = notification.trainerId,
                notificationType = notification.notificationType,
                titleEn = notification.titleEn,
                titleAr = notification.titleAr,
                messageEn = notification.messageEn,
                messageAr = notification.messageAr,
                isRead = notification.isRead,
                relatedEntityId = notification.relatedEntityId,
                createdAt = notification.createdAt,
                readAt = notification.readAt
            )
    }
}

/**
 * Request to mark notifications as read.
 */
data class MarkNotificationsReadRequest(
    @field:NotEmpty(message = "Notification IDs are required")
    val notificationIds: List<UUID>
)

// ==================== SCHEDULE MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer schedule.
 */
data class TrainerScheduleResponse(
    val trainerId: UUID,
    val availability: AvailabilityResponse?,
    val upcomingSessions: List<UpcomingSessionResponse>,
    val unavailableDates: List<LocalDate>
)

/**
 * Request to update trainer availability.
 * Uses AvailabilityInput from TrainerDtos.kt
 */
data class UpdateAvailabilityRequest(
    @field:Valid
    @field:NotNull(message = "Availability is required")
    val availability: AvailabilityInput
)

/**
 * Response DTO for upcoming session.
 */
data class UpcomingSessionResponse(
    val sessionId: UUID,
    val sessionType: String, // "PT" or "CLASS"
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val clientName: String?,
    val className: String?,
    val location: String?,
    val status: String
)

// ==================== CERTIFICATION MANAGEMENT DTOs ====================

/**
 * Response DTO for trainer certification.
 */
data class TrainerCertificationResponse(
    val id: UUID,
    val trainerId: UUID,
    val nameEn: String,
    val nameAr: String,
    val issuingOrganization: String,
    val issuedDate: LocalDate?,
    val expiryDate: LocalDate?,
    val certificateNumber: String?,
    val certificateFileUrl: String?,
    val status: CertificationStatus,
    val isVerified: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(cert: com.liyaqa.trainer.domain.model.TrainerCertification): TrainerCertificationResponse =
            TrainerCertificationResponse(
                id = cert.id,
                trainerId = cert.trainerId,
                nameEn = cert.nameEn,
                nameAr = cert.nameAr,
                issuingOrganization = cert.issuingOrganization,
                issuedDate = cert.issuedDate,
                expiryDate = cert.expiryDate,
                certificateNumber = cert.certificateNumber,
                certificateFileUrl = cert.certificateFileUrl,
                status = cert.status,
                isVerified = cert.isVerified,
                createdAt = cert.createdAt,
                updatedAt = cert.updatedAt
            )
    }
}

/**
 * Request to create a certification.
 */
data class CreateCertificationRequest(
    @field:NotBlank(message = "Certification name (English) is required")
    @field:Size(min = 2, max = 255, message = "Certification name must be 2-255 characters")
    val nameEn: String,

    @field:NotBlank(message = "Certification name (Arabic) is required")
    @field:Size(min = 2, max = 255, message = "Certification name must be 2-255 characters")
    val nameAr: String,

    @field:NotBlank(message = "Issuing organization is required")
    @field:Size(max = 255, message = "Issuing organization must be less than 255 characters")
    val issuingOrganization: String,

    @field:Past(message = "Issued date must be in the past")
    val issuedDate: LocalDate? = null,

    val expiryDate: LocalDate? = null,

    @field:Size(max = 100, message = "Certificate number must be less than 100 characters")
    val certificateNumber: String? = null,

    @field:Size(max = 500, message = "Certificate file URL must be less than 500 characters")
    val certificateFileUrl: String? = null
)

/**
 * Request to update a certification.
 */
data class UpdateCertificationRequest(
    @field:Size(min = 2, max = 255, message = "Certification name must be 2-255 characters")
    val nameEn: String? = null,

    @field:Size(min = 2, max = 255, message = "Certification name must be 2-255 characters")
    val nameAr: String? = null,

    val issuingOrganization: String? = null,
    val issuedDate: LocalDate? = null,
    val expiryDate: LocalDate? = null,
    val certificateNumber: String? = null,
    val certificateFileUrl: String? = null,
    val status: CertificationStatus? = null
)

// ==================== TRAINER SESSION CREATION DTOs ====================

/**
 * Request DTO for a trainer to create a PT session on behalf of a member.
 * Unlike BookPTSessionRequest, this does not require @Future on sessionDate
 * (allows same-day sessions) and requires an explicit memberId.
 */
data class CreateTrainerSessionRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    @field:NotNull(message = "Session date is required")
    val sessionDate: LocalDate,

    @field:NotNull(message = "Start time is required")
    @field:Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Start time must be in HH:mm format")
    val startTime: String,

    @field:Min(15, message = "Duration must be at least 15 minutes")
    @field:Max(180, message = "Duration cannot exceed 180 minutes")
    val durationMinutes: Int = 60,

    val locationId: UUID? = null,

    val notes: String? = null
)

// ==================== DASHBOARD DTOs ====================

/**
 * Complete trainer dashboard response.
 */
data class TrainerDashboardResponse(
    val trainerId: UUID,
    val overview: DashboardOverviewResponse,
    val earnings: EarningsSummaryResponse,
    val schedule: ScheduleSummaryResponse,
    val clients: ClientsSummaryResponse,
    val notifications: NotificationsSummaryResponse
)

/**
 * Dashboard overview section.
 */
data class DashboardOverviewResponse(
    val trainerName: String,
    val trainerStatus: TrainerStatus,
    val profileImageUrl: String?,
    val trainerType: TrainerType,
    val specializations: List<String>
)

/**
 * Schedule summary section.
 */
data class ScheduleSummaryResponse(
    val todaysSessions: Int,
    val upcomingSessions: Int,
    val completedThisMonth: Int,
    val nextSession: UpcomingSessionResponse?
)

/**
 * Clients summary section.
 */
data class ClientsSummaryResponse(
    val totalClients: Int,
    val activeClients: Int,
    val newThisMonth: Int
)

/**
 * Notifications summary section.
 */
data class NotificationsSummaryResponse(
    val unreadCount: Int,
    val totalCount: Int,
    val recent: List<TrainerNotificationResponse>
)
