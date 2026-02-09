package com.liyaqa.platform.access.service

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.auth.infrastructure.security.JwtTokenProvider
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.dto.StartImpersonationRequest
import com.liyaqa.platform.access.exception.ActiveImpersonationSessionExistsException
import com.liyaqa.platform.access.model.ImpersonationSession
import com.liyaqa.platform.access.repository.ImpersonationSessionRepository
import com.liyaqa.platform.domain.model.PlatformUserRole
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
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.context.ApplicationEventPublisher
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImpersonationServiceTest {

    @Mock
    private lateinit var sessionRepository: ImpersonationSessionRepository

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var jwtTokenProvider: JwtTokenProvider

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var service: ImpersonationService

    private val platformUserId = UUID.randomUUID()
    private val targetTenantId = UUID.randomUUID()
    private val targetUserId = UUID.randomUUID()

    private lateinit var principal: JwtUserPrincipal
    private lateinit var targetUser: User

    @BeforeEach
    fun setUp() {
        service = ImpersonationService(
            sessionRepository = sessionRepository,
            userRepository = userRepository,
            jwtTokenProvider = jwtTokenProvider,
            auditService = auditService,
            eventPublisher = eventPublisher,
            tokenExpirationMs = 1800000
        )

        principal = JwtUserPrincipal(
            userId = platformUserId,
            tenantId = UUID.randomUUID(),
            email = "support@liyaqa.com",
            role = Role.PLATFORM_ADMIN,
            scope = "platform",
            platformRole = PlatformUserRole.SUPPORT_LEAD
        )

        targetUser = User(
            email = "admin@facility.com",
            passwordHash = "hashed",
            displayName = LocalizedText(en = "Admin", ar = "مدير"),
            role = Role.SUPER_ADMIN
        )
        // Set tenantId via reflection
        val tenantIdField = targetUser.javaClass.superclass.getDeclaredField("tenantId")
        tenantIdField.isAccessible = true
        tenantIdField.set(targetUser, targetTenantId)

        // Default stubs
        whenever(sessionRepository.countByPlatformUserIdAndIsActiveTrue(platformUserId)).thenReturn(0)
        whenever(userRepository.findById(targetUser.id)).thenReturn(Optional.of(targetUser))
        whenever(sessionRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(jwtTokenProvider.generateImpersonationToken(any(), any(), any())).thenReturn("mock-token")
        whenever(jwtTokenProvider.getExpiration(any())).thenReturn(Instant.now().plusMillis(1800000))
        whenever(auditService.log(any(), any(), any(), any(), any(), any())).thenReturn(
            com.liyaqa.shared.domain.AuditLog.create(
                action = AuditAction.IMPERSONATE_START,
                entityType = "ImpersonationSession",
                entityId = UUID.randomUUID()
            )
        )
    }

    @Test
    fun `starts impersonation session successfully`() {
        val request = StartImpersonationRequest(
            tenantId = targetTenantId,
            targetUserId = targetUser.id,
            purpose = "Debugging login issue"
        )

        val result = service.startImpersonation(request, principal, "127.0.0.1", "TestAgent")

        assertNotNull(result)
        assertEquals("mock-token", result.accessToken)
        assertEquals(targetUser.id, result.impersonatedUserId)
        assertEquals("admin@facility.com", result.impersonatedUserEmail)
        assertEquals(targetTenantId, result.tenantId)
        assertTrue(result.readOnly)
    }

    @Test
    fun `rejects if active session already exists`() {
        whenever(sessionRepository.countByPlatformUserIdAndIsActiveTrue(platformUserId)).thenReturn(1)

        val request = StartImpersonationRequest(
            tenantId = targetTenantId,
            targetUserId = targetUser.id,
            purpose = "Test"
        )

        assertThrows(ActiveImpersonationSessionExistsException::class.java) {
            service.startImpersonation(request, principal, null, null)
        }
    }

    @Test
    fun `resolves primary admin when targetUserId is null`() {
        whenever(userRepository.findFirstByTenantIdAndRoleIn(eq(targetTenantId), any()))
            .thenReturn(Optional.of(targetUser))

        val request = StartImpersonationRequest(
            tenantId = targetTenantId,
            targetUserId = null,
            purpose = "Quick look"
        )

        val result = service.startImpersonation(request, principal, null, null)
        assertNotNull(result)
        assertEquals(targetUser.id, result.impersonatedUserId)
    }

    @Test
    fun `rejects impersonation of platform users`() {
        val platformUser = User(
            email = "other@liyaqa.com",
            passwordHash = "hashed",
            displayName = LocalizedText(en = "Platform", ar = "منصة"),
            role = Role.PLATFORM_ADMIN
        )
        // Set tenantId and isPlatformUser
        val tenantIdField = platformUser.javaClass.superclass.getDeclaredField("tenantId")
        tenantIdField.isAccessible = true
        tenantIdField.set(platformUser, targetTenantId)
        val isPlatformField = platformUser.javaClass.getDeclaredField("isPlatformUser")
        isPlatformField.isAccessible = true
        isPlatformField.set(platformUser, true)

        whenever(userRepository.findById(platformUser.id)).thenReturn(Optional.of(platformUser))

        val request = StartImpersonationRequest(
            tenantId = targetTenantId,
            targetUserId = platformUser.id,
            purpose = "Test"
        )

        assertThrows(IllegalArgumentException::class.java) {
            service.startImpersonation(request, principal, null, null)
        }
    }

    @Test
    fun `ends impersonation session`() {
        val session = ImpersonationSession.create(
            platformUserId = platformUserId,
            targetTenantId = targetTenantId,
            targetUserId = targetUserId,
            purpose = "Test"
        )
        whenever(sessionRepository.findByPlatformUserIdAndIsActiveTrue(platformUserId))
            .thenReturn(Optional.of(session))

        val result = service.endImpersonation(platformUserId)

        assertNotNull(result)
        assertNotNull(result.endedAt)
        assertEquals(false, result.isActive)
    }

    @Test
    fun `force-ends another users session`() {
        val otherUserId = UUID.randomUUID()
        val session = ImpersonationSession.create(
            platformUserId = otherUserId,
            targetTenantId = targetTenantId,
            targetUserId = targetUserId,
            purpose = "Test"
        )
        whenever(sessionRepository.findById(session.id)).thenReturn(Optional.of(session))

        val result = service.forceEndSession(session.id)

        assertNotNull(result)
        assertNotNull(result.endedAt)
        assertEquals(false, result.isActive)
    }

    @Test
    fun `logs audit events on start and end`() {
        val request = StartImpersonationRequest(
            tenantId = targetTenantId,
            targetUserId = targetUser.id,
            purpose = "Debugging"
        )

        service.startImpersonation(request, principal, "127.0.0.1", "Agent")

        verify(auditService).log(
            action = eq(AuditAction.IMPERSONATE_START),
            entityType = eq("ImpersonationSession"),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )

        // Now test end
        val session = ImpersonationSession.create(
            platformUserId = platformUserId,
            targetTenantId = targetTenantId,
            targetUserId = targetUserId,
            purpose = "Test"
        )
        whenever(sessionRepository.findByPlatformUserIdAndIsActiveTrue(platformUserId))
            .thenReturn(Optional.of(session))

        service.endImpersonation(platformUserId)

        verify(auditService).log(
            action = eq(AuditAction.IMPERSONATE_END),
            entityType = eq("ImpersonationSession"),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }
}
