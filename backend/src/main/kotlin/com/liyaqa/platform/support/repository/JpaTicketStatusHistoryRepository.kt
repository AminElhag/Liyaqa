package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.TicketStatusHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

interface SpringDataTicketStatusHistoryRepository : JpaRepository<TicketStatusHistory, UUID> {
    fun findByTicketIdOrderByChangedAtAsc(ticketId: UUID): List<TicketStatusHistory>
}

@Repository
class JpaTicketStatusHistoryRepository(
    private val springDataRepository: SpringDataTicketStatusHistoryRepository
) : TicketStatusHistoryRepository {

    override fun save(history: TicketStatusHistory): TicketStatusHistory =
        springDataRepository.save(history)

    override fun findByTicketIdOrderByChangedAtAsc(ticketId: UUID): List<TicketStatusHistory> =
        springDataRepository.findByTicketIdOrderByChangedAtAsc(ticketId)
}
