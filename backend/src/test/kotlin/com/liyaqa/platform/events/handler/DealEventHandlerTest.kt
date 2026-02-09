package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import java.math.BigDecimal
import java.util.UUID

class DealEventHandlerTest {

    private lateinit var handler: DealEventHandler

    @BeforeEach
    fun setUp() {
        handler = DealEventHandler()
    }

    @Test
    fun `handleDealWon logs event without throwing`() {
        val event = PlatformEvent.DealWon(
            dealId = UUID.randomUUID(),
            facilityName = "Premium Gym",
            contactName = "John Doe",
            contactEmail = "john@example.com",
            estimatedValue = BigDecimal("75000")
        )

        assertDoesNotThrow { handler.handleDealWon(event) }
    }

    @Test
    fun `handleDealWon handles null facility name`() {
        val event = PlatformEvent.DealWon(
            dealId = UUID.randomUUID(),
            facilityName = null,
            contactName = "Jane Doe",
            contactEmail = "jane@example.com",
            estimatedValue = BigDecimal("30000")
        )

        assertDoesNotThrow { handler.handleDealWon(event) }
    }
}
