package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import java.util.UUID

class AccessEventHandlerTest {

    private lateinit var handler: AccessEventHandler

    @BeforeEach
    fun setUp() {
        handler = AccessEventHandler()
    }

    @Test
    fun `handleImpersonationStarted logs event without throwing`() {
        val event = PlatformEvent.ImpersonationStarted(
            sessionId = UUID.randomUUID(),
            platformUserId = UUID.randomUUID(),
            platformUserEmail = "admin@liyaqa.com",
            targetUserId = UUID.randomUUID(),
            targetTenantId = UUID.randomUUID(),
            purpose = "Debugging login issue"
        )

        assertDoesNotThrow { handler.handleImpersonationStarted(event) }
    }

    @Test
    fun `handleImpersonationStarted handles various purposes`() {
        val event = PlatformEvent.ImpersonationStarted(
            sessionId = UUID.randomUUID(),
            platformUserId = UUID.randomUUID(),
            platformUserEmail = "support@liyaqa.com",
            targetUserId = UUID.randomUUID(),
            targetTenantId = UUID.randomUUID(),
            purpose = "Customer reported billing discrepancy"
        )

        assertDoesNotThrow { handler.handleImpersonationStarted(event) }
    }
}
