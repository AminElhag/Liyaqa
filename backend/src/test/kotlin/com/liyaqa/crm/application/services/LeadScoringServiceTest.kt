package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.CreateScoringRuleCommand
import com.liyaqa.crm.application.commands.UpdateScoringRuleCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadScoringRule
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.ports.LeadRepository
import com.liyaqa.crm.domain.ports.LeadScoringRuleRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LeadScoringServiceTest {

    @Mock
    private lateinit var scoringRuleRepository: LeadScoringRuleRepository

    @Mock
    private lateinit var leadRepository: LeadRepository

    private lateinit var scoringService: LeadScoringService

    private lateinit var testLead: Lead
    private lateinit var testRule: LeadScoringRule

    @BeforeEach
    fun setUp() {
        scoringService = LeadScoringService(scoringRuleRepository, leadRepository)

        testLead = Lead(
            id = UUID.randomUUID(),
            name = "Test Lead",
            email = "test@example.com",
            source = LeadSource.REFERRAL
        )

        testRule = LeadScoringRule(
            id = UUID.randomUUID(),
            name = "Referral Bonus",
            triggerType = LeadScoringTriggerType.SOURCE,
            triggerValue = "REFERRAL",
            scoreChange = 10,
            isActive = true
        )
    }

    @Test
    fun `createRule should create a new scoring rule`() {
        val command = CreateScoringRuleCommand(
            name = "Referral Bonus",
            triggerType = LeadScoringTriggerType.SOURCE,
            triggerValue = "REFERRAL",
            scoreChange = 10,
            isActive = true
        )

        whenever(scoringRuleRepository.save(any())).thenReturn(testRule)

        val result = scoringService.createRule(command)

        assertNotNull(result)
        assertEquals("Referral Bonus", result.name)
        assertEquals(LeadScoringTriggerType.SOURCE, result.triggerType)
        assertEquals(10, result.scoreChange)
        verify(scoringRuleRepository).save(any())
    }

    @Test
    fun `getRule should return rule when found`() {
        whenever(scoringRuleRepository.findById(testRule.id)).thenReturn(Optional.of(testRule))

        val result = scoringService.getRule(testRule.id)

        assertNotNull(result)
        assertEquals(testRule.id, result.id)
    }

    @Test
    fun `getRule should throw exception when not found`() {
        val nonExistentId = UUID.randomUUID()
        whenever(scoringRuleRepository.findById(nonExistentId)).thenReturn(Optional.empty())

        assertThrows(NoSuchElementException::class.java) {
            scoringService.getRule(nonExistentId)
        }
    }

    @Test
    fun `updateRule should update rule properties`() {
        val command = UpdateScoringRuleCommand(
            name = "Updated Name",
            scoreChange = 20,
            isActive = false
        )

        whenever(scoringRuleRepository.findById(testRule.id)).thenReturn(Optional.of(testRule))
        whenever(scoringRuleRepository.save(any())).thenAnswer { it.arguments[0] }

        val result = scoringService.updateRule(testRule.id, command)

        assertEquals("Updated Name", result.name)
        assertEquals(20, result.scoreChange)
        assertEquals(false, result.isActive)
    }

    @Test
    fun `applySourceScoring should add score for matching source`() {
        val rules = listOf(testRule)
        whenever(scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.SOURCE,
            "REFERRAL"
        )).thenReturn(rules)

        val initialScore = testLead.score
        val scoreChange = scoringService.applySourceScoring(testLead)

        assertEquals(10, scoreChange)
        assertEquals(initialScore + 10, testLead.score)
    }

    @Test
    fun `applySourceScoring should return 0 when no matching rules`() {
        whenever(scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.SOURCE,
            "REFERRAL"
        )).thenReturn(emptyList())

        val scoreChange = scoringService.applySourceScoring(testLead)

        assertEquals(0, scoreChange)
        assertEquals(0, testLead.score)
    }

    @Test
    fun `applyActivityScoring should add score for matching activity`() {
        val activityRule = LeadScoringRule(
            id = UUID.randomUUID(),
            name = "Call Score",
            triggerType = LeadScoringTriggerType.ACTIVITY,
            triggerValue = "CALL",
            scoreChange = 5,
            isActive = true
        )

        whenever(scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.ACTIVITY,
            "CALL"
        )).thenReturn(listOf(activityRule))
        whenever(leadRepository.save(any())).thenAnswer { it.arguments[0] }

        val initialScore = testLead.score
        val scoreChange = scoringService.applyActivityScoring(testLead, LeadActivityType.CALL)

        assertEquals(5, scoreChange)
        assertEquals(initialScore + 5, testLead.score)
    }

    @Test
    fun `applyActivityScoring should handle negative scores`() {
        val negativeRule = LeadScoringRule(
            id = UUID.randomUUID(),
            name = "No Response Penalty",
            triggerType = LeadScoringTriggerType.ACTIVITY,
            triggerValue = "NOTE",
            scoreChange = -3,
            isActive = true
        )

        // First increase score so we have something to decrease
        testLead.increaseScore(10)

        whenever(scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.ACTIVITY,
            "NOTE"
        )).thenReturn(listOf(negativeRule))
        whenever(leadRepository.save(any())).thenAnswer { it.arguments[0] }

        val scoreChange = scoringService.applyActivityScoring(testLead, LeadActivityType.NOTE)

        assertEquals(-3, scoreChange)
        assertEquals(7, testLead.score)
    }

    @Test
    fun `applyActivityScoring should accumulate multiple rule scores`() {
        val rule1 = LeadScoringRule(
            id = UUID.randomUUID(),
            name = "General Call Score",
            triggerType = LeadScoringTriggerType.ACTIVITY,
            triggerValue = "CALL",
            scoreChange = 5,
            isActive = true
        )
        val rule2 = LeadScoringRule(
            id = UUID.randomUUID(),
            name = "Extra Call Bonus",
            triggerType = LeadScoringTriggerType.ACTIVITY,
            triggerValue = "CALL",
            scoreChange = 3,
            isActive = true
        )

        whenever(scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.ACTIVITY,
            "CALL"
        )).thenReturn(listOf(rule1, rule2))
        whenever(leadRepository.save(any())).thenAnswer { it.arguments[0] }

        val scoreChange = scoringService.applyActivityScoring(testLead, LeadActivityType.CALL)

        assertEquals(8, scoreChange)
        assertEquals(8, testLead.score)
    }

    @Test
    fun `getStats should return correct statistics`() {
        whenever(scoringRuleRepository.count()).thenReturn(5L)
        whenever(scoringRuleRepository.countActive()).thenReturn(3L)
        whenever(scoringRuleRepository.findActiveByTriggerType(any())).thenReturn(emptyList())

        val stats = scoringService.getStats()

        assertEquals(5L, stats.totalRules)
        assertEquals(3L, stats.activeRules)
    }
}
