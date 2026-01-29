package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MembershipCategory
import com.liyaqa.membership.domain.model.MembershipCategoryType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for MembershipCategory entity.
 * Categories are tenant-scoped (belong to a club).
 */
interface MembershipCategoryRepository {
    fun save(category: MembershipCategory): MembershipCategory
    fun findById(id: UUID): Optional<MembershipCategory>
    fun findByCategoryType(type: MembershipCategoryType): Optional<MembershipCategory>
    fun findAll(pageable: Pageable): Page<MembershipCategory>
    fun findAllActive(pageable: Pageable): Page<MembershipCategory>
    fun findAllActive(): List<MembershipCategory>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    // Usage statistics
    fun countMembersByCategory(categoryId: UUID): Long
    fun countActiveMembersByCategory(categoryId: UUID): Long
    fun countPlansByCategory(categoryId: UUID): Long
}
