package com.liyaqa.webhook.api

import com.liyaqa.webhook.application.services.WebhookDeliveryService
import com.liyaqa.webhook.application.services.WebhookService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/webhooks")
@Tag(name = "Webhooks", description = "Webhook subscription management")
class WebhookController(
    private val webhookService: WebhookService,
    private val deliveryService: WebhookDeliveryService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('webhooks_create')")
    @Operation(summary = "Create a new webhook subscription")
    fun createWebhook(
        @Valid @RequestBody request: CreateWebhookRequest
    ): ResponseEntity<WebhookWithSecretResponse> {
        val webhook = webhookService.createWebhook(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(WebhookWithSecretResponse.from(webhook))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('webhooks_view')")
    @Operation(summary = "List all webhooks")
    fun listWebhooks(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<Page<WebhookResponse>> {
        val sort = if (sortDir.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size, sort)
        val webhooks = webhookService.listWebhooks(pageable)
        return ResponseEntity.ok(webhooks.map { WebhookResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('webhooks_view')")
    @Operation(summary = "Get webhook by ID")
    fun getWebhook(@PathVariable id: UUID): ResponseEntity<WebhookResponse> {
        val webhook = webhookService.getWebhook(id)
        return ResponseEntity.ok(WebhookResponse.from(webhook))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('webhooks_edit')")
    @Operation(summary = "Update webhook")
    fun updateWebhook(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateWebhookRequest
    ): ResponseEntity<WebhookResponse> {
        val webhook = webhookService.updateWebhook(request.toCommand(id))
        return ResponseEntity.ok(WebhookResponse.from(webhook))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('webhooks_delete')")
    @Operation(summary = "Delete webhook")
    fun deleteWebhook(@PathVariable id: UUID): ResponseEntity<Void> {
        webhookService.deleteWebhook(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('webhooks_edit')")
    @Operation(summary = "Activate webhook")
    fun activateWebhook(@PathVariable id: UUID): ResponseEntity<WebhookResponse> {
        val webhook = webhookService.activateWebhook(id)
        return ResponseEntity.ok(WebhookResponse.from(webhook))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('webhooks_edit')")
    @Operation(summary = "Deactivate webhook")
    fun deactivateWebhook(@PathVariable id: UUID): ResponseEntity<WebhookResponse> {
        val webhook = webhookService.deactivateWebhook(id)
        return ResponseEntity.ok(WebhookResponse.from(webhook))
    }

    @PostMapping("/{id}/regenerate-secret")
    @PreAuthorize("hasAuthority('webhooks_edit')")
    @Operation(summary = "Regenerate webhook secret")
    fun regenerateSecret(@PathVariable id: UUID): ResponseEntity<WebhookWithSecretResponse> {
        val webhook = webhookService.regenerateSecret(id)
        return ResponseEntity.ok(WebhookWithSecretResponse.from(webhook))
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasAuthority('webhooks_edit')")
    @Operation(summary = "Send test webhook")
    fun testWebhook(
        @PathVariable id: UUID,
        @RequestBody(required = false) request: TestWebhookRequest?
    ): ResponseEntity<WebhookDeliveryResponse> {
        val delivery = deliveryService.sendTestWebhook(id, request?.eventType ?: "test.ping")
        return ResponseEntity.ok(WebhookDeliveryResponse.from(delivery))
    }

    @GetMapping("/{id}/deliveries")
    @PreAuthorize("hasAuthority('webhooks_view')")
    @Operation(summary = "Get delivery history for webhook")
    fun getDeliveries(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<WebhookDeliveryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("createdAt").descending())
        val deliveries = deliveryService.getDeliveryHistory(id, pageable)
        return ResponseEntity.ok(deliveries.map { WebhookDeliveryResponse.from(it) })
    }

    @GetMapping("/{id}/deliveries/{deliveryId}")
    @PreAuthorize("hasAuthority('webhooks_view')")
    @Operation(summary = "Get delivery details")
    fun getDelivery(
        @PathVariable id: UUID,
        @PathVariable deliveryId: UUID
    ): ResponseEntity<WebhookDeliveryDetailResponse> {
        val delivery = deliveryService.getDelivery(deliveryId)
        require(delivery.webhookId == id) { "Delivery does not belong to this webhook" }
        return ResponseEntity.ok(WebhookDeliveryDetailResponse.from(delivery))
    }

    @PostMapping("/{id}/deliveries/{deliveryId}/retry")
    @PreAuthorize("hasAuthority('webhooks_edit')")
    @Operation(summary = "Manually retry a failed delivery")
    fun retryDelivery(
        @PathVariable id: UUID,
        @PathVariable deliveryId: UUID
    ): ResponseEntity<WebhookDeliveryResponse> {
        val delivery = deliveryService.getDelivery(deliveryId)
        require(delivery.webhookId == id) { "Delivery does not belong to this webhook" }
        val retried = deliveryService.retryDelivery(deliveryId)
        return ResponseEntity.ok(WebhookDeliveryResponse.from(retried))
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAuthority('webhooks_view')")
    @Operation(summary = "Get delivery statistics for webhook")
    fun getStats(@PathVariable id: UUID): ResponseEntity<WebhookStatsResponse> {
        val stats = deliveryService.getDeliveryStats(id)
        return ResponseEntity.ok(WebhookStatsResponse(
            total = stats["total"] ?: 0,
            delivered = stats["delivered"] ?: 0,
            pending = stats["pending"] ?: 0,
            failed = stats["failed"] ?: 0,
            exhausted = stats["exhausted"] ?: 0
        ))
    }

    @GetMapping("/event-types")
    @PreAuthorize("hasAuthority('webhooks_view')")
    @Operation(summary = "Get available event types")
    fun getEventTypes(): ResponseEntity<EventTypesResponse> {
        return ResponseEntity.ok(EventTypesResponse(webhookService.getAvailableEventTypes()))
    }
}
