package com.liyaqa.platform.application.services

import com.liyaqa.platform.application.commands.ChangeUserStatusCommand
import com.liyaqa.platform.application.commands.CreatePlatformUserCommand
import com.liyaqa.platform.application.commands.ResetUserPasswordCommand
import com.liyaqa.platform.application.commands.UpdatePlatformUserCommand
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserActivity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.platform.domain.ports.PlatformUserActivityRepository
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Statistics about platform users.
 */
data class PlatformUserStats(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val suspended: Long,
    val byRole: Map<PlatformUserRole, Long>
)

/**
 * Service for managing platform users.
 */
@Service
@Transactional
class PlatformUserService(
    private val platformUserRepository: PlatformUserRepository,
    private val activityRepository: PlatformUserActivityRepository,
    private val passwordEncoder: PasswordEncoder
) {

    /**
     * Create a new platform user.
     */
    fun createUser(command: CreatePlatformUserCommand): PlatformUser {
        // Check if email already exists
        if (platformUserRepository.existsByEmail(command.email)) {
            throw IllegalArgumentException("Email already exists: ${command.email}")
        }

        // Get creator if specified
        val createdBy = command.createdById?.let {
            platformUserRepository.findById(it)
                .orElse(null)
        }

        // Create user
        val user = PlatformUser.create(
            email = command.email,
            passwordHash = passwordEncoder.encode(command.password)!!,
            displayName = command.displayName,
            role = command.role,
            phoneNumber = command.phoneNumber,
            createdBy = createdBy
        )

        val savedUser = platformUserRepository.save(user)

        // Log activity
        createdBy?.let {
            activityRepository.save(
                PlatformUserActivity.create(
                    user = it,
                    action = PlatformUserActivity.ACTION_CREATE_USER,
                    description = "Created user ${savedUser.email} with role ${savedUser.role}"
                )
            )
        }

        return savedUser
    }

    /**
     * Get user by ID.
     */
    @Transactional(readOnly = true)
    fun getUser(id: UUID): PlatformUser {
        return platformUserRepository.findById(id)
            .orElseThrow { NoSuchElementException("Platform user not found: $id") }
    }

    /**
     * Get user by email.
     */
    @Transactional(readOnly = true)
    fun getUserByEmail(email: String): PlatformUser {
        return platformUserRepository.findByEmail(email)
            .orElseThrow { NoSuchElementException("Platform user not found: $email") }
    }

    /**
     * Get all users with pagination and optional filters.
     */
    @Transactional(readOnly = true)
    fun getAllUsers(
        status: PlatformUserStatus? = null,
        role: PlatformUserRole? = null,
        search: String? = null,
        pageable: Pageable
    ): Page<PlatformUser> {
        return when {
            !search.isNullOrBlank() -> platformUserRepository.searchByEmailOrName(search, pageable)
            status != null && role != null -> platformUserRepository.findByStatusAndRole(status, role, pageable)
            status != null -> platformUserRepository.findByStatus(status, pageable)
            role != null -> platformUserRepository.findByRole(role, pageable)
            else -> platformUserRepository.findAll(pageable)
        }
    }

    /**
     * Update user profile.
     */
    fun updateUser(id: UUID, command: UpdatePlatformUserCommand): PlatformUser {
        val user = platformUserRepository.findById(id)
            .orElseThrow { NoSuchElementException("Platform user not found: $id") }

        command.displayName?.let { user.displayName = it }
        command.role?.let { user.updateRole(it) }
        command.phoneNumber?.let { user.phoneNumber = it }
        command.avatarUrl?.let { user.avatarUrl = it }

        return platformUserRepository.save(user)
    }

    /**
     * Change user status.
     */
    fun changeStatus(id: UUID, command: ChangeUserStatusCommand, performedById: UUID? = null): PlatformUser {
        val user = platformUserRepository.findById(id)
            .orElseThrow { NoSuchElementException("Platform user not found: $id") }

        when (command.status) {
            PlatformUserStatus.ACTIVE -> user.activate()
            PlatformUserStatus.INACTIVE -> user.deactivate()
            PlatformUserStatus.SUSPENDED -> user.suspend()
        }

        val savedUser = platformUserRepository.save(user)

        // Log activity
        performedById?.let { performerId ->
            platformUserRepository.findById(performerId).ifPresent { performer ->
                activityRepository.save(
                    PlatformUserActivity.statusChangeActivity(
                        user = performer,
                        targetUser = savedUser,
                        newStatus = command.status,
                        reason = command.reason
                    )
                )
            }
        }

        return savedUser
    }

    /**
     * Reset user password.
     */
    fun resetPassword(id: UUID, command: ResetUserPasswordCommand, performedById: UUID? = null): Unit {
        val user = platformUserRepository.findById(id)
            .orElseThrow { NoSuchElementException("Platform user not found: $id") }

        user.updatePassword(passwordEncoder.encode(command.newPassword)!!)
        platformUserRepository.save(user)

        // Log activity
        performedById?.let { performerId ->
            platformUserRepository.findById(performerId).ifPresent { performer ->
                activityRepository.save(
                    PlatformUserActivity.create(
                        user = performer,
                        action = PlatformUserActivity.ACTION_RESET_PASSWORD,
                        description = "Reset password for user ${user.email}"
                    )
                )
            }
        }
    }

    /**
     * Delete user.
     */
    fun deleteUser(id: UUID) {
        if (!platformUserRepository.existsById(id)) {
            throw NoSuchElementException("Platform user not found: $id")
        }
        platformUserRepository.deleteById(id)
    }

    /**
     * Get user activities.
     */
    @Transactional(readOnly = true)
    fun getUserActivities(userId: UUID, pageable: Pageable): Page<PlatformUserActivity> {
        if (!platformUserRepository.existsById(userId)) {
            throw NoSuchElementException("Platform user not found: $userId")
        }
        return activityRepository.findByUserId(userId, pageable)
    }

    /**
     * Get user statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): PlatformUserStats {
        val total = platformUserRepository.count()
        val active = platformUserRepository.countByStatus(PlatformUserStatus.ACTIVE)
        val inactive = platformUserRepository.countByStatus(PlatformUserStatus.INACTIVE)
        val suspended = platformUserRepository.countByStatus(PlatformUserStatus.SUSPENDED)

        val byRole = PlatformUserRole.entries.associateWith { role ->
            platformUserRepository.countByRole(role)
        }

        return PlatformUserStats(
            total = total,
            active = active,
            inactive = inactive,
            suspended = suspended,
            byRole = byRole
        )
    }

    /**
     * Record login activity.
     */
    fun recordLogin(userId: UUID, ipAddress: String? = null, userAgent: String? = null) {
        val user = platformUserRepository.findById(userId)
            .orElseThrow { NoSuchElementException("Platform user not found: $userId") }

        user.recordLogin()
        platformUserRepository.save(user)

        activityRepository.save(
            PlatformUserActivity.loginActivity(user, ipAddress, userAgent)
        )
    }
}
