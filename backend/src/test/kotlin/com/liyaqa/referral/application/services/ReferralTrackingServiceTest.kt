package com.liyaqa.referral.application.services

import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralCode
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.model.RewardType
import com.liyaqa.referral.domain.ports.ReferralCodeRepository
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.referral.domain.ports.ReferralRepository
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
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
import org.mockito.kotlin.doNothing
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
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
class ReferralTrackingServiceTest {

    @Mock
    private lateinit var referralRepository: ReferralRepository

    @Mock
    private lateinit var codeRepository: ReferralCodeRepository

    @Mock
    private lateinit var configRepository: ReferralConfigRepository

    @Mock
    private lateinit var codeService: ReferralCodeService

    private lateinit var trackingService: ReferralTrackingService

    private lateinit var testCode: ReferralCode
    private lateinit var testConfig: ReferralConfig
    private lateinit var testReferral: Referral
    private val testMemberId = UUID.randomUUID()
    private val testTenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        TenantContext.setCurrentTenant(TenantId(testTenantId))
        trackingService = ReferralTrackingService(
            referralRepository,
            codeRepository,
            configRepository,
            codeService
        )

        testCode = ReferralCode(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            code = "REF123456"
        )

        testConfig = ReferralConfig(
            id = UUID.randomUUID(),
            isEnabled = true,
            codePrefix = "REF",
            referrerRewardType = RewardType.WALLET_CREDIT,
            referrerRewardAmount = BigDecimal("50.00")
        )

        testReferral = Referral(
            id = UUID.randomUUID(),
            referralCodeId = testCode.id,
            referrerMemberId = testMemberId
        )
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    @Test
    fun `trackClick should create referral for valid code`() {
        // Given
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        doNothing().whenever(codeService).recordClick(any())
        whenever(referralRepository.save(any<Referral>())).thenAnswer { invocation ->
            invocation.getArgument<Referral>(0)
        }

        // When
        val result = trackingService.trackClick("REF123456")

        // Then
        assertNotNull(result)
        assertEquals(testCode.id, result?.referralCodeId)
        assertEquals(testMemberId, result?.referrerMemberId)
        assertEquals(ReferralStatus.CLICKED, result?.status)
    }

    @Test
    fun `trackClick should return null for non-existent code`() {
        // Given
        whenever(codeRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = trackingService.trackClick("NONEXISTENT")

        // Then
        assertNull(result)
    }

    @Test
    fun `trackClick should return null for inactive code`() {
        // Given
        testCode.deactivate()
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)

        // When
        val result = trackingService.trackClick("REF123456")

        // Then
        assertNull(result)
    }

    @Test
    fun `trackClick should return null when program is disabled`() {
        // Given
        testConfig.isEnabled = false
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = trackingService.trackClick("REF123456")

        // Then
        assertNull(result)
    }

    @Test
    fun `trackClick should return null when max referrals limit reached`() {
        // Given
        testConfig.maxReferralsPerMember = 5
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(referralRepository.countByReferrerMemberIdAndStatus(testMemberId, ReferralStatus.CONVERTED)) doReturn 5L

        // When
        val result = trackingService.trackClick("REF123456")

        // Then
        assertNull(result)
    }

    @Test
    fun `markSignedUp should update referral with referee member id`() {
        // Given
        val refereeMemberId = UUID.randomUUID()
        whenever(referralRepository.findById(testReferral.id)) doReturn Optional.of(testReferral)
        whenever(referralRepository.save(any<Referral>())).thenAnswer { invocation ->
            invocation.getArgument<Referral>(0)
        }

        // When
        val result = trackingService.markSignedUp(testReferral.id, refereeMemberId)

        // Then
        assertEquals(ReferralStatus.SIGNED_UP, result.status)
        assertEquals(refereeMemberId, result.refereeMemberId)
    }

    @Test
    fun `markSignedUp should throw when referral not found`() {
        // Given
        val referralId = UUID.randomUUID()
        whenever(referralRepository.findById(referralId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            trackingService.markSignedUp(referralId, UUID.randomUUID())
        }
    }

    @Test
    fun `markSignedUp should reject already converted referral`() {
        // Given
        testReferral.markConverted(UUID.randomUUID())
        whenever(referralRepository.findById(testReferral.id)) doReturn Optional.of(testReferral)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            trackingService.markSignedUp(testReferral.id, UUID.randomUUID())
        }
    }

    @Test
    fun `convertReferral should mark referral as converted`() {
        // Given
        val refereeMemberId = UUID.randomUUID()
        val subscriptionId = UUID.randomUUID()
        testReferral.markSignedUp(refereeMemberId)

        whenever(referralRepository.findByRefereeMemberId(refereeMemberId)) doReturn Optional.of(testReferral)
        whenever(codeRepository.findById(testCode.id)) doReturn Optional.of(testCode)
        doNothing().whenever(codeService).recordConversion(any())
        whenever(referralRepository.save(any<Referral>())).thenAnswer { invocation ->
            invocation.getArgument<Referral>(0)
        }

        // When
        val result = trackingService.convertReferral(refereeMemberId, subscriptionId)

        // Then
        assertNotNull(result)
        assertEquals(ReferralStatus.CONVERTED, result?.status)
        assertEquals(subscriptionId, result?.subscriptionId)
        assertNotNull(result?.convertedAt)
    }

    @Test
    fun `convertReferral should return null when no referral found`() {
        // Given
        val memberId = UUID.randomUUID()
        whenever(referralRepository.findByRefereeMemberId(memberId)) doReturn Optional.empty()

        // When
        val result = trackingService.convertReferral(memberId, UUID.randomUUID())

        // Then
        assertNull(result)
    }

    @Test
    fun `convertReferral should return null when referral cannot convert`() {
        // Given
        val refereeMemberId = UUID.randomUUID()
        testReferral.markConverted(UUID.randomUUID()) // Already converted
        whenever(referralRepository.findByRefereeMemberId(refereeMemberId)) doReturn Optional.of(testReferral)

        // When
        val result = trackingService.convertReferral(refereeMemberId, UUID.randomUUID())

        // Then
        assertNull(result)
    }

    @Test
    fun `validateCode should return true for valid active code`() {
        // Given
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = trackingService.validateCode("REF123456")

        // Then
        assertTrue(result)
    }

    @Test
    fun `validateCode should return false for non-existent code`() {
        // Given
        whenever(codeRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = trackingService.validateCode("NONEXISTENT")

        // Then
        assertFalse(result)
    }

    @Test
    fun `validateCode should return false for inactive code`() {
        // Given
        testCode.deactivate()
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)

        // When
        val result = trackingService.validateCode("REF123456")

        // Then
        assertFalse(result)
    }

    @Test
    fun `validateCode should return false when program is disabled`() {
        // Given
        testConfig.isEnabled = false
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)

        // When
        val result = trackingService.validateCode("REF123456")

        // Then
        assertFalse(result)
    }

    @Test
    fun `validateCode should return false when max referrals limit reached`() {
        // Given
        testConfig.maxReferralsPerMember = 5
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(referralRepository.countByReferrerMemberIdAndStatus(testMemberId, ReferralStatus.CONVERTED)) doReturn 5L

        // When
        val result = trackingService.validateCode("REF123456")

        // Then
        assertFalse(result)
    }

    @Test
    fun `getReferralsByReferrer should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val referrals = listOf(testReferral)
        val page = PageImpl(referrals, pageable, 1)

        whenever(referralRepository.findByReferrerMemberId(testMemberId, pageable)) doReturn page

        // When
        val result = trackingService.getReferralsByReferrer(testMemberId, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `getReferralsByStatus should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val referrals = listOf(testReferral)
        val page = PageImpl(referrals, pageable, 1)

        whenever(referralRepository.findByStatus(ReferralStatus.CLICKED, pageable)) doReturn page

        // When
        val result = trackingService.getReferralsByStatus(ReferralStatus.CLICKED, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `getMemberStats should return statistics`() {
        // Given
        testCode.clickCount = 100
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.of(testCode)
        whenever(referralRepository.countByReferrerMemberId(testMemberId)) doReturn 50L
        whenever(referralRepository.countByReferrerMemberIdAndStatus(testMemberId, ReferralStatus.CONVERTED)) doReturn 10L

        // When
        val result = trackingService.getMemberStats(testMemberId)

        // Then
        assertEquals("REF123456", result.code)
        assertEquals(100, result.clickCount)
        assertEquals(50L, result.totalReferrals)
        assertEquals(10L, result.conversions)
        assertEquals(0.1, result.conversionRate)
    }

    @Test
    fun `getMemberStats should handle member with no code`() {
        // Given
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.empty()
        whenever(referralRepository.countByReferrerMemberId(testMemberId)) doReturn 0L
        whenever(referralRepository.countByReferrerMemberIdAndStatus(testMemberId, ReferralStatus.CONVERTED)) doReturn 0L

        // When
        val result = trackingService.getMemberStats(testMemberId)

        // Then
        assertNull(result.code)
        assertEquals(0, result.clickCount)
        assertEquals(0.0, result.conversionRate)
    }
}
