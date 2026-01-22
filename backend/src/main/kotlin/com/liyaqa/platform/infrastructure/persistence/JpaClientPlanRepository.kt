package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientPlan
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClientPlanRepository : JpaRepository<ClientPlan, UUID> {
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<ClientPlan>

    @Query("SELECT p FROM ClientPlan p WHERE p.isActive = true ORDER BY p.sortOrder")
    fun findAllActiveOrderBySortOrder(): List<ClientPlan>

    fun findAllByOrderBySortOrderAsc(): List<ClientPlan>
}

@Repository
class JpaClientPlanRepository(
    private val springDataRepository: SpringDataClientPlanRepository
) : ClientPlanRepository {

    override fun save(plan: ClientPlan): ClientPlan =
        springDataRepository.save(plan)

    override fun findById(id: UUID): Optional<ClientPlan> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ClientPlan> =
        springDataRepository.findAll(pageable)

    override fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<ClientPlan> =
        springDataRepository.findByIsActive(isActive, pageable)

    override fun findAllActive(): List<ClientPlan> =
        springDataRepository.findAllActiveOrderBySortOrder()

    override fun findAllOrderBySortOrder(): List<ClientPlan> =
        springDataRepository.findAllByOrderBySortOrderAsc()

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()
}
