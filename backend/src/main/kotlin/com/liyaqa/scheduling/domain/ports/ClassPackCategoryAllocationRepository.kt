package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassPackCategoryAllocation
import java.util.Optional
import java.util.UUID

interface ClassPackCategoryAllocationRepository {
    fun save(allocation: ClassPackCategoryAllocation): ClassPackCategoryAllocation
    fun saveAll(allocations: List<ClassPackCategoryAllocation>): List<ClassPackCategoryAllocation>
    fun findById(id: UUID): Optional<ClassPackCategoryAllocation>
    fun findByClassPackId(classPackId: UUID): List<ClassPackCategoryAllocation>
    fun deleteByClassPackId(classPackId: UUID)
    fun deleteById(id: UUID)
}
