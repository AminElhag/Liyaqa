package com.liyaqa.platform.monitoring.service

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.monitoring.model.PlatformAuditActorType
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.util.UUID

class AuditContextTest {

    @AfterEach
    fun tearDown() {
        AuditContext.clear()
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `set get clear lifecycle works correctly`() {
        val actorId = UUID.randomUUID()
        val data = AuditContext.AuditContextData(
            actorId = actorId,
            actorType = PlatformAuditActorType.PLATFORM_USER,
            actorName = "admin@liyaqa.com",
            correlationId = "corr-abc",
            ipAddress = "10.0.0.1"
        )

        AuditContext.set(data)

        val retrieved = AuditContext.get()
        assertNotNull(retrieved)
        assertEquals(actorId, retrieved!!.actorId)
        assertEquals(PlatformAuditActorType.PLATFORM_USER, retrieved.actorType)
        assertEquals("admin@liyaqa.com", retrieved.actorName)
        assertEquals("corr-abc", retrieved.correlationId)
        assertEquals("10.0.0.1", retrieved.ipAddress)

        AuditContext.clear()
        assertNull(AuditContext.get())
    }

    @Test
    fun `fromCurrentRequest resolves principal from SecurityContext`() {
        val userId = UUID.randomUUID()
        val tenantId = UUID.randomUUID()
        val principal = JwtUserPrincipal(
            userId = userId,
            tenantId = tenantId,
            email = "admin@liyaqa.com",
            role = Role.PLATFORM_ADMIN,
            scope = "platform"
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth

        val result = AuditContext.fromCurrentRequest()

        assertNotNull(result)
        assertEquals(userId, result!!.actorId)
        assertEquals(PlatformAuditActorType.PLATFORM_USER, result.actorType)
        assertEquals("admin@liyaqa.com", result.actorName)
        assertNotNull(result.correlationId)
    }

    @Test
    fun `fromCurrentRequest returns null without security context`() {
        SecurityContextHolder.clearContext()

        val result = AuditContext.fromCurrentRequest()

        assertNull(result)
    }
}
