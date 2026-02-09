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
@Table(name = "support_tickets_v2")
class Ticket(
    @Column(name = "ticket_number", nullable = false, unique = true, length = 20)
    val ticketNumber: String,

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "created_by_user_id", nullable = false)
    val createdByUserId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "created_by_user_type", nullable = false, length = 30)
    val createdByUserType: CreatedByUserType,

    @Column(name = "subject", nullable = false, length = 200)
    var subject: String,

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    var description: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    var category: TicketCategory,

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    var priority: TicketPriority,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    var status: TicketStatus = TicketStatus.OPEN,

    @Column(name = "assigned_to_id")
    var assignedToId: UUID? = null,

    @Column(name = "sla_response_deadline")
    var slaResponseDeadline: Instant? = null,

    @Column(name = "sla_deadline")
    var slaDeadline: Instant? = null,

    @Column(name = "sla_paused_at")
    var slaPausedAt: Instant? = null,

    @Column(name = "sla_paused_duration", nullable = false)
    var slaPausedDuration: Long = 0,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @Column(name = "closed_at")
    var closedAt: Instant? = null,

    @Column(name = "satisfaction_rating")
    var satisfactionRating: Int? = null,

    @Column(name = "message_count", nullable = false)
    var messageCount: Int = 0,

    @Column(name = "last_message_at")
    var lastMessageAt: Instant? = null
) : OrganizationLevelEntity() {

    companion object {
        private val VALID_TRANSITIONS = mapOf(
            TicketStatus.OPEN to setOf(
                TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER,
                TicketStatus.ESCALATED, TicketStatus.RESOLVED, TicketStatus.CLOSED
            ),
            TicketStatus.IN_PROGRESS to setOf(
                TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.WAITING_ON_THIRD_PARTY,
                TicketStatus.ESCALATED, TicketStatus.RESOLVED, TicketStatus.CLOSED
            ),
            TicketStatus.WAITING_ON_CUSTOMER to setOf(
                TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED
            ),
            TicketStatus.WAITING_ON_THIRD_PARTY to setOf(
                TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED
            ),
            TicketStatus.ESCALATED to setOf(
                TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED
            ),
            TicketStatus.RESOLVED to setOf(
                TicketStatus.CLOSED, TicketStatus.REOPENED
            ),
            TicketStatus.CLOSED to setOf(
                TicketStatus.REOPENED
            ),
            TicketStatus.REOPENED to setOf(
                TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER,
                TicketStatus.ESCALATED, TicketStatus.RESOLVED, TicketStatus.CLOSED
            )
        )

        fun create(
            ticketNumber: String,
            tenantId: UUID,
            createdByUserId: UUID,
            createdByUserType: CreatedByUserType,
            subject: String,
            description: String,
            category: TicketCategory,
            priority: TicketPriority
        ): Ticket {
            val now = Instant.now()
            return Ticket(
                ticketNumber = ticketNumber,
                tenantId = tenantId,
                createdByUserId = createdByUserId,
                createdByUserType = createdByUserType,
                subject = subject,
                description = description,
                category = category,
                priority = priority,
                slaResponseDeadline = SlaConfig.calculateResponseDeadline(priority, now),
                slaDeadline = SlaConfig.calculateResolutionDeadline(priority, now)
            )
        }

        fun isValidTransition(from: TicketStatus, to: TicketStatus): Boolean =
            VALID_TRANSITIONS[from]?.contains(to) == true
    }

    fun startProgress(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.IN_PROGRESS)
        if (status == TicketStatus.WAITING_ON_CUSTOMER || status == TicketStatus.WAITING_ON_THIRD_PARTY) {
            resumeSla()
        }
        status = TicketStatus.IN_PROGRESS
        return previous
    }

    fun waitOnCustomer(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.WAITING_ON_CUSTOMER)
        pauseSla()
        status = TicketStatus.WAITING_ON_CUSTOMER
        return previous
    }

    fun waitOnThirdParty(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.WAITING_ON_THIRD_PARTY)
        status = TicketStatus.WAITING_ON_THIRD_PARTY
        return previous
    }

    fun escalate(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.ESCALATED)
        status = TicketStatus.ESCALATED
        return previous
    }

    fun resolve(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.RESOLVED)
        if (slaPausedAt != null) {
            resumeSla()
        }
        status = TicketStatus.RESOLVED
        resolvedAt = Instant.now()
        return previous
    }

    fun close(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.CLOSED)
        if (slaPausedAt != null) {
            resumeSla()
        }
        status = TicketStatus.CLOSED
        closedAt = Instant.now()
        return previous
    }

    fun reopen(): TicketStatus {
        val previous = status
        validateTransition(TicketStatus.REOPENED)
        status = TicketStatus.REOPENED
        resolvedAt = null
        closedAt = null
        return previous
    }

    fun rate(rating: Int) {
        require(status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            "Can only rate RESOLVED or CLOSED tickets"
        }
        require(rating in 1..5) { "Rating must be between 1 and 5" }
        this.satisfactionRating = rating
    }

    fun assignTo(userId: UUID) {
        this.assignedToId = userId
    }

    fun unassign() {
        this.assignedToId = null
    }

    fun changePriority(newPriority: TicketPriority, createdAt: Instant) {
        this.priority = newPriority
        this.slaResponseDeadline = SlaConfig.calculateResponseDeadline(newPriority, createdAt)
        this.slaDeadline = SlaConfig.calculateResolutionDeadline(newPriority, createdAt)
    }

    fun pauseSla() {
        if (slaPausedAt == null) {
            slaPausedAt = Instant.now()
        }
    }

    fun resumeSla() {
        slaPausedAt?.let { pausedAt ->
            val pauseDuration = Instant.now().toEpochMilli() - pausedAt.toEpochMilli()
            slaPausedDuration += pauseDuration
            slaDeadline = slaDeadline?.plusMillis(pauseDuration)
            slaResponseDeadline = slaResponseDeadline?.plusMillis(pauseDuration)
            slaPausedAt = null
        }
    }

    fun isSlaBreached(): Boolean {
        val deadline = slaDeadline ?: return false
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) return false
        return Instant.now().isAfter(deadline)
    }

    fun incrementMessageCount() {
        messageCount++
        lastMessageAt = Instant.now()
    }

    private fun validateTransition(target: TicketStatus) {
        if (!isValidTransition(status, target)) {
            throw com.liyaqa.platform.support.exception.InvalidTicketStatusTransitionException(status, target)
        }
    }
}
