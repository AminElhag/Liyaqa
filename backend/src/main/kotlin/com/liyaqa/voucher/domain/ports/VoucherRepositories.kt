package com.liyaqa.voucher.domain.ports

import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.model.VoucherUsage
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository for vouchers.
 */
interface VoucherRepository {
    fun save(voucher: Voucher): Voucher
    fun findById(id: UUID): Optional<Voucher>
    fun findByCode(code: String): Optional<Voucher>
    fun findAll(pageable: Pageable): Page<Voucher>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<Voucher>
    fun existsByCode(code: String): Boolean
    fun delete(voucher: Voucher)
    fun deleteById(id: UUID)
}

/**
 * Repository for voucher usage tracking.
 */
interface VoucherUsageRepository {
    fun save(usage: VoucherUsage): VoucherUsage
    fun findById(id: UUID): Optional<VoucherUsage>
    fun findByVoucherId(voucherId: UUID, pageable: Pageable): Page<VoucherUsage>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<VoucherUsage>
    fun countByVoucherIdAndMemberId(voucherId: UUID, memberId: UUID): Long
    fun countByVoucherId(voucherId: UUID): Long
}
