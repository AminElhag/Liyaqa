package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassPackCategoryAllocation
import com.liyaqa.scheduling.domain.ports.ClassPackCategoryAllocationRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClassPackCategoryAllocationRepository : JpaRepository<ClassPackCategoryAllocation, UUID> {
    fun findByClassPackId(classPackId: UUID): List<ClassPackCategoryAllocation>
    fun deleteByClassPackId(classPackId: UUID)
}

@Repository
class JpaClassPackCategoryAllocationRepository(
    private val springDataRepository: SpringDataClassPackCategoryAllocationRepository
) : ClassPackCategoryAllocationRepository {

    override fun save(allocation: ClassPackCategoryAllocation): ClassPackCategoryAllocation =
        springDataRepository.save(allocation)

    override fun saveAll(allocations: List<ClassPackCategoryAllocation>): List<ClassPackCategoryAllocation> =
        springDataRepository.saveAll(allocations)

    override fun findById(id: UUID): Optional<ClassPackCategoryAllocation> =
        springDataRepository.findById(id)

    override fun findByClassPackId(classPackId: UUID): List<ClassPackCategoryAllocation> =
        springDataRepository.findByClassPackId(classPackId)

    override fun deleteByClassPackId(classPackId: UUID) =
        springDataRepository.deleteByClassPackId(classPackId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
