package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.TicketStatusHistory
import java.util.UUID

interface TicketStatusHistoryRepository {
    fun save(history: TicketStatusHistory): TicketStatusHistory
    fun findByTicketIdOrderByChangedAtAsc(ticketId: UUID): List<TicketStatusHistory>
}
