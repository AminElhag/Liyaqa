package com.liyaqa.referral.application.services

import com.liyaqa.referral.application.commands.UpdateReferralConfigCommand
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.RewardType
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReferralConfigServiceTest {

    @Mock
    private lateinit var configRepository: ReferralConfigRepository

    private lateinit var configService: ReferralConfigService

    private lateinit var testConfig: ReferralConfig
    private val testTenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        TenantContext.setCurrentTenant(TenantId(testTenantId))
        configService = ReferralConfigService(configRepository)

        testConfig = ReferralConfig(
            id = UUID.randomUUID(),
            isEnabled = false,
            codePrefix = "REF",
            referrerRewardType = RewardType.WALLET_CREDIT,
            referrerRewardAmount = BigDecimal("50.00"),
            referrerRewardCurrency = "SAR"
        )
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    @Test
    fun `getConfig should return existing config`() {
        // Given
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = configService.getConfig()

        // Then
        assertEquals(testConfig.id, result.id)
        assertEquals(testConfig.codePrefix, result.codePrefix)
    }

    @Test
    fun `getConfig should create default config when none exists`() {
        // Given
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.empty()
        whenever(configRepository.save(any<ReferralConfig>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralConfig>(0)
        }

        // When
        val result = configService.getConfig()

        // Then
        assertFalse(result.isEnabled)
        assertEquals("REF", result.codePrefix)
    }

    @Test
    fun `updateConfig should update all fields`() {
        // Given
        val command = UpdateReferralConfigCommand(
            isEnabled = true,
            codePrefix = "INVITE",
            referrerRewardType = RewardType.WALLET_CREDIT,
            referrerRewardAmount = BigDecimal("100.00"),
            referrerRewardCurrency = "SAR",
            referrerFreeDays = null,
            minSubscriptionDays = 60,
            maxReferralsPerMember = 10
        )

        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(configRepository.save(any<ReferralConfig>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralConfig>(0)
        }

        // When
        val result = configService.updateConfig(command)

        // Then
        assertTrue(result.isEnabled)
        assertEquals("INVITE", result.codePrefix)
        assertEquals(BigDecimal("100.00"), result.referrerRewardAmount)
        assertEquals(60, result.minSubscriptionDays)
        assertEquals(10, result.maxReferralsPerMember)
    }

    @Test
    fun `updateConfig should update to FREE_DAYS reward type`() {
        // Given
        val command = UpdateReferralConfigCommand(
            isEnabled = true,
            codePrefix = "REF",
            referrerRewardType = RewardType.FREE_DAYS,
            referrerRewardAmount = null,
            referrerRewardCurrency = "SAR",
            referrerFreeDays = 14,
            minSubscriptionDays = 30,
            maxReferralsPerMember = null
        )

        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(configRepository.save(any<ReferralConfig>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralConfig>(0)
        }

        // When
        val result = configService.updateConfig(command)

        // Then
        assertEquals(RewardType.FREE_DAYS, result.referrerRewardType)
        assertEquals(14, result.referrerFreeDays)
    }

    @Test
    fun `enable should enable config with valid reward configuration`() {
        // Given
        testConfig.referrerRewardAmount = BigDecimal("50.00")
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(configRepository.save(any<ReferralConfig>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralConfig>(0)
        }

        // When
        val result = configService.enable()

        // Then
        assertTrue(result.isEnabled)
    }

    @Test
    fun `enable should reject config without valid reward configuration`() {
        // Given
        testConfig.referrerRewardAmount = null
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            configService.enable()
        }
    }

    @Test
    fun `disable should disable config`() {
        // Given
        testConfig.isEnabled = true
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(configRepository.save(any<ReferralConfig>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralConfig>(0)
        }

        // When
        val result = configService.disable()

        // Then
        assertFalse(result.isEnabled)
    }

    @Test
    fun `isEnabled should return true when enabled`() {
        // Given
        testConfig.isEnabled = true
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = configService.isEnabled()

        // Then
        assertTrue(result)
    }

    @Test
    fun `isEnabled should return false when disabled`() {
        // Given
        testConfig.isEnabled = false
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = configService.isEnabled()

        // Then
        assertFalse(result)
    }

    @Test
    fun `isEnabled should return false when no config exists`() {
        // Given
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.empty()

        // When
        val result = configService.isEnabled()

        // Then
        assertFalse(result)
    }
}
