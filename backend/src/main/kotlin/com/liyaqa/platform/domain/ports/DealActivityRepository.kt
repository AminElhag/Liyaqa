package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.DealActivity
import java.util.UUID

interface DealActivityRepository {
    fun save(activity: DealActivity): DealActivity
    fun findByDealId(dealId: UUID): List<DealActivity>
    fun countByDealId(dealId: UUID): Long
}
