package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.FreezeHistory
import com.liyaqa.membership.domain.ports.FreezeHistoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

@Repository
class JpaFreezeHistoryRepository(
    private val springData: SpringDataFreezeHistoryRepository
) : FreezeHistoryRepository {

    override fun save(history: FreezeHistory): FreezeHistory = springData.save(history)

    override fun findById(id: UUID): Optional<FreezeHistory> = springData.findById(id)

    override fun findBySubscriptionId(subscriptionId: UUID): List<FreezeHistory> =
        springData.findBySubscriptionIdOrderByFreezeStartDateDesc(subscriptionId)

    override fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<FreezeHistory> =
        springData.findBySubscriptionId(subscriptionId, pageable)

    override fun findActiveBySubscriptionId(subscriptionId: UUID): Optional<FreezeHistory> =
        springData.findBySubscriptionIdAndFreezeEndDateIsNull(subscriptionId)

    override fun countBySubscriptionId(subscriptionId: UUID): Long =
        springData.countBySubscriptionId(subscriptionId)

    override fun deleteById(id: UUID) = springData.deleteById(id)
}

interface SpringDataFreezeHistoryRepository : JpaRepository<FreezeHistory, UUID> {
    fun findBySubscriptionIdOrderByFreezeStartDateDesc(subscriptionId: UUID): List<FreezeHistory>
    fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<FreezeHistory>
    fun findBySubscriptionIdAndFreezeEndDateIsNull(subscriptionId: UUID): Optional<FreezeHistory>
    fun countBySubscriptionId(subscriptionId: UUID): Long
}
