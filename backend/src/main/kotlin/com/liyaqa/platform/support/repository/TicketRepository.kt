package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface TicketRepository {
    fun save(ticket: Ticket): Ticket
    fun findById(id: UUID): Optional<Ticket>
    fun findByFilters(
        status: TicketStatus?,
        priority: TicketPriority?,
        category: TicketCategory?,
        assignedToId: UUID?,
        tenantId: UUID?,
        slaBreached: Boolean?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?,
        pageable: Pageable
    ): Page<Ticket>
    fun findByStatus(status: TicketStatus): List<Ticket>
    fun findByStatusAndResolvedAtBefore(status: TicketStatus, before: Instant): List<Ticket>
    fun countByStatus(status: TicketStatus): Long
    fun countByAssignedToId(assignedToId: UUID): Long
    fun findByAssignedToId(assignedToId: UUID): List<Ticket>
    fun count(): Long
    fun existsById(id: UUID): Boolean
}
