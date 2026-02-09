package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.TicketMessage
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

interface SpringDataTicketMessageV2Repository : JpaRepository<TicketMessage, UUID> {
    fun findByTicketIdOrderByCreatedAtAsc(ticketId: UUID): List<TicketMessage>

    @Query("SELECT COUNT(m) FROM SupportTicketMessage m WHERE m.ticketId = :ticketId AND m.createdAt > :after")
    fun countByTicketIdAndCreatedAtAfter(@Param("ticketId") ticketId: UUID, @Param("after") after: Instant): Long
}

@Repository("platformTicketMessageRepository")
class JpaTicketMessageRepository(
    private val springDataRepository: SpringDataTicketMessageV2Repository
) : TicketMessageRepository {

    override fun save(message: TicketMessage): TicketMessage =
        springDataRepository.save(message)

    override fun findByTicketIdOrderByCreatedAtAsc(ticketId: UUID): List<TicketMessage> =
        springDataRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)

    override fun countByTicketIdAndCreatedAtAfter(ticketId: UUID, after: Instant): Long =
        springDataRepository.countByTicketIdAndCreatedAtAfter(ticketId, after)
}
