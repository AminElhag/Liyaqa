package com.liyaqa.platform.api.dto

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.employee.domain.model.Employee
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.AuditLog
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Club Detail Response
// ============================================

data class PlatformClubDetailResponse(
    val id: UUID,
    val organizationId: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val slug: String?,
    val status: ClubStatus,
    val createdAt: Instant,
    val updatedAt: Instant,
    val stats: ClubStats
) {
    companion object {
        fun from(club: Club, stats: ClubStats) = PlatformClubDetailResponse(
            id = club.id,
            organizationId = club.organizationId,
            name = LocalizedTextResponse.from(club.name),
            description = club.description?.let { LocalizedTextResponse.from(it) },
            slug = club.slug,
            status = club.status,
            createdAt = club.createdAt,
            updatedAt = club.updatedAt,
            stats = stats
        )
    }
}

data class ClubStats(
    val totalUsers: Long,
    val activeUsers: Long,
    val totalEmployees: Long,
    val activeEmployees: Long,
    val totalSubscriptions: Long,
    val activeSubscriptions: Long
)

// ============================================
// Club User Responses
// ============================================

data class ClubUserResponse(
    val id: UUID,
    val email: String,
    val displayName: LocalizedTextResponse,
    val role: Role,
    val status: UserStatus,
    val memberId: UUID?,
    val lastLoginAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(user: User) = ClubUserResponse(
            id = user.id,
            email = user.email,
            displayName = LocalizedTextResponse.from(user.displayName),
            role = user.role,
            status = user.status,
            memberId = user.memberId,
            lastLoginAt = user.lastLoginAt,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
}

data class ClubUserStats(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val locked: Long,
    val byRole: Map<Role, Long>
)

// ============================================
// Club Employee Responses
// ============================================

data class ClubEmployeeResponse(
    val id: UUID,
    val userId: UUID,
    val email: String?,
    val firstName: LocalizedTextResponse,
    val lastName: LocalizedTextResponse,
    val status: EmployeeStatus,
    val employmentType: EmploymentType,
    val departmentId: UUID?,
    val jobTitleId: UUID?,
    val hireDate: LocalDate,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(employee: Employee) = ClubEmployeeResponse(
            id = employee.id,
            userId = employee.userId,
            email = employee.email,
            firstName = LocalizedTextResponse.from(employee.firstName),
            lastName = LocalizedTextResponse.from(employee.lastName),
            status = employee.status,
            employmentType = employee.employmentType,
            departmentId = employee.departmentId,
            jobTitleId = employee.jobTitleId,
            hireDate = employee.hireDate,
            createdAt = employee.createdAt,
            updatedAt = employee.updatedAt
        )
    }
}

data class ClubEmployeeStats(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val onLeave: Long,
    val byEmploymentType: Map<EmploymentType, Long>
)

// ============================================
// Club Subscription Responses
// ============================================

data class ClubSubscriptionResponse(
    val id: UUID,
    val memberId: UUID,
    val planId: UUID,
    val status: SubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val autoRenew: Boolean,
    val classesRemaining: Int?,
    val daysRemaining: Long,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(subscription: Subscription) = ClubSubscriptionResponse(
            id = subscription.id,
            memberId = subscription.memberId,
            planId = subscription.planId,
            status = subscription.status,
            startDate = subscription.startDate,
            endDate = subscription.endDate,
            autoRenew = subscription.autoRenew,
            classesRemaining = subscription.classesRemaining,
            daysRemaining = subscription.daysRemaining(),
            createdAt = subscription.createdAt,
            updatedAt = subscription.updatedAt
        )
    }
}

data class ClubSubscriptionStats(
    val total: Long,
    val active: Long,
    val frozen: Long,
    val expired: Long,
    val cancelled: Long,
    val pendingPayment: Long
)

// ============================================
// Club Audit Log Responses
// ============================================

data class ClubAuditLogResponse(
    val id: UUID,
    val action: AuditAction,
    val entityType: String,
    val entityId: UUID,
    val userId: UUID?,
    val userEmail: String?,
    val description: String?,
    val ipAddress: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(log: AuditLog) = ClubAuditLogResponse(
            id = log.id,
            action = log.action,
            entityType = log.entityType,
            entityId = log.entityId,
            userId = log.userId,
            userEmail = log.userEmail,
            description = log.description,
            ipAddress = log.ipAddress,
            createdAt = log.createdAt
        )
    }
}

// ============================================
// Password Reset Request
// ============================================

data class PlatformResetPasswordRequest(
    @field:NotBlank(message = "New password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val newPassword: String
)

// PageResponse is defined in ClientPlanDtos.kt
