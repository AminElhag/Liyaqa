package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MembershipCategory
import com.liyaqa.membership.domain.model.MembershipCategoryType
import com.liyaqa.membership.domain.ports.MembershipCategoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataMembershipCategoryRepository : JpaRepository<MembershipCategory, UUID> {
    @Query("SELECT c FROM MembershipCategory c WHERE c.categoryType = :type")
    fun findByCategoryType(@Param("type") type: MembershipCategoryType): Optional<MembershipCategory>

    @Query("SELECT c FROM MembershipCategory c WHERE c.isActive = true")
    fun findAllActive(pageable: Pageable): Page<MembershipCategory>

    @Query("SELECT c FROM MembershipCategory c WHERE c.isActive = true")
    fun findAllActive(): List<MembershipCategory>

    @Query("SELECT COUNT(DISTINCT c.memberId) FROM MembershipContract c WHERE c.categoryId = :categoryId")
    fun countMembersByCategory(@Param("categoryId") categoryId: UUID): Long

    @Query("SELECT COUNT(DISTINCT c.memberId) FROM MembershipContract c WHERE c.categoryId = :categoryId AND c.status = 'ACTIVE'")
    fun countActiveMembersByCategory(@Param("categoryId") categoryId: UUID): Long

    @Query("SELECT COUNT(p) FROM MembershipPlan p WHERE p.categoryId = :categoryId")
    fun countPlansByCategory(@Param("categoryId") categoryId: UUID): Long
}

@Repository
class JpaMembershipCategoryRepository(
    private val springDataRepository: SpringDataMembershipCategoryRepository
) : MembershipCategoryRepository {

    override fun save(category: MembershipCategory): MembershipCategory =
        springDataRepository.save(category)

    override fun findById(id: UUID): Optional<MembershipCategory> =
        springDataRepository.findById(id)

    override fun findByCategoryType(type: MembershipCategoryType): Optional<MembershipCategory> =
        springDataRepository.findByCategoryType(type)

    override fun findAll(pageable: Pageable): Page<MembershipCategory> =
        springDataRepository.findAll(pageable)

    override fun findAllActive(pageable: Pageable): Page<MembershipCategory> =
        springDataRepository.findAllActive(pageable)

    override fun findAllActive(): List<MembershipCategory> =
        springDataRepository.findAllActive()

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countMembersByCategory(categoryId: UUID): Long =
        springDataRepository.countMembersByCategory(categoryId)

    override fun countActiveMembersByCategory(categoryId: UUID): Long =
        springDataRepository.countActiveMembersByCategory(categoryId)

    override fun countPlansByCategory(categoryId: UUID): Long =
        springDataRepository.countPlansByCategory(categoryId)
}
