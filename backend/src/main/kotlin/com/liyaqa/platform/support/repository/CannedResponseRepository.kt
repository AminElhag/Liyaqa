package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.CannedResponse
import com.liyaqa.platform.support.model.TicketCategory
import java.util.Optional
import java.util.UUID

interface CannedResponseRepository {
    fun save(response: CannedResponse): CannedResponse
    fun findById(id: UUID): Optional<CannedResponse>
    fun findByCategory(category: TicketCategory): List<CannedResponse>
    fun findByIsActiveTrue(): List<CannedResponse>
    fun findByCategoryAndIsActiveTrue(category: TicketCategory): List<CannedResponse>
    fun deleteById(id: UUID)
}
