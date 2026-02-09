package com.liyaqa.platform.access.filter

import com.liyaqa.platform.access.model.TenantApiKey
import com.liyaqa.platform.access.service.ApiKeyService
import jakarta.servlet.FilterChain
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
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
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApiKeyAuthenticationFilterTest {

    @Mock
    private lateinit var apiKeyService: ApiKeyService

    @Mock
    private lateinit var filterChain: FilterChain

    private lateinit var filter: ApiKeyAuthenticationFilter

    private lateinit var request: MockHttpServletRequest
    private lateinit var response: MockHttpServletResponse

    private val tenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        filter = ApiKeyAuthenticationFilter(apiKeyService)
        request = MockHttpServletRequest()
        response = MockHttpServletResponse()
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `request without X-API-Key passes through`() {
        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        verify(apiKeyService, never()).validateKey(any())
        assertNull(SecurityContextHolder.getContext().authentication)
    }

    @Test
    fun `valid API key sets SecurityContext with ApiKeyPrincipal`() {
        val rawKey = "lqa_abcd1234_some_random_key_value_here__"
        request.addHeader("X-API-Key", rawKey)

        val apiKey = TenantApiKey.create(
            tenantId = tenantId,
            name = "Test Key",
            keyPrefix = "abcd1234",
            keyHash = "hash",
            permissions = listOf("READ"),
            rateLimit = 60,
            createdBy = UUID.randomUUID()
        )

        whenever(apiKeyService.validateKey(rawKey)).thenReturn(apiKey)

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)

        val auth = SecurityContextHolder.getContext().authentication
        assertNotNull(auth)
        assertTrue(auth!!.isAuthenticated)

        val principal = auth.principal as ApiKeyPrincipal
        assertEquals(apiKey.id, principal.keyId)
        assertEquals(tenantId, principal.tenantId)
        assertEquals("Test Key", principal.keyName)
        assertEquals(listOf("READ"), principal.permissions)
        assertEquals("facility", principal.scope)
    }

    @Test
    fun `invalid API key returns 401`() {
        request.addHeader("X-API-Key", "lqa_abcd1234_invalid_key_value_______")

        whenever(apiKeyService.validateKey(any())).thenReturn(null)

        filter.doFilter(request, response, filterChain)

        assertEquals(401, response.status)
        verify(filterChain, never()).doFilter(any(), any())
    }

    @Test
    fun `expired API key returns 401`() {
        request.addHeader("X-API-Key", "lqa_abcd1234_expired_key_value_______")

        whenever(apiKeyService.validateKey(any())).thenReturn(null)

        filter.doFilter(request, response, filterChain)

        assertEquals(401, response.status)
        verify(filterChain, never()).doFilter(any(), any())
    }

    @Test
    fun `existing auth skips API key processing`() {
        request.addHeader("X-API-Key", "lqa_abcd1234_some_key_value__________")

        val existingAuth = UsernamePasswordAuthenticationToken("user", "pass", emptyList())
        SecurityContextHolder.getContext().authentication = existingAuth

        filter.doFilter(request, response, filterChain)

        verify(filterChain).doFilter(request, response)
        verify(apiKeyService, never()).validateKey(any())
    }

    @Test
    fun `ApiKeyPrincipal scope is facility`() {
        val principal = ApiKeyPrincipal(
            keyId = UUID.randomUUID(),
            tenantId = tenantId,
            keyName = "Test",
            permissions = emptyList()
        )

        assertEquals("facility", principal.scope)
    }
}
