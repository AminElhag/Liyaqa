package com.liyaqa.voucher.application.services

import com.liyaqa.voucher.application.commands.ValidateVoucherCommand
import com.liyaqa.voucher.domain.model.DiscountType
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.ports.VoucherRepository
import com.liyaqa.voucher.domain.ports.VoucherUsageRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
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
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VoucherValidationServiceTest {

    @Mock
    private lateinit var voucherRepository: VoucherRepository

    @Mock
    private lateinit var usageRepository: VoucherUsageRepository

    private lateinit var validationService: VoucherValidationService

    private lateinit var testVoucher: Voucher
    private val testMemberId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        validationService = VoucherValidationService(voucherRepository, usageRepository)

        testVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "VALID20",
            nameEn = "Valid 20% Off",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("20.00"),
            maxUses = 100,
            maxUsesPerMember = 1
        )
    }

    @Test
    fun `validate should return valid result for valid percentage voucher`() {
        // Given
        val command = ValidateVoucherCommand(
            code = "VALID20",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("VALID20")) doReturn Optional.of(testVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(testVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertTrue(result.valid)
        assertNotNull(result.voucher)
        assertEquals(0, BigDecimal("20.00").compareTo(result.discountAmount))
        assertNull(result.errorCode)
    }

    @Test
    fun `validate should return valid result for fixed amount voucher`() {
        // Given
        val fixedVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "SAVE50",
            nameEn = "Save 50 SAR",
            discountType = DiscountType.FIXED_AMOUNT,
            discountAmount = BigDecimal("50.00"),
            discountCurrency = "SAR"
        )

        val command = ValidateVoucherCommand(
            code = "SAVE50",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("SAVE50")) doReturn Optional.of(fixedVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(fixedVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertTrue(result.valid)
        assertEquals(BigDecimal("50.00"), result.discountAmount)
    }

    @Test
    fun `validate should return free trial days for free trial voucher`() {
        // Given
        val trialVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "TRIAL7",
            nameEn = "7 Days Free Trial",
            discountType = DiscountType.FREE_TRIAL,
            freeTrialDays = 7
        )

        val command = ValidateVoucherCommand(
            code = "TRIAL7",
            memberId = testMemberId,
            purchaseAmount = BigDecimal.ZERO
        )

        whenever(voucherRepository.findByCode("TRIAL7")) doReturn Optional.of(trialVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(trialVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertTrue(result.valid)
        assertEquals(7, result.freeTrialDays)
        assertEquals(BigDecimal.ZERO, result.discountAmount)
    }

    @Test
    fun `validate should return NOT_FOUND for non-existent voucher`() {
        // Given
        val command = ValidateVoucherCommand(
            code = "NONEXISTENT",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("NOT_FOUND", result.errorCode)
        assertNull(result.voucher)
    }

    @Test
    fun `validate should return INACTIVE for inactive voucher`() {
        // Given
        testVoucher.deactivate()
        val command = ValidateVoucherCommand(
            code = "VALID20",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("VALID20")) doReturn Optional.of(testVoucher)

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("INACTIVE", result.errorCode)
    }

    @Test
    fun `validate should return EXPIRED for expired voucher`() {
        // Given
        val expiredVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "EXPIRED",
            nameEn = "Expired Voucher",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00"),
            validUntil = Instant.now().minusSeconds(86400) // Yesterday
        )

        val command = ValidateVoucherCommand(
            code = "EXPIRED",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("EXPIRED")) doReturn Optional.of(expiredVoucher)

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("EXPIRED", result.errorCode)
    }

    @Test
    fun `validate should return LIMIT_REACHED when max uses exceeded`() {
        // Given
        val limitedVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "LIMITED",
            nameEn = "Limited Voucher",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00"),
            maxUses = 1,
            currentUseCount = 1
        )

        val command = ValidateVoucherCommand(
            code = "LIMITED",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("LIMITED")) doReturn Optional.of(limitedVoucher)

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("LIMIT_REACHED", result.errorCode)
    }

    @Test
    fun `validate should return MEMBER_LIMIT_REACHED when member used voucher`() {
        // Given
        val command = ValidateVoucherCommand(
            code = "VALID20",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00")
        )

        whenever(voucherRepository.findByCode("VALID20")) doReturn Optional.of(testVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(testVoucher.id, testMemberId)) doReturn 1L

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("MEMBER_LIMIT_REACHED", result.errorCode)
    }

    @Test
    fun `validate should return FIRST_TIME_ONLY for non-first-time member`() {
        // Given
        val firstTimeVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "FIRSTTIME",
            nameEn = "First Time Only",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("30.00"),
            firstTimeMemberOnly = true
        )

        val command = ValidateVoucherCommand(
            code = "FIRSTTIME",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00"),
            isFirstTimeMember = false
        )

        whenever(voucherRepository.findByCode("FIRSTTIME")) doReturn Optional.of(firstTimeVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(firstTimeVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("FIRST_TIME_ONLY", result.errorCode)
    }

    @Test
    fun `validate should return valid for first-time member with first-time voucher`() {
        // Given
        val firstTimeVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "FIRSTTIME",
            nameEn = "First Time Only",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("30.00"),
            firstTimeMemberOnly = true
        )

        val command = ValidateVoucherCommand(
            code = "FIRSTTIME",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00"),
            isFirstTimeMember = true
        )

        whenever(voucherRepository.findByCode("FIRSTTIME")) doReturn Optional.of(firstTimeVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(firstTimeVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertTrue(result.valid)
    }

    @Test
    fun `validate should return MINIMUM_NOT_MET when purchase is too low`() {
        // Given
        val minPurchaseVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "MIN100",
            nameEn = "Min 100 SAR",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00"),
            minimumPurchase = BigDecimal("100.00")
        )

        val command = ValidateVoucherCommand(
            code = "MIN100",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("50.00")
        )

        whenever(voucherRepository.findByCode("MIN100")) doReturn Optional.of(minPurchaseVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(minPurchaseVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("MINIMUM_NOT_MET", result.errorCode)
    }

    @Test
    fun `validate should return valid when minimum purchase is met`() {
        // Given
        val minPurchaseVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "MIN100",
            nameEn = "Min 100 SAR",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00"),
            minimumPurchase = BigDecimal("100.00")
        )

        val command = ValidateVoucherCommand(
            code = "MIN100",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("150.00")
        )

        whenever(voucherRepository.findByCode("MIN100")) doReturn Optional.of(minPurchaseVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(minPurchaseVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertTrue(result.valid)
        assertEquals(0, BigDecimal("15.00").compareTo(result.discountAmount))
    }

    @Test
    fun `validate should return NOT_APPLICABLE_PLAN when plan is not allowed`() {
        // Given
        val planId = UUID.randomUUID()
        val allowedPlanId = UUID.randomUUID()
        val planVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "PLANONLY",
            nameEn = "Plan Specific",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00"),
            applicablePlanIds = listOf(allowedPlanId)
        )

        val command = ValidateVoucherCommand(
            code = "PLANONLY",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00"),
            planId = planId
        )

        whenever(voucherRepository.findByCode("PLANONLY")) doReturn Optional.of(planVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(planVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertFalse(result.valid)
        assertEquals("NOT_APPLICABLE_PLAN", result.errorCode)
    }

    @Test
    fun `validate should return valid when plan is allowed`() {
        // Given
        val planId = UUID.randomUUID()
        val planVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "PLANONLY",
            nameEn = "Plan Specific",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00"),
            applicablePlanIds = listOf(planId)
        )

        val command = ValidateVoucherCommand(
            code = "PLANONLY",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00"),
            planId = planId
        )

        whenever(voucherRepository.findByCode("PLANONLY")) doReturn Optional.of(planVoucher)
        whenever(usageRepository.countByVoucherIdAndMemberId(planVoucher.id, testMemberId)) doReturn 0L

        // When
        val result = validationService.validate(command)

        // Then
        assertTrue(result.valid)
    }

    @Test
    fun `isValidCode should return true for valid voucher`() {
        // Given
        whenever(voucherRepository.findByCode("VALID20")) doReturn Optional.of(testVoucher)

        // When
        val result = validationService.isValidCode("valid20")

        // Then
        assertTrue(result)
    }

    @Test
    fun `isValidCode should return false for invalid voucher`() {
        // Given
        whenever(voucherRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = validationService.isValidCode("nonexistent")

        // Then
        assertFalse(result)
    }

    @Test
    fun `isValidCode should return false for inactive voucher`() {
        // Given
        testVoucher.deactivate()
        whenever(voucherRepository.findByCode("VALID20")) doReturn Optional.of(testVoucher)

        // When
        val result = validationService.isValidCode("valid20")

        // Then
        assertFalse(result)
    }
}
