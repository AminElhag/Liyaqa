package com.liyaqa.referral.application.services

import com.liyaqa.membership.application.services.WalletService
import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.ReferralReward
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.model.RewardStatus
import com.liyaqa.referral.domain.model.RewardType
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.referral.domain.ports.ReferralRewardRepository
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReferralRewardServiceTest {

    @Mock
    private lateinit var rewardRepository: ReferralRewardRepository

    @Mock
    private lateinit var configRepository: ReferralConfigRepository

    @Mock
    private lateinit var walletService: WalletService

    private lateinit var rewardService: ReferralRewardService

    private lateinit var testReferral: Referral
    private lateinit var testConfig: ReferralConfig
    private lateinit var testReward: ReferralReward
    private val testMemberId = UUID.randomUUID()
    private val testTenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        TenantContext.setCurrentTenant(TenantId(testTenantId))
        rewardService = ReferralRewardService(
            rewardRepository,
            configRepository,
            walletService
        )

        testReferral = Referral(
            id = UUID.randomUUID(),
            referralCodeId = UUID.randomUUID(),
            referrerMemberId = testMemberId,
            status = ReferralStatus.CONVERTED
        )

        testConfig = ReferralConfig(
            id = UUID.randomUUID(),
            isEnabled = true,
            codePrefix = "REF",
            referrerRewardType = RewardType.WALLET_CREDIT,
            referrerRewardAmount = BigDecimal("50.00"),
            referrerRewardCurrency = "SAR"
        )

        testReward = ReferralReward(
            id = UUID.randomUUID(),
            referralId = testReferral.id,
            memberId = testMemberId,
            rewardType = RewardType.WALLET_CREDIT,
            amount = BigDecimal("50.00"),
            currency = "SAR"
        )
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    @Test
    fun `createReward should create wallet credit reward`() {
        // Given
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When
        val result = rewardService.createReward(testReferral)

        // Then
        assertNotNull(result)
        assertEquals(testReferral.id, result?.referralId)
        assertEquals(testMemberId, result?.memberId)
        assertEquals(RewardType.WALLET_CREDIT, result?.rewardType)
        assertEquals(BigDecimal("50.00"), result?.amount)
        assertEquals(RewardStatus.PENDING, result?.status)
    }

    @Test
    fun `createReward should return null when no config exists`() {
        // Given
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.empty()

        // When
        val result = rewardService.createReward(testReferral)

        // Then
        assertNull(result)
    }

    @Test
    fun `createReward should return null when program is disabled`() {
        // Given
        testConfig.isEnabled = false
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = rewardService.createReward(testReferral)

        // Then
        assertNull(result)
    }

    @Test
    fun `createReward should return null when reward config is invalid`() {
        // Given
        testConfig.referrerRewardAmount = null
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = rewardService.createReward(testReferral)

        // Then
        assertNull(result)
    }

    @Test
    fun `distributeReward should distribute wallet credit reward`() {
        // Given
        whenever(rewardRepository.findById(testReward.id)) doReturn Optional.of(testReward)
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When
        val result = rewardService.distributeReward(testReward.id)

        // Then
        assertEquals(RewardStatus.DISTRIBUTED, result.status)
        assertNotNull(result.distributedAt)
        verify(walletService).addCredit(
            eq(testMemberId),
            eq(Money.of(BigDecimal("50.00"), "SAR")),
            anyOrNull(),
            anyOrNull()
        )
    }

    @Test
    fun `distributeReward should distribute free days reward`() {
        // Given
        val freeDaysReward = ReferralReward(
            id = UUID.randomUUID(),
            referralId = testReferral.id,
            memberId = testMemberId,
            rewardType = RewardType.FREE_DAYS,
            amount = null,
            currency = "SAR"
        )
        whenever(rewardRepository.findById(freeDaysReward.id)) doReturn Optional.of(freeDaysReward)
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When
        val result = rewardService.distributeReward(freeDaysReward.id)

        // Then
        assertEquals(RewardStatus.DISTRIBUTED, result.status)
        verify(walletService, never()).addCredit(any<UUID>(), any<Money>(), anyOrNull(), anyOrNull())
    }

    @Test
    fun `distributeReward should throw when reward not found`() {
        // Given
        val rewardId = UUID.randomUUID()
        whenever(rewardRepository.findById(rewardId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            rewardService.distributeReward(rewardId)
        }
    }

    @Test
    fun `distributeReward should reject already distributed reward`() {
        // Given
        testReward.markDistributed()
        whenever(rewardRepository.findById(testReward.id)) doReturn Optional.of(testReward)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            rewardService.distributeReward(testReward.id)
        }
    }

    @Test
    fun `distributeReward should mark as failed on wallet error`() {
        // Given
        whenever(rewardRepository.findById(testReward.id)) doReturn Optional.of(testReward)
        whenever(walletService.addCredit(any<UUID>(), any<Money>(), anyOrNull(), anyOrNull())).thenThrow(RuntimeException("Wallet error"))
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When/Then
        assertThrows(RuntimeException::class.java) {
            rewardService.distributeReward(testReward.id)
        }
        assertEquals(RewardStatus.FAILED, testReward.status)
    }

    @Test
    fun `processPendingRewards should process batch of rewards`() {
        // Given
        val pendingRewards = listOf(testReward)
        whenever(rewardRepository.findPendingRewards(100)) doReturn pendingRewards
        whenever(rewardRepository.findById(testReward.id)) doReturn Optional.of(testReward)
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When
        val count = rewardService.processPendingRewards(100)

        // Then
        assertEquals(1, count)
    }

    @Test
    fun `processPendingRewards should continue on individual reward failure`() {
        // Given
        val reward1 = ReferralReward(
            id = UUID.randomUUID(),
            referralId = testReferral.id,
            memberId = testMemberId,
            rewardType = RewardType.WALLET_CREDIT,
            amount = BigDecimal("50.00"),
            currency = "SAR"
        )
        val reward2 = ReferralReward(
            id = UUID.randomUUID(),
            referralId = testReferral.id,
            memberId = testMemberId,
            rewardType = RewardType.FREE_DAYS,
            amount = null,
            currency = "SAR"
        )

        whenever(rewardRepository.findPendingRewards(100)) doReturn listOf(reward1, reward2)
        whenever(rewardRepository.findById(reward1.id)) doReturn Optional.of(reward1)
        whenever(rewardRepository.findById(reward2.id)) doReturn Optional.of(reward2)
        whenever(walletService.addCredit(any<UUID>(), any<Money>(), anyOrNull(), anyOrNull())).thenThrow(RuntimeException("Wallet error"))
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When
        val count = rewardService.processPendingRewards(100)

        // Then
        assertEquals(1, count) // Only reward2 succeeded
    }

    @Test
    fun `getMemberRewards should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val rewards = listOf(testReward)
        val page = PageImpl(rewards, pageable, 1)

        whenever(rewardRepository.findByMemberId(testMemberId, pageable)) doReturn page

        // When
        val result = rewardService.getMemberRewards(testMemberId, pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testReward, result.content[0])
    }

    @Test
    fun `getReferralRewards should return rewards for referral`() {
        // Given
        whenever(rewardRepository.findByReferralId(testReferral.id)) doReturn listOf(testReward)

        // When
        val result = rewardService.getReferralRewards(testReferral.id)

        // Then
        assertEquals(1, result.size)
        assertEquals(testReward, result[0])
    }

    @Test
    fun `cancelReward should cancel pending reward`() {
        // Given
        whenever(rewardRepository.findById(testReward.id)) doReturn Optional.of(testReward)
        whenever(rewardRepository.save(any<ReferralReward>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralReward>(0)
        }

        // When
        val result = rewardService.cancelReward(testReward.id)

        // Then
        assertEquals(RewardStatus.CANCELLED, result.status)
    }

    @Test
    fun `cancelReward should throw when reward not found`() {
        // Given
        val rewardId = UUID.randomUUID()
        whenever(rewardRepository.findById(rewardId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            rewardService.cancelReward(rewardId)
        }
    }

    @Test
    fun `cancelReward should reject already distributed reward`() {
        // Given
        testReward.markDistributed()
        whenever(rewardRepository.findById(testReward.id)) doReturn Optional.of(testReward)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            rewardService.cancelReward(testReward.id)
        }
    }
}
