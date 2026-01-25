package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.AssignmentRuleConfig
import com.liyaqa.crm.application.commands.CreateAssignmentRuleCommand
import com.liyaqa.crm.application.commands.SourceMappingInput
import com.liyaqa.crm.application.commands.UpdateAssignmentRuleCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadAssignmentRule
import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.RoundRobinConfig
import com.liyaqa.crm.domain.model.SourceBasedConfig
import com.liyaqa.crm.domain.model.SourceMapping
import com.liyaqa.crm.domain.ports.LeadAssignmentRuleRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
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
class LeadAssignmentServiceTest {

    @Mock
    private lateinit var assignmentRuleRepository: LeadAssignmentRuleRepository

    private lateinit var assignmentService: LeadAssignmentService

    private lateinit var testLead: Lead
    private val user1Id = UUID.randomUUID()
    private val user2Id = UUID.randomUUID()
    private val user3Id = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        assignmentService = LeadAssignmentService(assignmentRuleRepository)

        testLead = Lead(
            id = UUID.randomUUID(),
            name = "Test Lead",
            email = "test@example.com",
            source = LeadSource.REFERRAL
        )
    }

    @Test
    fun `createRule should create a round-robin rule`() {
        val command = CreateAssignmentRuleCommand(
            name = "Round Robin Assignment",
            ruleType = LeadAssignmentRuleType.ROUND_ROBIN,
            priority = 1,
            isActive = true,
            config = AssignmentRuleConfig.RoundRobin(userIds = listOf(user1Id, user2Id))
        )

        val savedRule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Round Robin Assignment",
            ruleType = LeadAssignmentRuleType.ROUND_ROBIN,
            priority = 1,
            isActive = true
        ).apply {
            setRoundRobinConfig(RoundRobinConfig(userIds = listOf(user1Id, user2Id)))
        }

        whenever(assignmentRuleRepository.save(any())).thenReturn(savedRule)

        val result = assignmentService.createRule(command)

        assertNotNull(result)
        assertEquals("Round Robin Assignment", result.name)
        assertEquals(LeadAssignmentRuleType.ROUND_ROBIN, result.ruleType)
        verify(assignmentRuleRepository).save(any())
    }

    @Test
    fun `createRule should create a source-based rule`() {
        val command = CreateAssignmentRuleCommand(
            name = "Source Assignment",
            ruleType = LeadAssignmentRuleType.SOURCE_BASED,
            priority = 1,
            isActive = true,
            config = AssignmentRuleConfig.SourceBased(
                sourceMappings = listOf(
                    SourceMappingInput("REFERRAL", user1Id),
                    SourceMappingInput("WEBSITE", user2Id)
                ),
                defaultUserId = user3Id
            )
        )

        val savedRule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Source Assignment",
            ruleType = LeadAssignmentRuleType.SOURCE_BASED,
            priority = 1,
            isActive = true
        ).apply {
            setSourceConfig(SourceBasedConfig(
                sourceMappings = listOf(
                    SourceMapping(LeadSource.REFERRAL, user1Id),
                    SourceMapping(LeadSource.WEBSITE, user2Id)
                ),
                defaultUserId = user3Id
            ))
        }

        whenever(assignmentRuleRepository.save(any())).thenReturn(savedRule)

        val result = assignmentService.createRule(command)

        assertNotNull(result)
        assertEquals("Source Assignment", result.name)
        assertEquals(LeadAssignmentRuleType.SOURCE_BASED, result.ruleType)
    }

    @Test
    fun `getRule should return rule when found`() {
        val ruleId = UUID.randomUUID()
        val rule = LeadAssignmentRule(
            id = ruleId,
            name = "Test Rule",
            ruleType = LeadAssignmentRuleType.MANUAL,
            priority = 1,
            isActive = true
        )

        whenever(assignmentRuleRepository.findById(ruleId)).thenReturn(Optional.of(rule))

        val result = assignmentService.getRule(ruleId)

        assertNotNull(result)
        assertEquals(ruleId, result.id)
    }

    @Test
    fun `getRule should throw exception when not found`() {
        val nonExistentId = UUID.randomUUID()
        whenever(assignmentRuleRepository.findById(nonExistentId)).thenReturn(Optional.empty())

        assertThrows(NoSuchElementException::class.java) {
            assignmentService.getRule(nonExistentId)
        }
    }

    @Test
    fun `autoAssign should assign using round-robin`() {
        val rule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Round Robin",
            ruleType = LeadAssignmentRuleType.ROUND_ROBIN,
            priority = 1,
            isActive = true
        ).apply {
            setRoundRobinConfig(RoundRobinConfig(userIds = listOf(user1Id, user2Id, user3Id), lastAssignedIndex = -1))
        }

        whenever(assignmentRuleRepository.findAllActiveOrderByPriority()).thenReturn(listOf(rule))
        whenever(assignmentRuleRepository.save(any())).thenAnswer { it.arguments[0] }

        val assignedUserId = assignmentService.autoAssign(testLead)

        assertEquals(user1Id, assignedUserId)
        assertEquals(user1Id, testLead.assignedToUserId)
    }

    @Test
    fun `autoAssign should cycle through round-robin users`() {
        val rule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Round Robin",
            ruleType = LeadAssignmentRuleType.ROUND_ROBIN,
            priority = 1,
            isActive = true
        ).apply {
            setRoundRobinConfig(RoundRobinConfig(userIds = listOf(user1Id, user2Id, user3Id), lastAssignedIndex = 0))
        }

        whenever(assignmentRuleRepository.findAllActiveOrderByPriority()).thenReturn(listOf(rule))
        whenever(assignmentRuleRepository.save(any())).thenAnswer { it.arguments[0] }

        val assignedUserId = assignmentService.autoAssign(testLead)

        assertEquals(user2Id, assignedUserId)
    }

    @Test
    fun `autoAssign should assign using source-based rule`() {
        val rule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Source Based",
            ruleType = LeadAssignmentRuleType.SOURCE_BASED,
            priority = 1,
            isActive = true
        ).apply {
            setSourceConfig(SourceBasedConfig(
                sourceMappings = listOf(
                    SourceMapping(LeadSource.REFERRAL, user1Id),
                    SourceMapping(LeadSource.WEBSITE, user2Id)
                ),
                defaultUserId = user3Id
            ))
        }

        whenever(assignmentRuleRepository.findAllActiveOrderByPriority()).thenReturn(listOf(rule))

        // Lead with REFERRAL source
        val assignedUserId = assignmentService.autoAssign(testLead)

        assertEquals(user1Id, assignedUserId)
        assertEquals(user1Id, testLead.assignedToUserId)
    }

    @Test
    fun `autoAssign should use default user when source not mapped`() {
        val rule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Source Based",
            ruleType = LeadAssignmentRuleType.SOURCE_BASED,
            priority = 1,
            isActive = true
        ).apply {
            setSourceConfig(SourceBasedConfig(
                sourceMappings = listOf(
                    SourceMapping(LeadSource.WEBSITE, user2Id)
                ),
                defaultUserId = user3Id
            ))
        }

        whenever(assignmentRuleRepository.findAllActiveOrderByPriority()).thenReturn(listOf(rule))

        // Lead with REFERRAL source (not mapped)
        val assignedUserId = assignmentService.autoAssign(testLead)

        assertEquals(user3Id, assignedUserId)
    }

    @Test
    fun `autoAssign should return null when no active rules`() {
        whenever(assignmentRuleRepository.findAllActiveOrderByPriority()).thenReturn(emptyList())

        val assignedUserId = assignmentService.autoAssign(testLead)

        assertNull(assignedUserId)
        assertNull(testLead.assignedToUserId)
    }

    @Test
    fun `autoAssign should skip manual rules`() {
        val manualRule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Manual Only",
            ruleType = LeadAssignmentRuleType.MANUAL,
            priority = 1,
            isActive = true
        )

        whenever(assignmentRuleRepository.findAllActiveOrderByPriority()).thenReturn(listOf(manualRule))

        val assignedUserId = assignmentService.autoAssign(testLead)

        assertNull(assignedUserId)
    }

    @Test
    fun `autoAssign should try rules in priority order`() {
        val lowPriorityRule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "Low Priority",
            ruleType = LeadAssignmentRuleType.SOURCE_BASED,
            priority = 10,
            isActive = true
        ).apply {
            setSourceConfig(SourceBasedConfig(
                sourceMappings = listOf(SourceMapping(LeadSource.REFERRAL, user2Id)),
                defaultUserId = null
            ))
        }

        val highPriorityRule = LeadAssignmentRule(
            id = UUID.randomUUID(),
            name = "High Priority",
            ruleType = LeadAssignmentRuleType.SOURCE_BASED,
            priority = 1,
            isActive = true
        ).apply {
            setSourceConfig(SourceBasedConfig(
                sourceMappings = listOf(SourceMapping(LeadSource.REFERRAL, user1Id)),
                defaultUserId = null
            ))
        }

        // Repository returns rules sorted by priority (ascending)
        whenever(assignmentRuleRepository.findAllActiveOrderByPriority())
            .thenReturn(listOf(highPriorityRule, lowPriorityRule))

        val assignedUserId = assignmentService.autoAssign(testLead)

        // Should be assigned by high priority rule
        assertEquals(user1Id, assignedUserId)
    }

    @Test
    fun `getStats should return correct statistics`() {
        whenever(assignmentRuleRepository.count()).thenReturn(5L)
        whenever(assignmentRuleRepository.countActive()).thenReturn(3L)
        whenever(assignmentRuleRepository.findActiveByTypeOrderByPriority(any())).thenReturn(emptyList())

        val stats = assignmentService.getStats()

        assertEquals(5L, stats.totalRules)
        assertEquals(3L, stats.activeRules)
    }
}
