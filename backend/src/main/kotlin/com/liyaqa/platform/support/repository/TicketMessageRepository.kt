package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.TicketMessage
import java.time.Instant
import java.util.UUID

interface TicketMessageRepository {
    fun save(message: TicketMessage): TicketMessage
    fun findByTicketIdOrderByCreatedAtAsc(ticketId: UUID): List<TicketMessage>
    fun countByTicketIdAndCreatedAtAfter(ticketId: UUID, after: Instant): Long
}
