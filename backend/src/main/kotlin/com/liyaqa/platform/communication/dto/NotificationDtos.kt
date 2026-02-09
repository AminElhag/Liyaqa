package com.liyaqa.platform.communication.dto

import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.CommunicationTemplate
import com.liyaqa.platform.communication.model.NotificationLog
import com.liyaqa.platform.communication.model.NotificationLogStatus
import com.liyaqa.platform.subscription.model.PlanTier
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

data class CreateTemplateRequest(
    @field:NotBlank
    val code: String,
    @field:NotBlank
    val nameEn: String,
    val nameAr: String? = null,
    @field:NotBlank
    val subjectEn: String,
    val subjectAr: String? = null,
    @field:NotBlank
    val bodyEn: String,
    val bodyAr: String? = null,
    val channel: CommunicationChannel = CommunicationChannel.EMAIL,
    val variables: List<String> = emptyList()
) {
    fun toCommand() = CreateTemplateCommand(
        code = code,
        nameEn = nameEn,
        nameAr = nameAr,
        subjectEn = subjectEn,
        subjectAr = subjectAr,
        bodyEn = bodyEn,
        bodyAr = bodyAr,
        channel = channel,
        variables = variables
    )
}

data class UpdateTemplateRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val subjectEn: String? = null,
    val subjectAr: String? = null,
    val bodyEn: String? = null,
    val bodyAr: String? = null,
    val channel: CommunicationChannel? = null,
    val variables: List<String>? = null,
    val isActive: Boolean? = null
) {
    fun toCommand() = UpdateTemplateCommand(
        nameEn = nameEn,
        nameAr = nameAr,
        subjectEn = subjectEn,
        subjectAr = subjectAr,
        bodyEn = bodyEn,
        bodyAr = bodyAr,
        channel = channel,
        variables = variables,
        isActive = isActive
    )
}

data class SendNotificationRequest(
    @field:NotBlank
    val templateCode: String,
    val tenantIds: List<UUID> = emptyList(),
    val planTier: PlanTier? = null,
    val channel: CommunicationChannel = CommunicationChannel.EMAIL,
    val variables: Map<String, String> = emptyMap()
) {
    fun toCommand() = SendNotificationCommand(
        templateCode = templateCode,
        tenantIds = tenantIds,
        planTier = planTier,
        channel = channel,
        variables = variables
    )
}

data class TemplateResponse(
    val id: UUID,
    val code: String,
    val nameEn: String,
    val nameAr: String?,
    val subjectEn: String,
    val subjectAr: String?,
    val bodyEn: String,
    val bodyAr: String?,
    val channel: CommunicationChannel,
    val variables: List<String>,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(t: CommunicationTemplate) = TemplateResponse(
            id = t.id,
            code = t.code,
            nameEn = t.nameEn,
            nameAr = t.nameAr,
            subjectEn = t.subjectEn,
            subjectAr = t.subjectAr,
            bodyEn = t.bodyEn,
            bodyAr = t.bodyAr,
            channel = t.channel,
            variables = t.variables.toList(),
            isActive = t.isActive,
            createdAt = t.createdAt,
            updatedAt = t.updatedAt
        )
    }
}

data class NotificationLogResponse(
    val id: UUID,
    val announcementId: UUID?,
    val templateCode: String?,
    val tenantId: UUID,
    val channel: CommunicationChannel,
    val recipientEmail: String?,
    val subject: String?,
    val status: NotificationLogStatus,
    val sentAt: Instant?,
    val deliveredAt: Instant?,
    val failureReason: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(l: NotificationLog) = NotificationLogResponse(
            id = l.id,
            announcementId = l.announcementId,
            templateCode = l.templateCode,
            tenantId = l.tenantId,
            channel = l.channel,
            recipientEmail = l.recipientEmail,
            subject = l.subject,
            status = l.status,
            sentAt = l.sentAt,
            deliveredAt = l.deliveredAt,
            failureReason = l.failureReason,
            createdAt = l.createdAt
        )
    }
}

data class NotificationStatsResponse(
    val totalSent: Long,
    val totalDelivered: Long,
    val totalFailed: Long,
    val totalPending: Long,
    val emailsSentToday: Long,
    val smsSentToday: Long
)

data class DeliveryStatsResponse(
    val announcementId: UUID,
    val totalSent: Long,
    val totalDelivered: Long,
    val totalFailed: Long,
    val totalPending: Long
)
