package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.DealActivity
import com.liyaqa.platform.domain.ports.DealActivityRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

interface SpringDataDealActivityRepository : JpaRepository<DealActivity, UUID> {
    fun findByDealIdOrderByCreatedAtDesc(dealId: UUID): List<DealActivity>
    fun countByDealId(dealId: UUID): Long
}

@Repository
class JpaDealActivityRepository(
    private val springDataRepository: SpringDataDealActivityRepository
) : DealActivityRepository {

    override fun save(activity: DealActivity): DealActivity =
        springDataRepository.save(activity)

    override fun findByDealId(dealId: UUID): List<DealActivity> =
        springDataRepository.findByDealIdOrderByCreatedAtDesc(dealId)

    override fun countByDealId(dealId: UUID): Long =
        springDataRepository.countByDealId(dealId)
}
