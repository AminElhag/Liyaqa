package com.liyaqa.accounts.domain.ports

import com.liyaqa.accounts.domain.model.AccountStatus
import com.liyaqa.accounts.domain.model.FamilyGroup
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

interface FamilyGroupRepository {
    fun save(familyGroup: FamilyGroup): FamilyGroup
    fun findById(id: UUID): Optional<FamilyGroup>
    fun findAll(pageable: Pageable): Page<FamilyGroup>
    fun findByStatus(status: AccountStatus, pageable: Pageable): Page<FamilyGroup>
    fun findByPrimaryMemberId(memberId: UUID): Optional<FamilyGroup>
    fun findByMemberId(memberId: UUID): Optional<FamilyGroup>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
