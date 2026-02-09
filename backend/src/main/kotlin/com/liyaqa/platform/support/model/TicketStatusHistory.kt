package com.liyaqa.platform.support.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "ticket_status_history")
class TicketStatusHistory(
    @Column(name = "ticket_id", nullable = false)
    val ticketId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", nullable = false, length = 30)
    val fromStatus: TicketStatus,

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    val toStatus: TicketStatus,

    @Column(name = "changed_by", nullable = false)
    val changedBy: UUID,

    @Column(name = "changed_at", nullable = false)
    val changedAt: Instant = Instant.now(),

    @Column(name = "reason", columnDefinition = "TEXT")
    val reason: String? = null
) : OrganizationLevelEntity() {

    companion object {
        fun create(
            ticketId: UUID,
            fromStatus: TicketStatus,
            toStatus: TicketStatus,
            changedBy: UUID,
            reason: String? = null
        ): TicketStatusHistory {
            return TicketStatusHistory(
                ticketId = ticketId,
                fromStatus = fromStatus,
                toStatus = toStatus,
                changedBy = changedBy,
                reason = reason
            )
        }
    }
}
