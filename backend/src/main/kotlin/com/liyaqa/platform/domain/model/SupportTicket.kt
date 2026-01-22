package com.liyaqa.platform.domain.model

import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Support ticket entity.
 * Represents a customer support ticket from an organization.
 */
@Entity
@Table(name = "support_tickets")
class SupportTicket(
    id: UUID = UUID.randomUUID(),

    @Column(name = "ticket_number", unique = true, nullable = false)
    var ticketNumber: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    var organization: Organization,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    var club: Club? = null,

    @Column(name = "subject", nullable = false)
    var subject: String,

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    var description: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    var category: TicketCategory = TicketCategory.GENERAL,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: TicketStatus = TicketStatus.OPEN,

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    var priority: TicketPriority = TicketPriority.MEDIUM,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    var assignedTo: PlatformUser? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    var createdBy: PlatformUser,

    @Column(name = "created_by_email")
    var createdByEmail: String? = null,

    @Column(name = "is_internal", nullable = false)
    var isInternal: Boolean = false,

    @Column(name = "tags")
    var tags: String? = null,

    @Column(name = "message_count", nullable = false)
    var messageCount: Int = 0,

    @Column(name = "last_message_at")
    var lastMessageAt: Instant? = null,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @Column(name = "closed_at")
    var closedAt: Instant? = null

) : OrganizationLevelEntity(id) {

    // ============================================
    // Status Transitions
    // ============================================

    /**
     * Start working on the ticket.
     */
    fun startProgress() {
        require(status == TicketStatus.OPEN || status == TicketStatus.WAITING_ON_CLIENT) {
            "Can only start progress from OPEN or WAITING_ON_CLIENT status"
        }
        status = TicketStatus.IN_PROGRESS
    }

    /**
     * Mark ticket as waiting for client response.
     */
    fun waitOnClient() {
        require(status == TicketStatus.OPEN || status == TicketStatus.IN_PROGRESS) {
            "Can only wait on client from OPEN or IN_PROGRESS status"
        }
        status = TicketStatus.WAITING_ON_CLIENT
    }

    /**
     * Resolve the ticket.
     */
    fun resolve(resolution: String? = null) {
        require(status != TicketStatus.CLOSED && status != TicketStatus.RESOLVED) {
            "Cannot resolve already resolved or closed ticket"
        }
        status = TicketStatus.RESOLVED
        resolvedAt = Instant.now()
    }

    /**
     * Close the ticket.
     */
    fun close() {
        require(status != TicketStatus.CLOSED) {
            "Ticket is already closed"
        }
        status = TicketStatus.CLOSED
        closedAt = Instant.now()
        if (resolvedAt == null) {
            resolvedAt = Instant.now()
        }
    }

    /**
     * Reopen a resolved or closed ticket.
     */
    fun reopen() {
        require(status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            "Can only reopen RESOLVED or CLOSED tickets"
        }
        status = TicketStatus.OPEN
        resolvedAt = null
        closedAt = null
    }

    // ============================================
    // Assignment
    // ============================================

    /**
     * Assign ticket to a platform user.
     */
    fun assignTo(user: PlatformUser) {
        assignedTo = user
    }

    /**
     * Unassign the ticket.
     */
    fun unassign() {
        assignedTo = null
    }

    // ============================================
    // Messages
    // ============================================

    /**
     * Increment message count and update last message time.
     */
    fun incrementMessageCount() {
        messageCount++
        lastMessageAt = Instant.now()
    }

    // ============================================
    // Queries
    // ============================================

    /**
     * Check if ticket is open.
     */
    fun isOpen(): Boolean = status == TicketStatus.OPEN

    /**
     * Check if ticket is in progress.
     */
    fun isInProgress(): Boolean = status == TicketStatus.IN_PROGRESS

    /**
     * Check if ticket is resolved.
     */
    fun isResolved(): Boolean = status == TicketStatus.RESOLVED

    /**
     * Check if ticket is closed.
     */
    fun isClosed(): Boolean = status == TicketStatus.CLOSED

    /**
     * Check if ticket is assigned.
     */
    fun isAssigned(): Boolean = assignedTo != null

    /**
     * Get tags as a list.
     */
    fun getTagsList(): List<String> {
        return tags?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() } ?: emptyList()
    }

    // ============================================
    // Updates
    // ============================================

    /**
     * Update ticket details.
     */
    fun update(
        subject: String? = null,
        description: String? = null,
        category: TicketCategory? = null,
        priority: TicketPriority? = null,
        tags: String? = null
    ) {
        subject?.let { this.subject = it }
        description?.let { this.description = it }
        category?.let { this.category = it }
        priority?.let { this.priority = it }
        tags?.let { this.tags = it }
    }

    /**
     * Set tags from a list.
     */
    fun setTagsList(tagsList: List<String>) {
        tags = if (tagsList.isEmpty()) null else tagsList.joinToString(",")
    }

    companion object {
        /**
         * Create a new support ticket.
         */
        fun create(
            ticketNumber: String,
            organization: Organization,
            club: Club? = null,
            subject: String,
            description: String,
            category: TicketCategory,
            priority: TicketPriority,
            createdBy: PlatformUser,
            createdByEmail: String? = null,
            isInternal: Boolean = false,
            tags: String? = null
        ): SupportTicket {
            return SupportTicket(
                ticketNumber = ticketNumber,
                organization = organization,
                club = club,
                subject = subject,
                description = description,
                category = category,
                priority = priority,
                status = TicketStatus.OPEN,
                createdBy = createdBy,
                createdByEmail = createdByEmail,
                isInternal = isInternal,
                tags = tags,
                messageCount = 0
            )
        }
    }
}
