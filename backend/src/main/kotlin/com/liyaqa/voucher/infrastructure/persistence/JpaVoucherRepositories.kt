package com.liyaqa.voucher.infrastructure.persistence

import com.liyaqa.voucher.domain.model.Voucher
import com.liyaqa.voucher.domain.model.VoucherUsage
import com.liyaqa.voucher.domain.ports.VoucherRepository
import com.liyaqa.voucher.domain.ports.VoucherUsageRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

// ============ Spring Data Interfaces ============

interface SpringDataVoucherRepository : JpaRepository<Voucher, UUID> {
    fun findByCode(code: String): Optional<Voucher>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<Voucher>
    fun existsByCode(code: String): Boolean
}

interface SpringDataVoucherUsageRepository : JpaRepository<VoucherUsage, UUID> {
    fun findByVoucherId(voucherId: UUID, pageable: Pageable): Page<VoucherUsage>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<VoucherUsage>
    fun countByVoucherIdAndMemberId(voucherId: UUID, memberId: UUID): Long
    fun countByVoucherId(voucherId: UUID): Long
}

// ============ Repository Implementations ============

@Repository
class JpaVoucherRepository(
    private val springDataRepository: SpringDataVoucherRepository
) : VoucherRepository {

    override fun save(voucher: Voucher): Voucher {
        return springDataRepository.save(voucher)
    }

    override fun findById(id: UUID): Optional<Voucher> {
        return springDataRepository.findById(id)
    }

    override fun findByCode(code: String): Optional<Voucher> {
        return springDataRepository.findByCode(code)
    }

    override fun findAll(pageable: Pageable): Page<Voucher> {
        return springDataRepository.findAll(pageable)
    }

    override fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<Voucher> {
        return springDataRepository.findByIsActive(isActive, pageable)
    }

    override fun existsByCode(code: String): Boolean {
        return springDataRepository.existsByCode(code)
    }

    override fun delete(voucher: Voucher) {
        springDataRepository.delete(voucher)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }
}

@Repository
class JpaVoucherUsageRepository(
    private val springDataRepository: SpringDataVoucherUsageRepository
) : VoucherUsageRepository {

    override fun save(usage: VoucherUsage): VoucherUsage {
        return springDataRepository.save(usage)
    }

    override fun findById(id: UUID): Optional<VoucherUsage> {
        return springDataRepository.findById(id)
    }

    override fun findByVoucherId(voucherId: UUID, pageable: Pageable): Page<VoucherUsage> {
        return springDataRepository.findByVoucherId(voucherId, pageable)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<VoucherUsage> {
        return springDataRepository.findByMemberId(memberId, pageable)
    }

    override fun countByVoucherIdAndMemberId(voucherId: UUID, memberId: UUID): Long {
        return springDataRepository.countByVoucherIdAndMemberId(voucherId, memberId)
    }

    override fun countByVoucherId(voucherId: UUID): Long {
        return springDataRepository.countByVoucherId(voucherId)
    }
}
