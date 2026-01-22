package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberWallet
import com.liyaqa.membership.domain.ports.MemberWalletRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for MemberWallet.
 */
interface SpringDataMemberWalletRepository : JpaRepository<MemberWallet, UUID> {
    fun findByMemberId(memberId: UUID): Optional<MemberWallet>
    fun existsByMemberId(memberId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaMemberWalletRepository(
    private val springDataRepository: SpringDataMemberWalletRepository
) : MemberWalletRepository {

    override fun save(wallet: MemberWallet): MemberWallet {
        return springDataRepository.save(wallet)
    }

    override fun findById(id: UUID): Optional<MemberWallet> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID): Optional<MemberWallet> {
        return springDataRepository.findByMemberId(memberId)
    }

    override fun existsByMemberId(memberId: UUID): Boolean {
        return springDataRepository.existsByMemberId(memberId)
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }
}
