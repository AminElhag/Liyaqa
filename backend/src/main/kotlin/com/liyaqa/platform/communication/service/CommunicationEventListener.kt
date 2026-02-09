package com.liyaqa.platform.communication.service

import com.liyaqa.notification.domain.ports.EmailService
import com.liyaqa.platform.communication.model.AnnouncementPublishedEvent
import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.NotificationDispatchEvent
import com.liyaqa.platform.communication.model.NotificationLog
import com.liyaqa.platform.communication.repository.NotificationLogRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class CommunicationEventListener(
    private val notificationLogRepository: NotificationLogRepository,
    private val tenantRepository: TenantRepository,
    private val templateService: CommunicationTemplateService,
    private val emailService: EmailService
) {
    private val log = LoggerFactory.getLogger(CommunicationEventListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleAnnouncementPublished(event: AnnouncementPublishedEvent) {
        log.info(
            "Processing announcement published event: {} with {} target tenants",
            event.announcementId, event.targetTenantIds.size
        )
        for (tenantId in event.targetTenantIds) {
            try {
                val tenant = tenantRepository.findById(tenantId).orElse(null) ?: continue
                val notificationLog = NotificationLog(
                    announcementId = event.announcementId,
                    tenantId = tenantId,
                    channel = CommunicationChannel.EMAIL,
                    recipientEmail = tenant.contactEmail,
                    subject = event.title
                )
                notificationLogRepository.save(notificationLog)

                emailService.sendEmail(
                    to = tenant.contactEmail,
                    subject = event.title,
                    body = event.content
                )
                notificationLog.markSent()
                notificationLogRepository.save(notificationLog)
            } catch (e: Exception) {
                log.error("Failed to send announcement to tenant {}: {}", tenantId, e.message)
            }
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleNotificationDispatch(event: NotificationDispatchEvent) {
        log.info(
            "Processing notification dispatch: template={}, tenant={}, channel={}",
            event.templateCode, event.tenantId, event.channel
        )
        try {
            val rendered = templateService.renderTemplate(
                code = event.templateCode,
                variables = event.variables
            )
            if (event.channel == CommunicationChannel.EMAIL && event.recipientEmail != null) {
                emailService.sendEmail(
                    to = event.recipientEmail,
                    subject = rendered.subject,
                    body = rendered.body
                )
            }
            log.info("Notification dispatched successfully to tenant {}", event.tenantId)
        } catch (e: Exception) {
            log.error("Failed to dispatch notification to tenant {}: {}", event.tenantId, e.message)
        }
    }
}
