package com.liyaqa.platform.access.service

import com.liyaqa.platform.access.dto.InviteResponse
import com.liyaqa.platform.access.dto.InviteTeamMemberRequest
import com.liyaqa.platform.access.dto.PasswordResetResponse
import com.liyaqa.platform.access.dto.TeamMemberResponse
import com.liyaqa.platform.access.exception.InviteTokenAlreadyUsedException
import com.liyaqa.platform.access.exception.InviteTokenExpiredException
import com.liyaqa.platform.access.exception.InviteTokenNotFoundException
import com.liyaqa.platform.access.model.PlatformInviteToken
import com.liyaqa.platform.access.repository.PlatformInviteTokenRepository
import com.liyaqa.platform.application.commands.ChangeUserStatusCommand
import com.liyaqa.platform.application.commands.CreatePlatformUserCommand
import com.liyaqa.platform.application.commands.ResetUserPasswordCommand
import com.liyaqa.platform.application.commands.UpdatePlatformUserCommand
import com.liyaqa.platform.application.services.PlatformUserService
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class TeamService(
    private val platformUserService: PlatformUserService,
    private val inviteTokenRepository: PlatformInviteTokenRepository,
    private val emailService: TeamInviteEmailService,
    private val auditService: AuditService,
    @Value("\${liyaqa.team.invite-expiration-hours:48}")
    private val inviteExpirationHours: Long,
    @Value("\${liyaqa.team.reset-expiration-hours:1}")
    private val resetExpirationHours: Long,
    @Value("\${liyaqa.team.base-url:http://localhost:3001}")
    private val baseUrl: String
) {
    private val logger = LoggerFactory.getLogger(TeamService::class.java)

    fun listMembers(
        status: PlatformUserStatus? = null,
        role: PlatformUserRole? = null,
        search: String? = null,
        pageable: Pageable
    ): Page<TeamMemberResponse> {
        return platformUserService.getAllUsers(status, role, search, pageable)
            .map { TeamMemberResponse.from(it) }
    }

    fun inviteMember(request: InviteTeamMemberRequest, invitedById: UUID): InviteResponse {
        val tempPassword = generateSecureString(32)

        val user = platformUserService.createUser(
            CreatePlatformUserCommand(
                email = request.email.trim().lowercase(),
                password = tempPassword,
                displayName = LocalizedText(en = request.displayNameEn, ar = request.displayNameAr),
                role = request.role,
                phoneNumber = request.phoneNumber,
                createdById = invitedById
            )
        )

        val rawToken = generateSecureString(48)
        val tokenHash = PlatformInviteToken.hashToken(rawToken)
        val expiresAt = Instant.now().plusSeconds(inviteExpirationHours * 3600)

        val inviteToken = PlatformInviteToken.create(
            email = user.email,
            tokenHash = tokenHash,
            type = PlatformInviteToken.TokenType.INVITE,
            expiresAt = expiresAt
        )
        inviteTokenRepository.save(inviteToken)

        emailService.sendInviteEmail(user.email, rawToken, baseUrl)

        auditService.logAsync(
            action = AuditAction.TEAM_INVITE,
            entityType = "PlatformUser",
            entityId = user.id,
            description = "Invited ${user.email} with role ${request.role}"
        )

        logger.info("Team member invited: {} with role {}", user.email, request.role)

        return InviteResponse(
            email = user.email,
            message = "Invitation sent successfully",
            expiresAt = expiresAt
        )
    }

    fun acceptInvite(rawToken: String, newPassword: String) {
        val tokenHash = PlatformInviteToken.hashToken(rawToken)
        val token = inviteTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow { InviteTokenNotFoundException() }

        if (token.type != PlatformInviteToken.TokenType.INVITE) {
            throw InviteTokenNotFoundException()
        }
        if (token.isUsed) {
            throw InviteTokenAlreadyUsedException()
        }
        if (token.isExpired()) {
            throw InviteTokenExpiredException()
        }

        val user = platformUserService.getUserByEmail(token.email)

        platformUserService.resetPassword(
            user.id,
            ResetUserPasswordCommand(newPassword = newPassword)
        )

        token.markAsUsed()
        inviteTokenRepository.save(token)

        auditService.logAsync(
            action = AuditAction.TEAM_INVITE_ACCEPT,
            entityType = "PlatformUser",
            entityId = user.id,
            description = "Accepted invite for ${user.email}"
        )

        logger.info("Invite accepted for: {}", user.email)
    }

    fun changeRole(userId: UUID, newRole: PlatformUserRole) {
        platformUserService.updateUser(userId, UpdatePlatformUserCommand(role = newRole))
    }

    fun deactivateUser(userId: UUID, performedById: UUID) {
        platformUserService.changeStatus(
            userId,
            ChangeUserStatusCommand(status = PlatformUserStatus.INACTIVE),
            performedById
        )
    }

    fun sendPasswordReset(userId: UUID, performedById: UUID): PasswordResetResponse {
        val user = platformUserService.getUser(userId)

        val rawToken = generateSecureString(48)
        val tokenHash = PlatformInviteToken.hashToken(rawToken)
        val expiresAt = Instant.now().plusSeconds(resetExpirationHours * 3600)

        val resetToken = PlatformInviteToken.create(
            email = user.email,
            tokenHash = tokenHash,
            type = PlatformInviteToken.TokenType.PASSWORD_RESET,
            platformUserId = userId,
            expiresAt = expiresAt
        )
        inviteTokenRepository.save(resetToken)

        emailService.sendPasswordResetEmail(user.email, rawToken, baseUrl)

        auditService.logAsync(
            action = AuditAction.PASSWORD_RESET,
            entityType = "PlatformUser",
            entityId = userId,
            description = "Password reset requested for ${user.email} by $performedById"
        )

        logger.info("Password reset sent for: {}", user.email)

        return PasswordResetResponse(
            email = user.email,
            message = "Password reset email sent",
            expiresAt = expiresAt
        )
    }

    fun resetPassword(rawToken: String, newPassword: String) {
        val tokenHash = PlatformInviteToken.hashToken(rawToken)
        val token = inviteTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow { InviteTokenNotFoundException() }

        if (token.type != PlatformInviteToken.TokenType.PASSWORD_RESET) {
            throw InviteTokenNotFoundException()
        }
        if (token.isUsed) {
            throw InviteTokenAlreadyUsedException()
        }
        if (token.isExpired()) {
            throw InviteTokenExpiredException()
        }

        val user = platformUserService.getUserByEmail(token.email)

        platformUserService.resetPassword(
            user.id,
            ResetUserPasswordCommand(newPassword = newPassword)
        )

        token.markAsUsed()
        inviteTokenRepository.save(token)

        logger.info("Password reset completed for: {}", user.email)
    }

    private fun generateSecureString(length: Int): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        val random = SecureRandom()
        return (1..length).map { chars[random.nextInt(chars.length)] }.joinToString("")
    }
}
