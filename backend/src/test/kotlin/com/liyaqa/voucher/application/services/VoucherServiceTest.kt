package com.liyaqa.voucher.application.services

import com.liyaqa.voucher.application.commands.CreateVoucherCommand
import com.liyaqa.voucher.application.commands.UpdateVoucherCommand
import com.liyaqa.voucher.domain.model.DiscountType
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.ports.VoucherRepository
import com.liyaqa.voucher.domain.ports.VoucherUsageRepository
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
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VoucherServiceTest {

    @Mock
    private lateinit var voucherRepository: VoucherRepository

    @Mock
    private lateinit var usageRepository: VoucherUsageRepository

    private lateinit var voucherService: VoucherService

    private lateinit var testVoucher: Voucher

    @BeforeEach
    fun setUp() {
        voucherService = VoucherService(voucherRepository, usageRepository)

        testVoucher = Voucher(
            id = UUID.randomUUID(),
            code = "SUMMER20",
            nameEn = "Summer Sale 20%",
            nameAr = "تخفيضات الصيف 20%",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("20.00"),
            maxUses = 100,
            maxUsesPerMember = 1
        )
    }

    @Test
    fun `createVoucher should create voucher with percentage discount`() {
        // Given
        val command = CreateVoucherCommand(
            code = "NEWCODE",
            nameEn = "New Voucher",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("15.00")
        )

        whenever(voucherRepository.existsByCode("NEWCODE")) doReturn false
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.createVoucher(command)

        // Then
        assertEquals("NEWCODE", result.code)
        assertEquals("New Voucher", result.nameEn)
        assertEquals(DiscountType.PERCENTAGE, result.discountType)
        assertEquals(BigDecimal("15.00"), result.discountPercent)
        assertTrue(result.isActive)
        verify(voucherRepository).save(any())
    }

    @Test
    fun `createVoucher should create voucher with fixed amount discount`() {
        // Given
        val command = CreateVoucherCommand(
            code = "SAVE50",
            nameEn = "Save 50 SAR",
            discountType = DiscountType.FIXED_AMOUNT,
            discountAmount = BigDecimal("50.00"),
            discountCurrency = "SAR"
        )

        whenever(voucherRepository.existsByCode("SAVE50")) doReturn false
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.createVoucher(command)

        // Then
        assertEquals(DiscountType.FIXED_AMOUNT, result.discountType)
        assertEquals(BigDecimal("50.00"), result.discountAmount)
        assertEquals("SAR", result.discountCurrency)
    }

    @Test
    fun `createVoucher should uppercase the code`() {
        // Given
        val command = CreateVoucherCommand(
            code = "lowercase",
            nameEn = "Test",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00")
        )

        whenever(voucherRepository.existsByCode("LOWERCASE")) doReturn false
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.createVoucher(command)

        // Then
        assertEquals("LOWERCASE", result.code)
    }

    @Test
    fun `createVoucher should reject duplicate code`() {
        // Given
        val command = CreateVoucherCommand(
            code = "EXISTING",
            nameEn = "Test",
            discountType = DiscountType.PERCENTAGE,
            discountPercent = BigDecimal("10.00")
        )

        whenever(voucherRepository.existsByCode("EXISTING")) doReturn true

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            voucherService.createVoucher(command)
        }
        verify(voucherRepository, never()).save(any())
    }

    @Test
    fun `createVoucher should create gift card voucher`() {
        // Given
        val command = CreateVoucherCommand(
            code = "GIFT100",
            nameEn = "Gift Card 100 SAR",
            discountType = DiscountType.GIFT_CARD,
            giftCardBalance = BigDecimal("100.00"),
            discountCurrency = "SAR"
        )

        whenever(voucherRepository.existsByCode("GIFT100")) doReturn false
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.createVoucher(command)

        // Then
        assertEquals(DiscountType.GIFT_CARD, result.discountType)
        assertEquals(BigDecimal("100.00"), result.giftCardBalance)
    }

    @Test
    fun `createVoucher should create free trial voucher`() {
        // Given
        val command = CreateVoucherCommand(
            code = "TRIAL7",
            nameEn = "7 Days Free Trial",
            discountType = DiscountType.FREE_TRIAL,
            freeTrialDays = 7
        )

        whenever(voucherRepository.existsByCode("TRIAL7")) doReturn false
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.createVoucher(command)

        // Then
        assertEquals(DiscountType.FREE_TRIAL, result.discountType)
        assertEquals(7, result.freeTrialDays)
    }

    @Test
    fun `getVoucher should return voucher when found`() {
        // Given
        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)

        // When
        val result = voucherService.getVoucher(testVoucher.id)

        // Then
        assertEquals(testVoucher.id, result.id)
        assertEquals(testVoucher.code, result.code)
    }

    @Test
    fun `getVoucher should throw when not found`() {
        // Given
        val voucherId = UUID.randomUUID()
        whenever(voucherRepository.findById(voucherId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            voucherService.getVoucher(voucherId)
        }
    }

    @Test
    fun `getVoucherByCode should return voucher when found`() {
        // Given
        whenever(voucherRepository.findByCode("SUMMER20")) doReturn Optional.of(testVoucher)

        // When
        val result = voucherService.getVoucherByCode("summer20")

        // Then
        assertNotNull(result)
        assertEquals(testVoucher.code, result?.code)
    }

    @Test
    fun `getVoucherByCode should return null when not found`() {
        // Given
        whenever(voucherRepository.findByCode("NONEXISTENT")) doReturn Optional.empty()

        // When
        val result = voucherService.getVoucherByCode("nonexistent")

        // Then
        assertNull(result)
    }

    @Test
    fun `listVouchers should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val vouchers = listOf(testVoucher)
        val page = PageImpl(vouchers, pageable, 1)

        whenever(voucherRepository.findAll(pageable)) doReturn page

        // When
        val result = voucherService.listVouchers(pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testVoucher, result.content[0])
    }

    @Test
    fun `listActiveVouchers should return only active vouchers`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val vouchers = listOf(testVoucher)
        val page = PageImpl(vouchers, pageable, 1)

        whenever(voucherRepository.findByIsActive(true, pageable)) doReturn page

        // When
        val result = voucherService.listActiveVouchers(pageable)

        // Then
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `updateVoucher should update fields`() {
        // Given
        val command = UpdateVoucherCommand(
            id = testVoucher.id,
            nameEn = "Updated Name",
            discountPercent = BigDecimal("25.00")
        )

        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.updateVoucher(command)

        // Then
        assertEquals("Updated Name", result.nameEn)
        assertEquals(BigDecimal("25.00"), result.discountPercent)
    }

    @Test
    fun `updateVoucher should update validity dates`() {
        // Given
        val validFrom = Instant.now()
        val validUntil = Instant.now().plusSeconds(86400 * 30)

        val command = UpdateVoucherCommand(
            id = testVoucher.id,
            validFrom = validFrom,
            validUntil = validUntil
        )

        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.updateVoucher(command)

        // Then
        assertEquals(validFrom, result.validFrom)
        assertEquals(validUntil, result.validUntil)
    }

    @Test
    fun `activateVoucher should activate voucher`() {
        // Given
        testVoucher.deactivate()
        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.activateVoucher(testVoucher.id)

        // Then
        assertTrue(result.isActive)
    }

    @Test
    fun `deactivateVoucher should deactivate voucher`() {
        // Given
        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)
        whenever(voucherRepository.save(any<Voucher>())).thenAnswer { invocation ->
            invocation.getArgument<Voucher>(0)
        }

        // When
        val result = voucherService.deactivateVoucher(testVoucher.id)

        // Then
        assertFalse(result.isActive)
    }

    @Test
    fun `deleteVoucher should delete unused voucher`() {
        // Given
        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)

        // When
        voucherService.deleteVoucher(testVoucher.id)

        // Then
        verify(voucherRepository).delete(testVoucher)
    }

    @Test
    fun `deleteVoucher should reject used voucher`() {
        // Given
        testVoucher.recordUse()
        whenever(voucherRepository.findById(testVoucher.id)) doReturn Optional.of(testVoucher)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            voucherService.deleteVoucher(testVoucher.id)
        }
        verify(voucherRepository, never()).delete(any())
    }

    @Test
    fun `getUsageCount should return count from repository`() {
        // Given
        whenever(usageRepository.countByVoucherId(testVoucher.id)) doReturn 5L

        // When
        val result = voucherService.getUsageCount(testVoucher.id)

        // Then
        assertEquals(5L, result)
    }

    @Test
    fun `codeExists should return true when code exists`() {
        // Given
        whenever(voucherRepository.existsByCode("SUMMER20")) doReturn true

        // When
        val result = voucherService.codeExists("summer20")

        // Then
        assertTrue(result)
    }

    @Test
    fun `codeExists should return false when code does not exist`() {
        // Given
        whenever(voucherRepository.existsByCode("NONEXISTENT")) doReturn false

        // When
        val result = voucherService.codeExists("nonexistent")

        // Then
        assertFalse(result)
    }
}
