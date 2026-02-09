package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.NotificationDispatchEvent
import com.liyaqa.platform.communication.model.NotificationLog
import com.liyaqa.platform.communication.repository.NotificationLogRepository
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class PlatformNotificationService(
    private val notificationLogRepository: NotificationLogRepository,
    private val tenantRepository: TenantRepository,
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(PlatformNotificationService::class.java)

    fun sendToTenant(
        tenantId: UUID,
        templateCode: String,
        variables: Map<String, String>,
        channel: CommunicationChannel
    ) {
        val tenant = tenantRepository.findById(tenantId).orElse(null) ?: run {
            log.warn("Tenant {} not found, skipping notification", tenantId)
            return
        }

        val notificationLog = NotificationLog(
            templateCode = templateCode,
            tenantId = tenantId,
            channel = channel,
            recipientEmail = tenant.contactEmail
        )
        notificationLogRepository.save(notificationLog)

        eventPublisher.publishEvent(
            NotificationDispatchEvent(
                templateCode = templateCode,
                tenantId = tenantId,
                channel = channel,
                recipientEmail = tenant.contactEmail,
                variables = variables
            )
        )
        log.info("Dispatched {} notification to tenant {}", channel, tenantId)
    }

    fun broadcastToAll(
        templateCode: String,
        variables: Map<String, String>,
        channel: CommunicationChannel
    ) {
        val tenants = tenantRepository.findByStatus(TenantStatus.ACTIVE, Pageable.unpaged()).content
        for (tenant in tenants) {
            sendToTenant(tenant.id, templateCode, variables, channel)
        }
        log.info("Broadcast {} notification to {} active tenants", channel, tenants.size)
    }

    fun sendToSegment(
        planTier: PlanTier,
        templateCode: String,
        variables: Map<String, String>,
        channel: CommunicationChannel
    ) {
        val plan = subscriptionPlanRepository.findByTier(planTier).orElse(null) ?: run {
            log.warn("No plan found for tier {}, skipping segment notification", planTier)
            return
        }
        val subscriptions = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
            .filter { it.planId == plan.id }

        for (sub in subscriptions) {
            sendToTenant(sub.tenantId, templateCode, variables, channel)
        }
        log.info("Sent {} notification to {} tenants on {} plan", channel, subscriptions.size, planTier)
    }
}
