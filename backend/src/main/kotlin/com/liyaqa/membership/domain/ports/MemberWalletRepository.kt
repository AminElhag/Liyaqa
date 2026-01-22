package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberWallet
import java.util.Optional
import java.util.UUID

/**
 * Repository port for MemberWallet entity.
 */
interface MemberWalletRepository {
    fun save(wallet: MemberWallet): MemberWallet
    fun findById(id: UUID): Optional<MemberWallet>
    fun findByMemberId(memberId: UUID): Optional<MemberWallet>
    fun existsByMemberId(memberId: UUID): Boolean
    fun deleteByMemberId(memberId: UUID)
}
