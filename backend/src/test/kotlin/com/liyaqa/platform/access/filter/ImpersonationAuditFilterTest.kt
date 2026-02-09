package com.liyaqa.platform.access.filter

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.model.ImpersonationSession
import com.liyaqa.platform.access.repository.ImpersonationSessionRepository
import jakarta.servlet.FilterChain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImpersonationAuditFilterTest {

    @Mock
    private lateinit var sessionRepository: ImpersonationSessionRepository

    @Mock
    private lateinit var filterChain: FilterChain

    private lateinit var filter: ImpersonationAuditFilter

    private val impersonatorId = UUID.randomUUID()
    private val targetTenantId = UUID.randomUUID()
    private val targetUserId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        filter = ImpersonationAuditFilter(sessionRepository)
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    private fun setImpersonationPrincipal() {
        val principal = JwtUserPrincipal(
            userId = targetUserId,
            tenantId = targetTenantId,
            email = "admin@facility.com",
            role = Role.SUPER_ADMIN,
            scope = "facility",
            isImpersonation = true,
            impersonatorId = impersonatorId
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun setNormalPrincipal() {
        val principal = JwtUserPrincipal(
            userId = UUID.randomUUID(),
            tenantId = UUID.randomUUID(),
            email = "user@facility.com",
            role = Role.CLUB_ADMIN,
            scope = "facility"
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun createActiveSession(): ImpersonationSession {
        return ImpersonationSession.create(
            platformUserId = impersonatorId,
            targetTenantId = targetTenantId,
            targetUserId = targetUserId,
            purpose = "Debug"
        )
    }

    @Test
    fun `allows GET requests for impersonation tokens`() {
        setImpersonationPrincipal()
        val session = createActiveSession()
        whenever(sessionRepository.findByPlatformUserIdAndIsActiveTrue(impersonatorId))
            .thenReturn(Optional.of(session))
        whenever(sessionRepository.save(any())).thenAnswer { it.arguments[0] }

        val request = MockHttpServletRequest("GET", "/api/members")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `blocks POST requests with 403`() {
        setImpersonationPrincipal()

        val request = MockHttpServletRequest("POST", "/api/members")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, never()).doFilter(any(), any())
        assertEquals(403, response.status)
    }

    @Test
    fun `blocks PUT requests with 403`() {
        setImpersonationPrincipal()

        val request = MockHttpServletRequest("PUT", "/api/members/123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, never()).doFilter(any(), any())
        assertEquals(403, response.status)
    }

    @Test
    fun `blocks DELETE requests with 403`() {
        setImpersonationPrincipal()

        val request = MockHttpServletRequest("DELETE", "/api/members/123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, never()).doFilter(any(), any())
        assertEquals(403, response.status)
    }

    @Test
    fun `blocks PATCH requests with 403`() {
        setImpersonationPrincipal()

        val request = MockHttpServletRequest("PATCH", "/api/members/123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain, never()).doFilter(any(), any())
        assertEquals(403, response.status)
    }

    @Test
    fun `passes through non-impersonation requests unchanged`() {
        setNormalPrincipal()

        val request = MockHttpServletRequest("POST", "/api/members")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `passes through unauthenticated requests`() {
        // No principal set
        val request = MockHttpServletRequest("GET", "/api/health")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
    }

    @Test
    fun `logs action to session on each GET request`() {
        setImpersonationPrincipal()
        val session = createActiveSession()
        whenever(sessionRepository.findByPlatformUserIdAndIsActiveTrue(impersonatorId))
            .thenReturn(Optional.of(session))
        whenever(sessionRepository.save(any())).thenAnswer { it.arguments[0] }

        val request = MockHttpServletRequest("GET", "/api/members/list")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(sessionRepository).save(any())
        assertEquals(listOf("GET /api/members/list"), session.getActionsList())
    }
}
