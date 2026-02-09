package com.liyaqa.platform.support.model

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

@Entity(name = "SupportTicketMessage")
@Table(name = "ticket_messages_v2")
class TicketMessage(
    @Column(name = "ticket_id", nullable = false)
    val ticketId: UUID,

    @Column(name = "sender_id", nullable = false)
    val senderId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 30)
    val senderType: CreatedByUserType,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    val content: String,

    @Column(name = "is_internal_note", nullable = false)
    val isInternalNote: Boolean = false,

    @Column(name = "attachment_urls", columnDefinition = "TEXT")
    var attachmentUrls: String? = null
) : OrganizationLevelEntity() {

    companion object {
        private val objectMapper = jacksonObjectMapper()

        fun createMessage(
            ticketId: UUID,
            senderId: UUID,
            senderType: CreatedByUserType,
            content: String,
            attachmentUrls: List<String>? = null
        ): TicketMessage {
            val message = TicketMessage(
                ticketId = ticketId,
                senderId = senderId,
                senderType = senderType,
                content = content,
                isInternalNote = false
            )
            attachmentUrls?.let { message.setAttachmentUrlsList(it) }
            return message
        }

        fun createInternalNote(
            ticketId: UUID,
            senderId: UUID,
            senderType: CreatedByUserType,
            content: String,
            attachmentUrls: List<String>? = null
        ): TicketMessage {
            val message = TicketMessage(
                ticketId = ticketId,
                senderId = senderId,
                senderType = senderType,
                content = content,
                isInternalNote = true
            )
            attachmentUrls?.let { message.setAttachmentUrlsList(it) }
            return message
        }
    }

    fun getAttachmentUrlsList(): List<String> {
        return attachmentUrls?.let {
            try {
                objectMapper.readValue<List<String>>(it)
            } catch (_: Exception) {
                emptyList()
            }
        } ?: emptyList()
    }

    fun setAttachmentUrlsList(urls: List<String>) {
        this.attachmentUrls = if (urls.isEmpty()) null else objectMapper.writeValueAsString(urls)
    }
}
