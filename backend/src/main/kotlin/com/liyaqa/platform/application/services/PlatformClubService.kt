package com.liyaqa.platform.application.services

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.employee.domain.model.Employee
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.platform.api.dto.ClubEmployeeStats
import com.liyaqa.platform.api.dto.ClubStats
import com.liyaqa.platform.api.dto.ClubSubscriptionStats
import com.liyaqa.platform.api.dto.ClubUserStats
import com.liyaqa.platform.api.dto.UpdateClubRequest
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.AuditLog
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.audit.AuditService
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for platform-level club management.
 * Allows platform admins to view club data across tenants without tenant filtering.
 */
@Service
@Transactional
class PlatformClubService(
    private val clubRepository: ClubRepository,
    private val passwordEncoder: PasswordEncoder,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val auditService: AuditService
) {
    @PersistenceContext
    private lateinit var entityManager: EntityManager

    // ========================================
    // Club Operations
    // ========================================

    /**
     * Gets a club by ID.
     */
    @Transactional(readOnly = true)
    fun getClub(clubId: UUID): Club {
        return clubRepository.findById(clubId)
            .orElseThrow { NoSuchElementException("Club not found: $clubId") }
    }

    /**
     * Gets statistics for a club.
     */
    @Transactional(readOnly = true)
    fun getClubStats(clubId: UUID): ClubStats {
        val totalUsers = countUsersByTenantId(clubId)
        val activeUsers = countUsersByTenantIdAndStatus(clubId, UserStatus.ACTIVE)
        val totalEmployees = countEmployeesByTenantId(clubId)
        val activeEmployees = countEmployeesByTenantIdAndStatus(clubId, EmployeeStatus.ACTIVE)
        val totalSubscriptions = countSubscriptionsByTenantId(clubId)
        val activeSubscriptions = countSubscriptionsByTenantIdAndStatus(clubId, SubscriptionStatus.ACTIVE)

        return ClubStats(
            totalUsers = totalUsers,
            activeUsers = activeUsers,
            totalEmployees = totalEmployees,
            activeEmployees = activeEmployees,
            totalSubscriptions = totalSubscriptions,
            activeSubscriptions = activeSubscriptions
        )
    }

    // ========================================
    // User Operations (by Club/Tenant)
    // ========================================

    /**
     * Gets all users for a club (tenant).
     * Bypasses tenant filter to allow platform admin cross-tenant access.
     */
    @Transactional(readOnly = true)
    fun getUsersByClub(clubId: UUID, pageable: Pageable): Page<User> {
        val query = entityManager.createQuery(
            """
            SELECT u FROM User u
            WHERE u.tenantId = :tenantId
            ORDER BY u.createdAt DESC
            """.trimIndent(),
            User::class.java
        )
        query.setParameter("tenantId", clubId)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val users = query.resultList

        val countQuery = entityManager.createQuery(
            "SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        countQuery.setParameter("tenantId", clubId)
        val total = countQuery.singleResult

        return PageImpl(users, pageable, total)
    }

    /**
     * Gets user statistics for a club.
     * Uses single aggregation query to avoid N+1 problem.
     */
    @Transactional(readOnly = true)
    fun getUserStatsByClub(clubId: UUID): ClubUserStats {
        // Single query to get all status counts at once
        val statusCountQuery = entityManager.createQuery(
            """
            SELECT u.status, COUNT(u) FROM User u
            WHERE u.tenantId = :tenantId
            GROUP BY u.status
            """.trimIndent()
        )
        statusCountQuery.setParameter("tenantId", clubId)
        @Suppress("UNCHECKED_CAST")
        val statusResults = statusCountQuery.resultList as List<Array<Any>>
        val statusCounts = statusResults.associate {
            (it[0] as UserStatus) to (it[1] as Long)
        }

        val total = statusCounts.values.sum()
        val active = statusCounts[UserStatus.ACTIVE] ?: 0L
        val inactive = statusCounts[UserStatus.INACTIVE] ?: 0L
        val locked = statusCounts[UserStatus.LOCKED] ?: 0L

        // Single query to get all role counts at once
        val roleCountQuery = entityManager.createQuery(
            """
            SELECT u.role, COUNT(u) FROM User u
            WHERE u.tenantId = :tenantId
            GROUP BY u.role
            """.trimIndent()
        )
        roleCountQuery.setParameter("tenantId", clubId)
        @Suppress("UNCHECKED_CAST")
        val roleResults = roleCountQuery.resultList as List<Array<Any>>
        val roleCounts = roleResults.associate {
            (it[0] as Role) to (it[1] as Long)
        }

        // Build map with all roles (defaulting to 0 for roles with no users)
        val byRole = Role.entries.associateWith { role ->
            roleCounts[role] ?: 0L
        }

        return ClubUserStats(
            total = total,
            active = active,
            inactive = inactive,
            locked = locked,
            byRole = byRole
        )
    }

    /**
     * Gets a specific user.
     */
    @Transactional(readOnly = true)
    fun getUser(userId: UUID): User {
        val query = entityManager.createQuery(
            "SELECT u FROM User u WHERE u.id = :userId",
            User::class.java
        )
        query.setParameter("userId", userId)
        return query.resultList.firstOrNull()
            ?: throw NoSuchElementException("User not found: $userId")
    }

    /**
     * Resets a user's password (admin action).
     */
    fun resetUserPassword(clubId: UUID, userId: UUID, newPassword: String): User {
        val user = getUser(userId)

        // Verify user belongs to this club
        if (user.tenantId != clubId) {
            throw IllegalArgumentException("User does not belong to this club")
        }

        // Update password
        user.changePassword(passwordEncoder.encode(newPassword)!!)

        // Save user
        val updatedUser = entityManager.merge(user)

        // Revoke all refresh tokens for security
        refreshTokenRepository.revokeAllByUserId(userId)

        // Log the action
        auditService.log(
            action = AuditAction.PASSWORD_RESET,
            entityType = "User",
            entityId = userId,
            description = "Password reset by platform admin"
        )

        return updatedUser
    }

    // ========================================
    // Employee Operations (by Club/Tenant)
    // ========================================

    /**
     * Gets all employees for a club (tenant).
     */
    @Transactional(readOnly = true)
    fun getEmployeesByClub(clubId: UUID, pageable: Pageable): Page<Employee> {
        val query = entityManager.createQuery(
            """
            SELECT e FROM Employee e
            WHERE e.tenantId = :tenantId
            ORDER BY e.createdAt DESC
            """.trimIndent(),
            Employee::class.java
        )
        query.setParameter("tenantId", clubId)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val employees = query.resultList

        val countQuery = entityManager.createQuery(
            "SELECT COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        countQuery.setParameter("tenantId", clubId)
        val total = countQuery.singleResult

        return PageImpl(employees, pageable, total)
    }

    /**
     * Gets employee statistics for a club.
     * Uses single aggregation query to avoid N+1 problem.
     */
    @Transactional(readOnly = true)
    fun getEmployeeStatsByClub(clubId: UUID): ClubEmployeeStats {
        // Single query to get all status counts at once
        val statusCountQuery = entityManager.createQuery(
            """
            SELECT e.status, COUNT(e) FROM Employee e
            WHERE e.tenantId = :tenantId
            GROUP BY e.status
            """.trimIndent()
        )
        statusCountQuery.setParameter("tenantId", clubId)
        @Suppress("UNCHECKED_CAST")
        val statusResults = statusCountQuery.resultList as List<Array<Any>>
        val statusCounts = statusResults.associate {
            (it[0] as EmployeeStatus) to (it[1] as Long)
        }

        val total = statusCounts.values.sum()
        val active = statusCounts[EmployeeStatus.ACTIVE] ?: 0L
        val inactive = statusCounts[EmployeeStatus.INACTIVE] ?: 0L
        val onLeave = statusCounts[EmployeeStatus.ON_LEAVE] ?: 0L

        // Single query to get all employment type counts at once
        val typeCountQuery = entityManager.createQuery(
            """
            SELECT e.employmentType, COUNT(e) FROM Employee e
            WHERE e.tenantId = :tenantId
            GROUP BY e.employmentType
            """.trimIndent()
        )
        typeCountQuery.setParameter("tenantId", clubId)
        @Suppress("UNCHECKED_CAST")
        val typeResults = typeCountQuery.resultList as List<Array<Any>>
        val typeCounts = typeResults.associate {
            (it[0] as EmploymentType) to (it[1] as Long)
        }

        // Build map with all types (defaulting to 0 for types with no employees)
        val byEmploymentType = EmploymentType.entries.associateWith { type ->
            typeCounts[type] ?: 0L
        }

        return ClubEmployeeStats(
            total = total,
            active = active,
            inactive = inactive,
            onLeave = onLeave,
            byEmploymentType = byEmploymentType
        )
    }

    // ========================================
    // Subscription Operations (by Club/Tenant)
    // ========================================

    /**
     * Gets all subscriptions for a club (tenant).
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByClub(clubId: UUID, pageable: Pageable): Page<Subscription> {
        val query = entityManager.createQuery(
            """
            SELECT s FROM Subscription s
            WHERE s.tenantId = :tenantId
            ORDER BY s.createdAt DESC
            """.trimIndent(),
            Subscription::class.java
        )
        query.setParameter("tenantId", clubId)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val subscriptions = query.resultList

        val countQuery = entityManager.createQuery(
            "SELECT COUNT(s) FROM Subscription s WHERE s.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        countQuery.setParameter("tenantId", clubId)
        val total = countQuery.singleResult

        return PageImpl(subscriptions, pageable, total)
    }

    /**
     * Gets subscription statistics for a club.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionStatsByClub(clubId: UUID): ClubSubscriptionStats {
        val total = countSubscriptionsByTenantId(clubId)
        val active = countSubscriptionsByTenantIdAndStatus(clubId, SubscriptionStatus.ACTIVE)
        val frozen = countSubscriptionsByTenantIdAndStatus(clubId, SubscriptionStatus.FROZEN)
        val expired = countSubscriptionsByTenantIdAndStatus(clubId, SubscriptionStatus.EXPIRED)
        val cancelled = countSubscriptionsByTenantIdAndStatus(clubId, SubscriptionStatus.CANCELLED)
        val pendingPayment = countSubscriptionsByTenantIdAndStatus(clubId, SubscriptionStatus.PENDING_PAYMENT)

        return ClubSubscriptionStats(
            total = total,
            active = active,
            frozen = frozen,
            expired = expired,
            cancelled = cancelled,
            pendingPayment = pendingPayment
        )
    }

    // ========================================
    // Audit Log Operations (by Club/Tenant)
    // ========================================

    /**
     * Gets audit logs for a club (tenant).
     */
    @Transactional(readOnly = true)
    fun getAuditLogsByClub(clubId: UUID, action: AuditAction?, pageable: Pageable): Page<AuditLog> {
        val baseQuery = if (action != null) {
            """
            SELECT a FROM AuditLog a
            WHERE a.tenantId = :tenantId AND a.action = :action
            ORDER BY a.createdAt DESC
            """.trimIndent()
        } else {
            """
            SELECT a FROM AuditLog a
            WHERE a.tenantId = :tenantId
            ORDER BY a.createdAt DESC
            """.trimIndent()
        }

        val query = entityManager.createQuery(baseQuery, AuditLog::class.java)
        query.setParameter("tenantId", clubId)
        if (action != null) {
            query.setParameter("action", action)
        }
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val logs = query.resultList

        val countQueryStr = if (action != null) {
            "SELECT COUNT(a) FROM AuditLog a WHERE a.tenantId = :tenantId AND a.action = :action"
        } else {
            "SELECT COUNT(a) FROM AuditLog a WHERE a.tenantId = :tenantId"
        }
        val countQuery = entityManager.createQuery(countQueryStr, Long::class.javaObjectType)
        countQuery.setParameter("tenantId", clubId)
        if (action != null) {
            countQuery.setParameter("action", action)
        }
        val total = countQuery.singleResult

        return PageImpl(logs, pageable, total)
    }

    // ========================================
    // Location Operations (by Club/Tenant)
    // ========================================

    /**
     * Gets all locations for a club.
     */
    @Transactional(readOnly = true)
    fun getLocationsByClub(clubId: UUID, pageable: Pageable): Page<Location> {
        val query = entityManager.createQuery(
            """
            SELECT l FROM Location l
            WHERE l.clubId = :clubId
            ORDER BY l.createdAt DESC
            """.trimIndent(),
            Location::class.java
        )
        query.setParameter("clubId", clubId)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val locations = query.resultList

        val countQuery = entityManager.createQuery(
            "SELECT COUNT(l) FROM Location l WHERE l.clubId = :clubId",
            Long::class.javaObjectType
        )
        countQuery.setParameter("clubId", clubId)
        val total = countQuery.singleResult

        return PageImpl(locations, pageable, total)
    }

    // ========================================
    // Membership Plan Operations (by Club/Tenant)
    // ========================================

    /**
     * Data class to hold membership plan with subscriber count.
     */
    data class MembershipPlanWithCount(
        val plan: MembershipPlan,
        val subscriberCount: Long
    )

    /**
     * Gets all membership plans for a club with subscriber counts.
     * Uses batch query for subscriber counts to avoid N+1 problem.
     */
    @Transactional(readOnly = true)
    fun getMembershipPlansByClub(clubId: UUID, pageable: Pageable): Page<MembershipPlanWithCount> {
        val query = entityManager.createQuery(
            """
            SELECT p FROM MembershipPlan p
            WHERE p.tenantId = :tenantId
            ORDER BY p.sortOrder ASC, p.createdAt DESC
            """.trimIndent(),
            MembershipPlan::class.java
        )
        query.setParameter("tenantId", clubId)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        val plans = query.resultList

        val countQuery = entityManager.createQuery(
            "SELECT COUNT(p) FROM MembershipPlan p WHERE p.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        countQuery.setParameter("tenantId", clubId)
        val total = countQuery.singleResult

        // Batch fetch all subscriber counts in a single query
        val subscriberCountsMap = if (plans.isNotEmpty()) {
            val planIds = plans.map { it.id }
            getSubscriberCountsByPlanIds(planIds)
        } else {
            emptyMap()
        }

        // Map plans with their subscriber counts
        val plansWithCounts = plans.map { plan ->
            MembershipPlanWithCount(plan, subscriberCountsMap[plan.id] ?: 0L)
        }

        return PageImpl(plansWithCounts, pageable, total)
    }

    private fun getSubscriberCountsByPlanIds(planIds: List<UUID>): Map<UUID, Long> {
        val query = entityManager.createQuery(
            """
            SELECT s.planId, COUNT(s) FROM Subscription s
            WHERE s.planId IN :planIds AND s.status IN ('ACTIVE', 'FROZEN', 'PENDING_PAYMENT')
            GROUP BY s.planId
            """.trimIndent()
        )
        query.setParameter("planIds", planIds)
        @Suppress("UNCHECKED_CAST")
        val results = query.resultList as List<Array<Any>>
        return results.associate {
            (it[0] as UUID) to (it[1] as Long)
        }
    }

    // ========================================
    // Club Update Operations
    // ========================================

    /**
     * Updates club basic information.
     */
    fun updateClub(clubId: UUID, request: UpdateClubRequest): Club {
        val club = getClub(clubId)

        // Update name if provided
        if (request.nameEn != null || request.nameAr != null) {
            club.name = LocalizedText(
                en = request.nameEn ?: club.name.en,
                ar = request.nameAr ?: club.name.ar
            )
        }

        // Update description if provided
        if (request.descriptionEn != null || request.descriptionAr != null) {
            club.description = LocalizedText(
                en = request.descriptionEn ?: club.description?.en ?: "",
                ar = request.descriptionAr ?: club.description?.ar
            )
        }

        val updatedClub = entityManager.merge(club)

        auditService.log(
            action = AuditAction.UPDATE,
            entityType = "Club",
            entityId = clubId,
            description = "Club updated by platform admin"
        )

        return updatedClub
    }

    /**
     * Activates a suspended club.
     */
    fun activateClub(clubId: UUID): Club {
        val club = getClub(clubId)
        club.activate()

        val updatedClub = entityManager.merge(club)

        auditService.log(
            action = AuditAction.STATUS_CHANGE,
            entityType = "Club",
            entityId = clubId,
            description = "Club activated by platform admin"
        )

        return updatedClub
    }

    /**
     * Suspends an active club.
     */
    fun suspendClub(clubId: UUID): Club {
        val club = getClub(clubId)
        club.suspend()

        val updatedClub = entityManager.merge(club)

        auditService.log(
            action = AuditAction.STATUS_CHANGE,
            entityType = "Club",
            entityId = clubId,
            description = "Club suspended by platform admin"
        )

        return updatedClub
    }

    // ========================================
    // Private Helper Methods
    // ========================================

    private fun countUsersByTenantId(tenantId: UUID): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        return query.singleResult
    }

    private fun countUsersByTenantIdAndStatus(tenantId: UUID, status: UserStatus): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.status = :status",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        query.setParameter("status", status)
        return query.singleResult
    }

    private fun countUsersByTenantIdAndRole(tenantId: UUID, role: Role): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        query.setParameter("role", role)
        return query.singleResult
    }

    private fun countEmployeesByTenantId(tenantId: UUID): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        return query.singleResult
    }

    private fun countEmployeesByTenantIdAndStatus(tenantId: UUID, status: EmployeeStatus): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId AND e.status = :status",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        query.setParameter("status", status)
        return query.singleResult
    }

    private fun countEmployeesByTenantIdAndEmploymentType(tenantId: UUID, type: EmploymentType): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(e) FROM Employee e WHERE e.tenantId = :tenantId AND e.employmentType = :type",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        query.setParameter("type", type)
        return query.singleResult
    }

    private fun countSubscriptionsByTenantId(tenantId: UUID): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(s) FROM Subscription s WHERE s.tenantId = :tenantId",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        return query.singleResult
    }

    private fun countSubscriptionsByTenantIdAndStatus(tenantId: UUID, status: SubscriptionStatus): Long {
        val query = entityManager.createQuery(
            "SELECT COUNT(s) FROM Subscription s WHERE s.tenantId = :tenantId AND s.status = :status",
            Long::class.javaObjectType
        )
        query.setParameter("tenantId", tenantId)
        query.setParameter("status", status)
        return query.singleResult
    }
}
