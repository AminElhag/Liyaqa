package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.FreezeHistory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface FreezeHistoryRepository {
    fun save(history: FreezeHistory): FreezeHistory
    fun findById(id: UUID): Optional<FreezeHistory>
    fun findBySubscriptionId(subscriptionId: UUID): List<FreezeHistory>
    fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<FreezeHistory>
    fun findActiveBySubscriptionId(subscriptionId: UUID): Optional<FreezeHistory>
    fun countBySubscriptionId(subscriptionId: UUID): Long
    fun deleteById(id: UUID)
}
