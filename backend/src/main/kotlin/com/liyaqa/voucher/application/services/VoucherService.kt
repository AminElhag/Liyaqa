package com.liyaqa.voucher.application.services

import com.liyaqa.voucher.application.commands.CreateVoucherCommand
import com.liyaqa.voucher.application.commands.UpdateVoucherCommand
import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.ports.VoucherRepository
import com.liyaqa.voucher.domain.ports.VoucherUsageRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for CRUD operations on vouchers.
 */
@Service
@Transactional
class VoucherService(
    private val voucherRepository: VoucherRepository,
    private val usageRepository: VoucherUsageRepository
) {
    private val logger = LoggerFactory.getLogger(VoucherService::class.java)

    /**
     * Create a new voucher.
     */
    fun createVoucher(command: CreateVoucherCommand): Voucher {
        require(!voucherRepository.existsByCode(command.code)) {
            "Voucher with code ${command.code} already exists"
        }

        val voucher = Voucher(
            code = command.code.uppercase(),
            nameEn = command.nameEn,
            nameAr = command.nameAr,
            discountType = command.discountType,
            discountAmount = command.discountAmount,
            discountCurrency = command.discountCurrency,
            discountPercent = command.discountPercent,
            freeTrialDays = command.freeTrialDays,
            giftCardBalance = command.giftCardBalance,
            maxUses = command.maxUses,
            maxUsesPerMember = command.maxUsesPerMember,
            validFrom = command.validFrom,
            validUntil = command.validUntil,
            firstTimeMemberOnly = command.firstTimeMemberOnly,
            minimumPurchase = command.minimumPurchase,
            applicablePlanIds = command.applicablePlanIds,
            applicableProductIds = command.applicableProductIds
        )

        val saved = voucherRepository.save(voucher)
        logger.info("Created voucher ${saved.code} (${saved.id})")
        return saved
    }

    /**
     * Get a voucher by ID.
     */
    @Transactional(readOnly = true)
    fun getVoucher(id: UUID): Voucher {
        return voucherRepository.findById(id)
            .orElseThrow { NoSuchElementException("Voucher not found: $id") }
    }

    /**
     * Get a voucher by code.
     */
    @Transactional(readOnly = true)
    fun getVoucherByCode(code: String): Voucher? {
        return voucherRepository.findByCode(code.uppercase()).orElse(null)
    }

    /**
     * List all vouchers with pagination.
     */
    @Transactional(readOnly = true)
    fun listVouchers(pageable: Pageable): Page<Voucher> {
        return voucherRepository.findAll(pageable)
    }

    /**
     * List active vouchers.
     */
    @Transactional(readOnly = true)
    fun listActiveVouchers(pageable: Pageable): Page<Voucher> {
        return voucherRepository.findByIsActive(true, pageable)
    }

    /**
     * Update a voucher.
     */
    fun updateVoucher(command: UpdateVoucherCommand): Voucher {
        val voucher = getVoucher(command.id)

        command.nameEn?.let { voucher.nameEn = it }
        command.nameAr?.let { voucher.nameAr = it }
        command.discountAmount?.let { voucher.discountAmount = it }
        command.discountCurrency?.let { voucher.discountCurrency = it }
        command.discountPercent?.let { voucher.discountPercent = it }
        command.freeTrialDays?.let { voucher.freeTrialDays = it }
        command.maxUses?.let { voucher.maxUses = it }
        command.maxUsesPerMember?.let { voucher.maxUsesPerMember = it }
        command.validFrom?.let { voucher.validFrom = it }
        command.validUntil?.let { voucher.validUntil = it }
        command.firstTimeMemberOnly?.let { voucher.firstTimeMemberOnly = it }
        command.minimumPurchase?.let { voucher.minimumPurchase = it }
        command.applicablePlanIds?.let { voucher.applicablePlanIds = it }
        command.applicableProductIds?.let { voucher.applicableProductIds = it }
        command.isActive?.let { voucher.isActive = it }

        val saved = voucherRepository.save(voucher)
        logger.info("Updated voucher ${saved.code} (${saved.id})")
        return saved
    }

    /**
     * Activate a voucher.
     */
    fun activateVoucher(id: UUID): Voucher {
        val voucher = getVoucher(id)
        voucher.activate()
        val saved = voucherRepository.save(voucher)
        logger.info("Activated voucher ${saved.code}")
        return saved
    }

    /**
     * Deactivate a voucher.
     */
    fun deactivateVoucher(id: UUID): Voucher {
        val voucher = getVoucher(id)
        voucher.deactivate()
        val saved = voucherRepository.save(voucher)
        logger.info("Deactivated voucher ${saved.code}")
        return saved
    }

    /**
     * Delete a voucher.
     */
    fun deleteVoucher(id: UUID) {
        val voucher = getVoucher(id)
        require(voucher.currentUseCount == 0) {
            "Cannot delete a voucher that has been used"
        }
        voucherRepository.delete(voucher)
        logger.info("Deleted voucher ${voucher.code}")
    }

    /**
     * Get usage count for a voucher.
     */
    @Transactional(readOnly = true)
    fun getUsageCount(voucherId: UUID): Long {
        return usageRepository.countByVoucherId(voucherId)
    }

    /**
     * Check if voucher code exists.
     */
    @Transactional(readOnly = true)
    fun codeExists(code: String): Boolean {
        return voucherRepository.existsByCode(code.uppercase())
    }
}
