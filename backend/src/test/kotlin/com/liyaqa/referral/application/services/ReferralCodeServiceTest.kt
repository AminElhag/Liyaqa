package com.liyaqa.referral.application.services

import com.liyaqa.referral.domain.model.ReferralCode
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.RewardType
import com.liyaqa.referral.domain.ports.ReferralCodeRepository
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
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
import org.mockito.kotlin.doReturn
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
class ReferralCodeServiceTest {

    @Mock
    private lateinit var codeRepository: ReferralCodeRepository

    @Mock
    private lateinit var configRepository: ReferralConfigRepository

    private lateinit var codeService: ReferralCodeService

    private lateinit var testCode: ReferralCode
    private lateinit var testConfig: ReferralConfig
    private val testMemberId = UUID.randomUUID()
    private val testTenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        TenantContext.setCurrentTenant(TenantId(testTenantId))
        codeService = ReferralCodeService(codeRepository, configRepository)

        testCode = ReferralCode(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            code = "REF123456"
        )

        testConfig = ReferralConfig(
            id = UUID.randomUUID(),
            codePrefix = "INVITE",
            referrerRewardType = RewardType.WALLET_CREDIT,
            referrerRewardAmount = BigDecimal("50.00")
        )
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    @Test
    fun `getOrCreateCode should return existing code`() {
        // Given
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.of(testCode)

        // When
        val result = codeService.getOrCreateCode(testMemberId)

        // Then
        assertEquals(testCode.id, result.id)
        assertEquals(testCode.code, result.code)
        verify(codeRepository, never()).save(any())
    }

    @Test
    fun `getOrCreateCode should create new code when none exists`() {
        // Given
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.empty()
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        whenever(codeRepository.existsByCode(any())) doReturn false
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        val result = codeService.getOrCreateCode(testMemberId)

        // Then
        assertTrue(result.code.startsWith("INVITE"))
        assertEquals(testMemberId, result.memberId)
        verify(codeRepository).save(any())
    }

    @Test
    fun `getOrCreateCode should use default prefix when no config exists`() {
        // Given
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.empty()
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.empty()
        whenever(codeRepository.existsByCode(any())) doReturn false
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        val result = codeService.getOrCreateCode(testMemberId)

        // Then
        assertTrue(result.code.startsWith("REF"))
    }

    @Test
    fun `getOrCreateCode should retry on duplicate code`() {
        // Given
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.empty()
        whenever(configRepository.findByTenantId(testTenantId)) doReturn Optional.of(testConfig)
        // First call returns true (duplicate), second returns false
        whenever(codeRepository.existsByCode(any()))
            .thenReturn(true)
            .thenReturn(false)
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        val result = codeService.getOrCreateCode(testMemberId)

        // Then
        assertNotNull(result)
    }

    @Test
    fun `getByCode should return code when found`() {
        // Given
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)

        // When
        val result = codeService.getByCode("REF123456")

        // Then
        assertNotNull(result)
        assertEquals(testCode.code, result?.code)
    }

    @Test
    fun `getByCode should return null when not found`() {
        // Given
        whenever(codeRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = codeService.getByCode("NONEXISTENT")

        // Then
        assertNull(result)
    }

    @Test
    fun `getByMemberId should return code when found`() {
        // Given
        whenever(codeRepository.findByMemberId(testMemberId)) doReturn Optional.of(testCode)

        // When
        val result = codeService.getByMemberId(testMemberId)

        // Then
        assertNotNull(result)
        assertEquals(testCode.memberId, result?.memberId)
    }

    @Test
    fun `getByMemberId should return null when not found`() {
        // Given
        val memberId = UUID.randomUUID()
        whenever(codeRepository.findByMemberId(memberId)) doReturn Optional.empty()

        // When
        val result = codeService.getByMemberId(memberId)

        // Then
        assertNull(result)
    }

    @Test
    fun `listCodes should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val codes = listOf(testCode)
        val page = PageImpl(codes, pageable, 1)

        whenever(codeRepository.findAll(pageable)) doReturn page

        // When
        val result = codeService.listCodes(pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testCode, result.content[0])
    }

    @Test
    fun `getTopReferrers should return top referrers`() {
        // Given
        val topReferrer = ReferralCode(
            id = UUID.randomUUID(),
            memberId = UUID.randomUUID(),
            code = "TOP123",
            conversionCount = 10
        )
        whenever(codeRepository.findTopReferrers(10)) doReturn listOf(topReferrer, testCode)

        // When
        val result = codeService.getTopReferrers(10)

        // Then
        assertEquals(2, result.size)
        assertEquals(10, result[0].conversionCount)
    }

    @Test
    fun `activateCode should activate inactive code`() {
        // Given
        testCode.deactivate()
        whenever(codeRepository.findById(testCode.id)) doReturn Optional.of(testCode)
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        val result = codeService.activateCode(testCode.id)

        // Then
        assertTrue(result.isActive)
    }

    @Test
    fun `activateCode should throw when code not found`() {
        // Given
        val codeId = UUID.randomUUID()
        whenever(codeRepository.findById(codeId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            codeService.activateCode(codeId)
        }
    }

    @Test
    fun `deactivateCode should deactivate active code`() {
        // Given
        whenever(codeRepository.findById(testCode.id)) doReturn Optional.of(testCode)
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        val result = codeService.deactivateCode(testCode.id)

        // Then
        assertFalse(result.isActive)
    }

    @Test
    fun `deactivateCode should throw when code not found`() {
        // Given
        val codeId = UUID.randomUUID()
        whenever(codeRepository.findById(codeId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            codeService.deactivateCode(codeId)
        }
    }

    @Test
    fun `recordClick should increment click count for active code`() {
        // Given
        val initialClicks = testCode.clickCount
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        codeService.recordClick("REF123456")

        // Then
        assertEquals(initialClicks + 1, testCode.clickCount)
        verify(codeRepository).save(testCode)
    }

    @Test
    fun `recordClick should not increment for inactive code`() {
        // Given
        testCode.deactivate()
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)

        // When
        codeService.recordClick("REF123456")

        // Then
        verify(codeRepository, never()).save(any())
    }

    @Test
    fun `recordClick should handle non-existent code gracefully`() {
        // Given
        whenever(codeRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        codeService.recordClick("NONEXISTENT")

        // Then
        verify(codeRepository, never()).save(any())
    }

    @Test
    fun `recordConversion should increment conversion count`() {
        // Given
        val initialConversions = testCode.conversionCount
        whenever(codeRepository.findByCode("REF123456")) doReturn Optional.of(testCode)
        whenever(codeRepository.save(any<ReferralCode>())).thenAnswer { invocation ->
            invocation.getArgument<ReferralCode>(0)
        }

        // When
        codeService.recordConversion("REF123456")

        // Then
        assertEquals(initialConversions + 1, testCode.conversionCount)
        verify(codeRepository).save(testCode)
    }

    @Test
    fun `recordConversion should handle non-existent code gracefully`() {
        // Given
        whenever(codeRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        codeService.recordConversion("NONEXISTENT")

        // Then
        verify(codeRepository, never()).save(any())
    }
}
