package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.util.UUID

class DealTest {

    private fun createPlatformUser(): PlatformUser {
        return PlatformUser(
            email = "rep@liyaqa.com",
            passwordHash = "hash",
            displayName = LocalizedText(en = "Sales Rep", ar = null),
            role = PlatformUserRole.ACCOUNT_MANAGER
        )
    }

    private fun createDeal(stage: DealStage = DealStage.LEAD): Deal {
        val deal = Deal.create(
            facilityName = "Test Gym",
            source = DealSource.WEBSITE,
            contactName = "John Doe",
            contactEmail = "john@example.com",
            assignedTo = createPlatformUser(),
            estimatedValue = BigDecimal("10000")
        )
        // Progress to requested stage
        val path = pathTo(stage)
        for (s in path) {
            deal.changeStage(s)
        }
        return deal
    }

    private fun pathTo(target: DealStage): List<DealStage> {
        return when (target) {
            DealStage.LEAD -> emptyList()
            DealStage.CONTACTED -> listOf(DealStage.CONTACTED)
            DealStage.DEMO_SCHEDULED -> listOf(DealStage.CONTACTED, DealStage.DEMO_SCHEDULED)
            DealStage.DEMO_DONE -> listOf(DealStage.CONTACTED, DealStage.DEMO_SCHEDULED, DealStage.DEMO_DONE)
            DealStage.PROPOSAL_SENT -> listOf(DealStage.CONTACTED, DealStage.DEMO_SCHEDULED, DealStage.DEMO_DONE, DealStage.PROPOSAL_SENT)
            DealStage.NEGOTIATION -> listOf(DealStage.CONTACTED, DealStage.DEMO_SCHEDULED, DealStage.DEMO_DONE, DealStage.PROPOSAL_SENT, DealStage.NEGOTIATION)
            DealStage.WON -> listOf(DealStage.CONTACTED, DealStage.DEMO_SCHEDULED, DealStage.DEMO_DONE, DealStage.PROPOSAL_SENT, DealStage.NEGOTIATION, DealStage.WON)
            DealStage.LOST -> listOf(DealStage.LOST) // Can lose from LEAD
            DealStage.CHURNED -> listOf(DealStage.CONTACTED, DealStage.DEMO_SCHEDULED, DealStage.DEMO_DONE, DealStage.PROPOSAL_SENT, DealStage.NEGOTIATION, DealStage.WON, DealStage.CHURNED)
        }
    }

    // ============================================
    // Valid Transitions
    // ============================================

    @Test
    fun `LEAD to CONTACTED is valid`() {
        val deal = createDeal()
        deal.changeStage(DealStage.CONTACTED)
        assertEquals(DealStage.CONTACTED, deal.stage)
    }

    @Test
    fun `LEAD to LOST is valid`() {
        val deal = createDeal()
        deal.changeStage(DealStage.LOST)
        assertEquals(DealStage.LOST, deal.stage)
        assertNotNull(deal.closedAt)
    }

    @Test
    fun `CONTACTED to DEMO_SCHEDULED is valid`() {
        val deal = createDeal(DealStage.CONTACTED)
        deal.changeStage(DealStage.DEMO_SCHEDULED)
        assertEquals(DealStage.DEMO_SCHEDULED, deal.stage)
    }

    @Test
    fun `CONTACTED to PROPOSAL_SENT is valid (skip demo)`() {
        val deal = createDeal(DealStage.CONTACTED)
        deal.changeStage(DealStage.PROPOSAL_SENT)
        assertEquals(DealStage.PROPOSAL_SENT, deal.stage)
    }

    @Test
    fun `NEGOTIATION to WON is valid`() {
        val deal = createDeal(DealStage.NEGOTIATION)
        deal.changeStage(DealStage.WON)
        assertEquals(DealStage.WON, deal.stage)
        assertNotNull(deal.closedAt)
    }

    @Test
    fun `WON to CHURNED is valid`() {
        val deal = createDeal(DealStage.WON)
        deal.changeStage(DealStage.CHURNED)
        assertEquals(DealStage.CHURNED, deal.stage)
    }

    // ============================================
    // Invalid Transitions
    // ============================================

    @Test
    fun `LEAD to WON is invalid`() {
        val deal = createDeal()
        assertThrows(IllegalArgumentException::class.java) {
            deal.changeStage(DealStage.WON)
        }
    }

    @Test
    fun `LEAD to NEGOTIATION is invalid`() {
        val deal = createDeal()
        assertThrows(IllegalArgumentException::class.java) {
            deal.changeStage(DealStage.NEGOTIATION)
        }
    }

    @Test
    fun `CONTACTED to WON is invalid`() {
        val deal = createDeal(DealStage.CONTACTED)
        assertThrows(IllegalArgumentException::class.java) {
            deal.changeStage(DealStage.WON)
        }
    }

    @Test
    fun `DEMO_SCHEDULED to NEGOTIATION is invalid`() {
        val deal = createDeal(DealStage.DEMO_SCHEDULED)
        assertThrows(IllegalArgumentException::class.java) {
            deal.changeStage(DealStage.NEGOTIATION)
        }
    }

    // ============================================
    // Reopen from LOST / CHURNED
    // ============================================

    @Test
    fun `reopen from LOST resets to LEAD and clears close data`() {
        val deal = createDeal()
        deal.lostReason = "Too expensive"
        deal.changeStage(DealStage.LOST)
        assertNotNull(deal.closedAt)

        deal.changeStage(DealStage.LEAD)
        assertEquals(DealStage.LEAD, deal.stage)
        assertNull(deal.closedAt)
        assertNull(deal.lostReason)
    }

    @Test
    fun `reopen from CHURNED resets to LEAD`() {
        val deal = createDeal(DealStage.CHURNED)
        deal.changeStage(DealStage.LEAD)
        assertEquals(DealStage.LEAD, deal.stage)
        assertNull(deal.closedAt)
    }

    // ============================================
    // closedAt set on terminal stages
    // ============================================

    @Test
    fun `closedAt is set when entering WON`() {
        val deal = createDeal(DealStage.NEGOTIATION)
        assertNull(deal.closedAt)
        deal.changeStage(DealStage.WON)
        assertNotNull(deal.closedAt)
    }

    @Test
    fun `closedAt is set when entering LOST`() {
        val deal = createDeal()
        deal.changeStage(DealStage.LOST)
        assertNotNull(deal.closedAt)
    }

    // ============================================
    // Query Methods
    // ============================================

    @Test
    fun `isOpen returns true for non-terminal stages`() {
        assertTrue(createDeal(DealStage.LEAD).isOpen())
        assertTrue(createDeal(DealStage.CONTACTED).isOpen())
        assertTrue(createDeal(DealStage.NEGOTIATION).isOpen())
    }

    @Test
    fun `isOpen returns false for terminal stages`() {
        assertFalse(createDeal(DealStage.WON).isOpen())
        assertFalse(createDeal(DealStage.LOST).isOpen())
        assertFalse(createDeal(DealStage.CHURNED).isOpen())
    }

    @Test
    fun `full pipeline flow LEAD to WON`() {
        val deal = createDeal()
        deal.changeStage(DealStage.CONTACTED)
        deal.changeStage(DealStage.DEMO_SCHEDULED)
        deal.changeStage(DealStage.DEMO_DONE)
        deal.changeStage(DealStage.PROPOSAL_SENT)
        deal.changeStage(DealStage.NEGOTIATION)
        deal.changeStage(DealStage.WON)

        assertEquals(DealStage.WON, deal.stage)
        assertTrue(deal.isWon())
        assertFalse(deal.isOpen())
        assertNotNull(deal.closedAt)
    }

    @Test
    fun `create factory sets correct defaults`() {
        val user = createPlatformUser()
        val deal = Deal.create(
            facilityName = "My Gym",
            source = DealSource.REFERRAL,
            contactName = "Jane",
            contactEmail = "jane@test.com",
            assignedTo = user
        )
        assertEquals(DealStage.LEAD, deal.stage)
        assertEquals("My Gym", deal.facilityName)
        assertEquals(BigDecimal.ZERO, deal.estimatedValue)
        assertEquals("SAR", deal.currency)
        assertNull(deal.closedAt)
        assertNull(deal.lostReason)
    }
}
