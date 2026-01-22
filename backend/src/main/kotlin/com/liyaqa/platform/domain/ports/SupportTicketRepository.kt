package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.SupportTicket
import com.liyaqa.platform.domain.model.TicketCategory
import com.liyaqa.platform.domain.model.TicketMessage
import com.liyaqa.platform.domain.model.TicketPriority
import com.liyaqa.platform.domain.model.TicketStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for SupportTicket aggregate.
 */
interface SupportTicketRepository {
    fun save(ticket: SupportTicket): SupportTicket
    fun findById(id: UUID): Optional<SupportTicket>
    fun findAll(pageable: Pageable): Page<SupportTicket>
    fun findByStatus(status: TicketStatus, pageable: Pageable): Page<SupportTicket>
    fun findByPriority(priority: TicketPriority, pageable: Pageable): Page<SupportTicket>
    fun findByCategory(category: TicketCategory, pageable: Pageable): Page<SupportTicket>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<SupportTicket>
    fun findByAssignedToId(assignedToId: UUID, pageable: Pageable): Page<SupportTicket>
    fun searchBySubjectOrTicketNumber(search: String, pageable: Pageable): Page<SupportTicket>
    fun findByFilters(
        status: TicketStatus?,
        priority: TicketPriority?,
        category: TicketCategory?,
        organizationId: UUID?,
        assignedToId: UUID?,
        search: String?,
        pageable: Pageable
    ): Page<SupportTicket>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: TicketStatus): Long
    fun countByOrganizationIdAndStatus(organizationId: UUID, status: TicketStatus): Long
    fun generateTicketNumber(): String
}

/**
 * Repository port for TicketMessage.
 */
interface TicketMessageRepository {
    fun save(message: TicketMessage): TicketMessage
    fun findByTicketId(ticketId: UUID): List<TicketMessage>
    fun findByTicketIdOrderByCreatedAtAsc(ticketId: UUID): List<TicketMessage>
}
