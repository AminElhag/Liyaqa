package com.liyaqa.accounts.infrastructure.persistence

import com.liyaqa.accounts.domain.model.AccountStatus
import com.liyaqa.accounts.domain.model.FamilyGroup
import com.liyaqa.accounts.domain.ports.FamilyGroupRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataFamilyGroupRepository : JpaRepository<FamilyGroup, UUID> {
    fun findByStatus(status: AccountStatus, pageable: Pageable): Page<FamilyGroup>
    fun findByPrimaryMemberId(memberId: UUID): Optional<FamilyGroup>

    @Query("SELECT fg FROM FamilyGroup fg JOIN fg.members m WHERE m.memberId = :memberId")
    fun findByMemberId(@Param("memberId") memberId: UUID): Optional<FamilyGroup>
}

@Repository
class JpaFamilyGroupRepository(
    private val springDataRepository: SpringDataFamilyGroupRepository
) : FamilyGroupRepository {

    override fun save(familyGroup: FamilyGroup): FamilyGroup =
        springDataRepository.save(familyGroup)

    override fun findById(id: UUID): Optional<FamilyGroup> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<FamilyGroup> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: AccountStatus, pageable: Pageable): Page<FamilyGroup> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByPrimaryMemberId(memberId: UUID): Optional<FamilyGroup> =
        springDataRepository.findByPrimaryMemberId(memberId)

    override fun findByMemberId(memberId: UUID): Optional<FamilyGroup> =
        springDataRepository.findByMemberId(memberId)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
