package com.liyaqa.config

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.domain.model.PlatformUserRole
import jakarta.servlet.FilterChain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.verify
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class ScopeIsolationFilterTest {

    private lateinit var filter: ScopeIsolationFilter

    @Mock
    private lateinit var filterChain: FilterChain

    private val tenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        filter = ScopeIsolationFilter()
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    // === Helper methods ===

    private fun setPlatformPrincipal() {
        val principal = JwtUserPrincipal(
            userId = UUID.randomUUID(),
            tenantId = tenantId,
            email = "admin@liyaqa.com",
            role = Role.PLATFORM_ADMIN,
            scope = "platform",
            platformRole = PlatformUserRole.PLATFORM_SUPER_ADMIN
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun setFacilityPrincipal() {
        val principal = JwtUserPrincipal(
            userId = UUID.randomUUID(),
            tenantId = tenantId,
            email = "admin@club.com",
            role = Role.CLUB_ADMIN,
            scope = "facility",
            platformRole = null
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun setClientPrincipal() {
        val principal = JwtUserPrincipal(
            userId = UUID.randomUUID(),
            tenantId = tenantId,
            email = "member@club.com",
            role = Role.MEMBER,
            scope = "client",
            platformRole = null
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun createRequest(path: String): MockHttpServletRequest {
        val request = MockHttpServletRequest()
        request.requestURI = path
        return request
    }

    // === Test cases ===

    @Test
    fun `platform user accessing platform path passes`() {
        setPlatformPrincipal()
        val request = createRequest("/api/platform/dashboard")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `platform user accessing v1 platform path passes`() {
        setPlatformPrincipal()
        val request = createRequest("/api/v1/platform/users")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `platform user accessing facility path gets 403`() {
        setPlatformPrincipal()
        val request = createRequest("/api/members/123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        assertEquals(403, response.status)
    }

    @Test
    fun `facility user accessing platform path gets 403`() {
        setFacilityPrincipal()
        val request = createRequest("/api/platform/dashboard")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        assertEquals(403, response.status)
    }

    @Test
    fun `facility user accessing facility path passes`() {
        setFacilityPrincipal()
        val request = createRequest("/api/members/123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `client user accessing platform path gets 403`() {
        setClientPrincipal()
        val request = createRequest("/api/platform/clients")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        assertEquals(403, response.status)
    }

    @Test
    fun `unauthenticated user passes through (handled by Spring Security)`() {
        SecurityContextHolder.clearContext()
        val request = createRequest("/api/platform/dashboard")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `auth endpoints are excluded from scope check`() {
        setFacilityPrincipal()
        val request = createRequest("/api/platform/auth/login")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `v1 auth endpoints are excluded from scope check`() {
        setFacilityPrincipal()
        val request = createRequest("/api/v1/platform/auth/login")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `actuator endpoints are excluded from scope check`() {
        setPlatformPrincipal()
        val request = createRequest("/actuator/health")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `swagger endpoints are excluded from scope check`() {
        setPlatformPrincipal()
        val request = createRequest("/swagger-ui/index.html")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        assertEquals(200, response.status)
    }

    @Test
    fun `403 response contains JSON error body`() {
        setPlatformPrincipal()
        val request = createRequest("/api/members/123")
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, filterChain)

        assertEquals(403, response.status)
        assertEquals("application/json", response.contentType)
        assert(response.contentAsString.contains("Platform users cannot access facility endpoints"))
    }
}
