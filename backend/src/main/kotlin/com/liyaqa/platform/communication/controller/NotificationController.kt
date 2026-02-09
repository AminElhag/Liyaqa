package com.liyaqa.platform.communication.controller

import com.liyaqa.platform.communication.dto.CreateTemplateRequest
import com.liyaqa.platform.communication.dto.DeliveryStatsResponse
import com.liyaqa.platform.communication.dto.NotificationLogResponse
import com.liyaqa.platform.communication.dto.NotificationStatsResponse
import com.liyaqa.platform.communication.dto.SendNotificationRequest
import com.liyaqa.platform.communication.dto.TemplateResponse
import com.liyaqa.platform.communication.dto.UpdateTemplateRequest
import com.liyaqa.platform.communication.service.CommunicationTemplateService
import com.liyaqa.platform.communication.service.NotificationStatsService
import com.liyaqa.platform.communication.service.PlatformNotificationService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController("platformNotificationController")
@RequestMapping("/api/v1/platform/notifications")
@PlatformSecured
@Tag(name = "Platform Notifications", description = "Notification management for platform operators")
class NotificationController(
    private val notificationService: PlatformNotificationService,
    private val templateService: CommunicationTemplateService,
    private val statsService: NotificationStatsService
) {

    @Operation(summary = "Send notification to tenants")
    @PostMapping("/send")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_MANAGE])
    fun sendNotification(
        @Valid @RequestBody request: SendNotificationRequest
    ): ResponseEntity<Map<String, String>> {
        val command = request.toCommand()
        if (command.planTier != null) {
            notificationService.sendToSegment(
                planTier = command.planTier,
                templateCode = command.templateCode,
                variables = command.variables,
                channel = command.channel
            )
        } else if (command.tenantIds.isNotEmpty()) {
            for (tenantId in command.tenantIds) {
                notificationService.sendToTenant(
                    tenantId = tenantId,
                    templateCode = command.templateCode,
                    variables = command.variables,
                    channel = command.channel
                )
            }
        } else {
            notificationService.broadcastToAll(
                templateCode = command.templateCode,
                variables = command.variables,
                channel = command.channel
            )
        }
        return ResponseEntity.ok(mapOf("message" to "Notification dispatched successfully"))
    }

    @Operation(summary = "Get notification statistics")
    @GetMapping("/stats")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_VIEW])
    fun getStats(): ResponseEntity<NotificationStatsResponse> {
        return ResponseEntity.ok(statsService.getNotificationStats())
    }

    @Operation(summary = "Get announcement delivery statistics")
    @GetMapping("/announcements/{id}/delivery")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_VIEW])
    fun getDeliveryStats(@PathVariable id: UUID): ResponseEntity<DeliveryStatsResponse> {
        return ResponseEntity.ok(statsService.getAnnouncementDeliveryStats(id))
    }

    @Operation(summary = "Create a communication template")
    @PostMapping("/templates")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_MANAGE])
    fun createTemplate(
        @Valid @RequestBody request: CreateTemplateRequest
    ): ResponseEntity<TemplateResponse> {
        val template = templateService.createTemplate(request.toCommand())
        return ResponseEntity.ok(TemplateResponse.from(template))
    }

    @Operation(summary = "Update a communication template")
    @PutMapping("/templates/{id}")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_MANAGE])
    fun updateTemplate(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTemplateRequest
    ): ResponseEntity<TemplateResponse> {
        val template = templateService.updateTemplate(id, request.toCommand())
        return ResponseEntity.ok(TemplateResponse.from(template))
    }

    @Operation(summary = "List communication templates")
    @GetMapping("/templates")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_VIEW])
    fun listTemplates(pageable: Pageable): ResponseEntity<PageResponse<TemplateResponse>> {
        val page = templateService.listTemplates(pageable)
        return ResponseEntity.ok(PageResponse.from(page) { TemplateResponse.from(it) })
    }

    @Operation(summary = "Get a communication template")
    @GetMapping("/templates/{id}")
    @PlatformSecured(permissions = [PlatformPermission.NOTIFICATIONS_VIEW])
    fun getTemplate(@PathVariable id: UUID): ResponseEntity<TemplateResponse> {
        val template = templateService.getTemplate(id)
        return ResponseEntity.ok(TemplateResponse.from(template))
    }
}
