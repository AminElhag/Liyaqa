package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.util.UUID

/**
 * Message in a support ticket thread.
 * Supports both client messages and internal notes.
 */
@Entity
@Table(name = "ticket_messages")
class TicketMessage(
    id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    var ticket: SupportTicket,

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    var content: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    var author: PlatformUser,

    @Column(name = "author_email")
    var authorEmail: String? = null,

    @Column(name = "is_from_client", nullable = false)
    var isFromClient: Boolean = false,

    @Column(name = "is_internal", nullable = false)
    var isInternal: Boolean = false

) : OrganizationLevelEntity(id) {

    companion object {
        /**
         * Create a new message from a platform team member.
         */
        fun createFromPlatform(
            ticket: SupportTicket,
            content: String,
            author: PlatformUser,
            isInternal: Boolean = false
        ): TicketMessage {
            val message = TicketMessage(
                ticket = ticket,
                content = content,
                author = author,
                authorEmail = author.email,
                isFromClient = false,
                isInternal = isInternal
            )
            // Update ticket message count
            ticket.incrementMessageCount()
            return message
        }

        /**
         * Create a new message from a client (simulated by platform user).
         */
        fun createFromClient(
            ticket: SupportTicket,
            content: String,
            author: PlatformUser,
            clientEmail: String? = null
        ): TicketMessage {
            val message = TicketMessage(
                ticket = ticket,
                content = content,
                author = author,
                authorEmail = clientEmail ?: author.email,
                isFromClient = true,
                isInternal = false
            )
            // Update ticket message count
            ticket.incrementMessageCount()
            return message
        }

        /**
         * Create an internal note (only visible to platform team).
         */
        fun createInternalNote(
            ticket: SupportTicket,
            content: String,
            author: PlatformUser
        ): TicketMessage {
            val message = TicketMessage(
                ticket = ticket,
                content = content,
                author = author,
                authorEmail = author.email,
                isFromClient = false,
                isInternal = true
            )
            // Update ticket message count
            ticket.incrementMessageCount()
            return message
        }
    }
}
