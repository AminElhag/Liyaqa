package com.liyaqa.platform.events.handler

import com.liyaqa.platform.tenant.model.DeactivationReason
import com.liyaqa.platform.tenant.model.TenantDeactivatedEvent
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import java.util.UUID

class TenantEventHandlerTest {

    private lateinit var handler: TenantEventHandler

    @BeforeEach
    fun setUp() {
        handler = TenantEventHandler()
    }

    @Test
    fun `handleTenantDeactivated logs event without throwing`() {
        val event = TenantDeactivatedEvent(
            tenantId = UUID.randomUUID(),
            reason = DeactivationReason.NON_PAYMENT,
            deactivatedBy = UUID.randomUUID()
        )

        assertDoesNotThrow { handler.handleTenantDeactivated(event) }
    }

    @Test
    fun `handleTenantDeactivated handles voluntary deactivation`() {
        val event = TenantDeactivatedEvent(
            tenantId = UUID.randomUUID(),
            reason = DeactivationReason.CLIENT_REQUEST,
            deactivatedBy = UUID.randomUUID()
        )

        assertDoesNotThrow { handler.handleTenantDeactivated(event) }
    }
}
