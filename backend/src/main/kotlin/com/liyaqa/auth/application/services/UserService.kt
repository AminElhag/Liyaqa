package com.liyaqa.auth.application.services

import com.liyaqa.auth.application.commands.CreateUserCommand
import com.liyaqa.auth.application.commands.UpdateUserCommand
import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.RefreshTokenRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.shared.application.services.PermissionService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val permissionService: PermissionService,
    private val passwordPolicyService: PasswordPolicyService
) {
    /**
     * Creates a new user (admin operation).
     * @throws IllegalArgumentException if email is already taken
     */
    fun createUser(command: CreateUserCommand): User {
        val tenantId = com.liyaqa.shared.domain.TenantContext.getCurrentTenant().value

        if (userRepository.existsByEmailAndTenantId(command.email, tenantId)) {
            throw IllegalArgumentException("Email is already registered")
        }

        val user = User(
            email = command.email,
            passwordHash = passwordEncoder.encode(command.password)!!,
            displayName = command.displayName,
            role = command.role,
            status = UserStatus.ACTIVE,
            memberId = command.memberId
        )

        val savedUser = userRepository.save(user)

        // Grant default permissions for the user's role
        permissionService.grantDefaultPermissionsForRole(savedUser.id, savedUser.role.name)

        return savedUser
    }

    /**
     * Gets a user by ID.
     */
    @Transactional(readOnly = true)
    fun getUser(id: UUID): User {
        return userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }
    }

    /**
     * Gets a user by email.
     */
    @Transactional(readOnly = true)
    fun getUserByEmail(email: String): User {
        return userRepository.findByEmail(email)
            .orElseThrow { NoSuchElementException("User not found with email: $email") }
    }

    /**
     * Gets all users with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllUsers(pageable: Pageable): Page<User> {
        return userRepository.findAll(pageable)
    }

    /**
     * Gets users by status.
     */
    @Transactional(readOnly = true)
    fun getUsersByStatus(status: UserStatus, pageable: Pageable): Page<User> {
        return userRepository.findByStatus(status, pageable)
    }

    /**
     * Gets users by role.
     */
    @Transactional(readOnly = true)
    fun getUsersByRole(role: Role, pageable: Pageable): Page<User> {
        return userRepository.findByRole(role, pageable)
    }

    /**
     * Updates a user.
     */
    fun updateUser(id: UUID, command: UpdateUserCommand): User {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }

        command.displayName?.let { user.displayName = it }
        command.role?.let { user.role = it }
        command.memberId?.let { user.memberId = it }

        return userRepository.save(user)
    }

    /**
     * Deactivates a user.
     */
    fun deactivateUser(id: UUID): User {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }

        user.deactivate()
        userRepository.save(user)

        // Revoke all refresh tokens
        refreshTokenRepository.revokeAllByUserId(id)

        return user
    }

    /**
     * Activates a deactivated user.
     */
    fun activateUser(id: UUID): User {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }

        user.activate()
        return userRepository.save(user)
    }

    /**
     * Unlocks a locked user.
     */
    fun unlockUser(id: UUID): User {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }

        user.unlock()
        return userRepository.save(user)
    }

    /**
     * Deletes a user.
     */
    fun deleteUser(id: UUID) {
        if (!userRepository.existsById(id)) {
            throw NoSuchElementException("User not found: $id")
        }

        // Delete all refresh tokens first
        refreshTokenRepository.deleteByUserId(id)
        userRepository.deleteById(id)
    }

    /**
     * Links a user to a member.
     */
    fun linkToMember(userId: UUID, memberId: UUID): User {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        user.linkToMember(memberId)
        return userRepository.save(user)
    }

    /**
     * Unlinks a user from their member.
     */
    fun unlinkMember(userId: UUID): User {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        user.unlinkMember()
        return userRepository.save(user)
    }

    /**
     * Gets user by member ID.
     */
    @Transactional(readOnly = true)
    fun getUserByMemberId(memberId: UUID): User? {
        return userRepository.findByMemberId(memberId).orElse(null)
    }

    /**
     * Admin-initiated password reset (sets new password directly).
     * Validates against password policy, updates password, records in history,
     * and revokes all refresh tokens for security.
     * @throws NoSuchElementException if user not found
     * @throws IllegalArgumentException if password violates policy
     */
    fun adminResetPassword(userId: UUID, newPassword: String) {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        val policyConfig = passwordPolicyService.getPolicyForUser(user.isPlatformUser)
        val validationResult = passwordPolicyService.validatePasswordWithHistory(
            newPassword, userId, policyConfig
        )

        if (!validationResult.isValid) {
            throw IllegalArgumentException(validationResult.violations.joinToString(". "))
        }

        val newPasswordHash = passwordEncoder.encode(newPassword)!!
        user.changePassword(newPasswordHash)
        userRepository.save(user)

        passwordPolicyService.recordPasswordInHistory(userId, newPasswordHash, policyConfig)

        refreshTokenRepository.revokeAllByUserId(userId)
    }
}