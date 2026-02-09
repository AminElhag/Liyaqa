package com.liyaqa.platform.access.service

import com.liyaqa.platform.access.dto.InviteTeamMemberRequest
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
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.argThat
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamServiceTest {

    @Mock
    private lateinit var platformUserService: PlatformUserService

    @Mock
    private lateinit var inviteTokenRepository: PlatformInviteTokenRepository

    @Mock
    private lateinit var emailService: TeamInviteEmailService

    @Mock
    private lateinit var auditService: AuditService

    private lateinit var teamService: TeamService

    private val inviterId = UUID.randomUUID()
    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        teamService = TeamService(
            platformUserService = platformUserService,
            inviteTokenRepository = inviteTokenRepository,
            emailService = emailService,
            auditService = auditService,
            inviteExpirationHours = 48,
            resetExpirationHours = 1,
            baseUrl = "http://localhost:3001"
        )
    }

    @Test
    fun `inviteMember creates user, token, and sends email`() {
        val request = InviteTeamMemberRequest(
            email = "newuser@liyaqa.com",
            displayNameEn = "New User",
            role = PlatformUserRole.SUPPORT_AGENT
        )

        val createdUser = PlatformUser.create(
            email = "newuser@liyaqa.com",
            passwordHash = "hashed",
            displayName = LocalizedText("New User"),
            role = PlatformUserRole.SUPPORT_AGENT
        )

        whenever(platformUserService.createUser(any<CreatePlatformUserCommand>())).thenReturn(createdUser)
        whenever(inviteTokenRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = teamService.inviteMember(request, inviterId)

        assertEquals("newuser@liyaqa.com", result.email)
        assertEquals("Invitation sent successfully", result.message)
        assertNotNull(result.expiresAt)

        verify(platformUserService).createUser(any<CreatePlatformUserCommand>())
        verify(inviteTokenRepository).save(any())
        verify(emailService).sendInviteEmail(eq("newuser@liyaqa.com"), any(), eq("http://localhost:3001"))
        verify(auditService).logAsync(
            action = eq(AuditAction.TEAM_INVITE),
            entityType = eq("PlatformUser"),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `inviteMember rejects duplicate email`() {
        val request = InviteTeamMemberRequest(
            email = "existing@liyaqa.com",
            displayNameEn = "Existing User",
            role = PlatformUserRole.SUPPORT_AGENT
        )

        whenever(platformUserService.createUser(any<CreatePlatformUserCommand>()))
            .thenThrow(IllegalArgumentException("Email already exists: existing@liyaqa.com"))

        assertThrows(IllegalArgumentException::class.java) {
            teamService.inviteMember(request, inviterId)
        }
    }

    @Test
    fun `acceptInvite with valid token sets password and marks used`() {
        val rawToken = "validtoken123"
        val tokenHash = PlatformInviteToken.hashToken(rawToken)

        val token = PlatformInviteToken.create(
            email = "user@liyaqa.com",
            tokenHash = tokenHash,
            type = PlatformInviteToken.TokenType.INVITE,
            expiresAt = Instant.now().plusSeconds(3600)
        )

        val user = PlatformUser.create(
            email = "user@liyaqa.com",
            passwordHash = "temp",
            displayName = LocalizedText("User"),
            role = PlatformUserRole.SUPPORT_AGENT
        )

        whenever(inviteTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token))
        whenever(platformUserService.getUserByEmail("user@liyaqa.com")).thenReturn(user)
        whenever(inviteTokenRepository.save(any())).thenAnswer { it.arguments[0] }

        teamService.acceptInvite(rawToken, "newpassword123")

        verify(platformUserService).resetPassword(eq(user.id), any(), anyOrNull())
        verify(auditService).logAsync(
            action = eq(AuditAction.TEAM_INVITE_ACCEPT),
            entityType = any(),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
        assertTrue(token.isUsed)
    }

    @Test
    fun `acceptInvite with expired token throws`() {
        val rawToken = "expiredtoken"
        val tokenHash = PlatformInviteToken.hashToken(rawToken)

        val token = PlatformInviteToken.create(
            email = "user@liyaqa.com",
            tokenHash = tokenHash,
            type = PlatformInviteToken.TokenType.INVITE,
            expiresAt = Instant.now().minusSeconds(3600)
        )

        whenever(inviteTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token))

        assertThrows(InviteTokenExpiredException::class.java) {
            teamService.acceptInvite(rawToken, "newpassword")
        }
    }

    @Test
    fun `acceptInvite with already-used token throws`() {
        val rawToken = "usedtoken"
        val tokenHash = PlatformInviteToken.hashToken(rawToken)

        val token = PlatformInviteToken.create(
            email = "user@liyaqa.com",
            tokenHash = tokenHash,
            type = PlatformInviteToken.TokenType.INVITE,
            expiresAt = Instant.now().plusSeconds(3600)
        )
        token.markAsUsed()

        whenever(inviteTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token))

        assertThrows(InviteTokenAlreadyUsedException::class.java) {
            teamService.acceptInvite(rawToken, "newpassword")
        }
    }

    @Test
    fun `acceptInvite with nonexistent token throws`() {
        val rawToken = "nonexistent"
        val tokenHash = PlatformInviteToken.hashToken(rawToken)

        whenever(inviteTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.empty())

        assertThrows(InviteTokenNotFoundException::class.java) {
            teamService.acceptInvite(rawToken, "newpassword")
        }
    }

    @Test
    fun `changeRole delegates correctly`() {
        teamService.changeRole(userId, PlatformUserRole.ACCOUNT_MANAGER)

        verify(platformUserService).updateUser(eq(userId), argThat { role == PlatformUserRole.ACCOUNT_MANAGER })
    }

    @Test
    fun `deactivateUser delegates correctly`() {
        teamService.deactivateUser(userId, inviterId)

        verify(platformUserService).changeStatus(
            eq(userId),
            argThat { status == PlatformUserStatus.INACTIVE },
            eq(inviterId)
        )
    }

    @Test
    fun `sendPasswordReset generates token and sends email`() {
        val user = PlatformUser.create(
            email = "user@liyaqa.com",
            passwordHash = "hash",
            displayName = LocalizedText("User"),
            role = PlatformUserRole.SUPPORT_AGENT
        )

        whenever(platformUserService.getUser(userId)).thenReturn(user)
        whenever(inviteTokenRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = teamService.sendPasswordReset(userId, inviterId)

        assertEquals("user@liyaqa.com", result.email)
        assertNotNull(result.expiresAt)

        verify(inviteTokenRepository).save(argThat { type == PlatformInviteToken.TokenType.PASSWORD_RESET })
        verify(emailService).sendPasswordResetEmail(eq("user@liyaqa.com"), any(), eq("http://localhost:3001"))
    }
}
