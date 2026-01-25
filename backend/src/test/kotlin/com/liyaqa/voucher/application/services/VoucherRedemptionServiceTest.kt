package com.liyaqa.voucher.application.services

import com.liyaqa.membership.application.services.WalletService
import com.liyaqa.shared.domain.Money
import com.liyaqa.voucher.application.commands.RedeemGiftCardCommand
import com.liyaqa.voucher.application.commands.RedeemVoucherCommand
import com.liyaqa.voucher.domain.model.DiscountType
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.model.VoucherUsage
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
class VoucherRedemptionServiceTest {

    @Mock
    private lateinit var voucherRepository: VoucherRepository

    @Mock
    private lateinit var usageRepository: VoucherUsageRepository

    @Mock
    private lateinit var validationService: VoucherValidationService

    @Mock
    private lateinit var walletService: WalletService

    private lateinit var redemptionService: VoucherRedemptionService

    private lateinit var testVoucher: Voucher
    private val testMemberId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        redemptionService = VoucherRedemptionService(
            voucherRepository,
            usageRepository,
            validationService,
            walletService
        )

        testVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "VALID20",
            nameEn = "Valid 20% Off",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("20.00"),
            discountCurrency = "SAR"
        )
    }

    @Test
    fun `redeemVoucher should redeem valid voucher`() {
        // Given
        val command = RedeemVoucherCommand(
            code = "VALID20",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00"),
            usedForType = "SUBSCRIPTION",
            usedForId = UUID.randomUUID()
        )

        val validationResult = VoucherValidationResult(
            valid = true,
            voucher = testVoucher,
            discountAmount = BigDecimal("20.00")
        )

        whenever(validationService.validate(any())) doReturn validationResult
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }
        whenever(usageRepository.save(any<VoucherUsage>())).thenAnswer { invocation ->
            invocation.getArgument<VoucherUsage>(0)
        }

        // When
        val result = redemptionService.redeemVoucher(command)

        // Then
        assertTrue(result.success)
        assertNotNull(result.voucher)
        assertNotNull(result.usage)
        assertEquals(BigDecimal("20.00"), result.discountApplied)
        assertNull(result.errorCode)
        verify(voucherRepository).save(any())
        verify(usageRepository).save(any())
    }

    @Test
    fun `redeemVoucher should fail for invalid voucher`() {
        // Given
        val command = RedeemVoucherCommand(
            code = "INVALID",
            memberId = testMemberId,
            purchaseAmount = BigDecimal("100.00"),
            usedForType = "SUBSCRIPTION"
        )

        val validationResult = VoucherValidationResult(
            valid = false,
            errorCode = "NOT_FOUND",
            errorMessage = "Voucher not found"
        )

        whenever(validationService.validate(any())) doReturn validationResult

        // When
        val result = redemptionService.redeemVoucher(command)

        // Then
        assertFalse(result.success)
        assertEquals("NOT_FOUND", result.errorCode)
        assertNull(result.voucher)
        verify(voucherRepository, never()).save(any())
        verify(usageRepository, never()).save(any())
    }

    @Test
    fun `redeemVoucher should track free trial days`() {
        // Given
        val trialVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "TRIAL7",
            nameEn = "7 Days Free Trial",
            discountType = DiscountType.FREE_TRIAL,
            freeTrialDays = 7
        )

        val command = RedeemVoucherCommand(
            code = "TRIAL7",
            memberId = testMemberId,
            purchaseAmount = BigDecimal.ZERO,
            usedForType = "SUBSCRIPTION"
        )

        val validationResult = VoucherValidationResult(
            valid = true,
            voucher = trialVoucher,
            discountAmount = BigDecimal.ZERO,
            freeTrialDays = 7
        )

        whenever(validationService.validate(any())) doReturn validationResult
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }
        whenever(usageRepository.save(any<VoucherUsage>())).thenAnswer { invocation ->
            invocation.getArgument<VoucherUsage>(0)
        }

        // When
        val result = redemptionService.redeemVoucher(command)

        // Then
        assertTrue(result.success)
        assertEquals(7, result.freeTrialDays)
    }

    @Test
    fun `redeemGiftCard should redeem full balance`() {
        // Given
        val giftCard = Voucher(
            id = UUID.randomUUID(),
            code = "GIFT100",
            nameEn = "Gift Card 100 SAR",
            discountType = DiscountType.GIFT_CARD,
            giftCardBalance = BigDecimal("100.00"),
            discountCurrency = "SAR"
        )

        val command = RedeemGiftCardCommand(
            code = "GIFT100",
            memberId = testMemberId
        )

        whenever(voucherRepository.findByCode("GIFT100")) doReturn Optional.of(giftCard)
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }
        whenever(usageRepository.save(any<VoucherUsage>())).thenAnswer { invocation ->
            invocation.getArgument<VoucherUsage>(0)
        }

        // When
        val result = redemptionService.redeemGiftCard(command)

        // Then
        assertTrue(result.success)
        assertEquals(BigDecimal("100.00"), result.discountApplied)
        verify(walletService).addCredit(
            eq(testMemberId),
            eq(Money.of(BigDecimal("100.00"), "SAR")),
            anyOrNull(),
            anyOrNull()
        )
    }

    @Test
    fun `redeemGiftCard should redeem partial amount`() {
        // Given
        val giftCard = Voucher(
            id = UUID.randomUUID(),
            code = "GIFT100",
            nameEn = "Gift Card 100 SAR",
            discountType = DiscountType.GIFT_CARD,
            giftCardBalance = BigDecimal("100.00"),
            discountCurrency = "SAR"
        )

        val command = RedeemGiftCardCommand(
            code = "GIFT100",
            memberId = testMemberId,
            amount = BigDecimal("50.00")
        )

        whenever(voucherRepository.findByCode("GIFT100")) doReturn Optional.of(giftCard)
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }
        whenever(usageRepository.save(any<VoucherUsage>())).thenAnswer { invocation ->
            invocation.getArgument<VoucherUsage>(0)
        }

        // When
        val result = redemptionService.redeemGiftCard(command)

        // Then
        assertTrue(result.success)
        assertEquals(BigDecimal("50.00"), result.discountApplied)
        verify(walletService).addCredit(
            eq(testMemberId),
            eq(Money.of(BigDecimal("50.00"), "SAR")),
            anyOrNull(),
            anyOrNull()
        )
    }

    @Test
    fun `redeemGiftCard should fail for non-existent voucher`() {
        // Given
        val command = RedeemGiftCardCommand(
            code = "NONEXISTENT",
            memberId = testMemberId
        )

        whenever(voucherRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = redemptionService.redeemGiftCard(command)

        // Then
        assertFalse(result.success)
        assertEquals("NOT_FOUND", result.errorCode)
        verify(walletService, never()).addCredit(any<UUID>(), any<Money>(), anyOrNull(), anyOrNull())
    }

    @Test
    fun `redeemGiftCard should fail for non-gift-card voucher`() {
        // Given
        val command = RedeemGiftCardCommand(
            code = "VALID20",
            memberId = testMemberId
        )

        whenever(voucherRepository.findByCode("VALID20")) doReturn Optional.of(testVoucher)

        // When
        val result = redemptionService.redeemGiftCard(command)

        // Then
        assertFalse(result.success)
        assertEquals("NOT_GIFT_CARD", result.errorCode)
        verify(walletService, never()).addCredit(any<UUID>(), any<Money>(), anyOrNull(), anyOrNull())
    }

    @Test
    fun `redeemGiftCard should fail for inactive gift card`() {
        // Given
        val giftCard = Voucher(
            id = UUID.randomUUID(),
            code = "GIFT100",
            nameEn = "Gift Card 100 SAR",
            discountType = DiscountType.GIFT_CARD,
            giftCardBalance = BigDecimal("100.00"),
            discountCurrency = "SAR"
        )
        giftCard.deactivate()

        val command = RedeemGiftCardCommand(
            code = "GIFT100",
            memberId = testMemberId
        )

        whenever(voucherRepository.findByCode("GIFT100")) doReturn Optional.of(giftCard)

        // When
        val result = redemptionService.redeemGiftCard(command)

        // Then
        assertFalse(result.success)
        assertEquals("NOT_VALID", result.errorCode)
    }

    @Test
    fun `redeemGiftCard should fail for zero balance gift card`() {
        // Given
        val giftCard = Voucher(
            id = UUID.randomUUID(),
            code = "GIFT100",
            nameEn = "Gift Card",
            discountType = DiscountType.GIFT_CARD,
            giftCardBalance = BigDecimal.ZERO,
            discountCurrency = "SAR"
        )

        val command = RedeemGiftCardCommand(
            code = "GIFT100",
            memberId = testMemberId
        )

        whenever(voucherRepository.findByCode("GIFT100")) doReturn Optional.of(giftCard)

        // When
        val result = redemptionService.redeemGiftCard(command)

        // Then
        assertFalse(result.success)
        assertEquals("NO_BALANCE", result.errorCode)
    }

    @Test
    fun `getVoucherUsage should return paginated results`() {
        // Given
        val usage = VoucherUsage(
            voucherId = testVoucher.id,
            memberId = testMemberId,
            usedForType = com.liyaqa.voucher.domain.model.UsageType.SUBSCRIPTION,
            discountApplied = BigDecimal("20.00"),
            discountCurrency = "SAR"
        )
        val pageable = PageRequest.of(0, 10)
        val page = PageImpl(listOf(usage), pageable, 1)

        whenever(usageRepository.findByVoucherId(testVoucher.id, pageable)) doReturn page

        // When
        val result = redemptionService.getVoucherUsage(testVoucher.id, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `getMemberUsage should return paginated results`() {
        // Given
        val usage = VoucherUsage(
            voucherId = testVoucher.id,
            memberId = testMemberId,
            usedForType = com.liyaqa.voucher.domain.model.UsageType.SUBSCRIPTION,
            discountApplied = BigDecimal("20.00"),
            discountCurrency = "SAR"
        )
        val pageable = PageRequest.of(0, 10)
        val page = PageImpl(listOf(usage), pageable, 1)

        whenever(usageRepository.findByMemberId(testMemberId, pageable)) doReturn page

        // When
        val result = redemptionService.getMemberUsage(testMemberId, pageable)

        // Then
        assertEquals(1, result.totalElements)
    }
}
