package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassPack
import com.liyaqa.scheduling.domain.model.ClassPackStatus
import com.liyaqa.scheduling.domain.ports.ClassPackRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClassPackRepository : JpaRepository<ClassPack, UUID> {
    fun findByStatus(status: ClassPackStatus, pageable: Pageable): Page<ClassPack>
    fun findByStatusOrderBySortOrderAsc(status: ClassPackStatus): List<ClassPack>
    fun findAllByOrderBySortOrderAsc(): List<ClassPack>
    fun countByStatus(status: ClassPackStatus): Long
}

@Repository
class JpaClassPackRepository(
    private val springDataRepository: SpringDataClassPackRepository
) : ClassPackRepository {

    override fun save(classPack: ClassPack): ClassPack =
        springDataRepository.save(classPack)

    override fun findById(id: UUID): Optional<ClassPack> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ClassPack> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: ClassPackStatus, pageable: Pageable): Page<ClassPack> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByStatusOrderBySortOrder(status: ClassPackStatus): List<ClassPack> =
        springDataRepository.findByStatusOrderBySortOrderAsc(status)

    override fun findAllOrderBySortOrder(): List<ClassPack> =
        springDataRepository.findAllByOrderBySortOrderAsc()

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: ClassPackStatus): Long =
        springDataRepository.countByStatus(status)
}
