package com.liyaqa.webhook.application.services

import com.liyaqa.webhook.application.commands.WebhookEventData
import com.liyaqa.webhook.domain.model.DeliveryStatus
import com.liyaqa.webhook.domain.model.Webhook
import com.liyaqa.webhook.domain.model.WebhookDelivery
import com.liyaqa.webhook.domain.ports.WebhookDeliveryRepository
import com.liyaqa.webhook.domain.ports.WebhookRepository
import com.liyaqa.webhook.infrastructure.http.WebhookHttpClient
import com.liyaqa.webhook.infrastructure.http.DeliveryResult
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.atLeast
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WebhookDeliveryServiceTest {

    @Mock
    private lateinit var webhookRepository: WebhookRepository

    @Mock
    private lateinit var deliveryRepository: WebhookDeliveryRepository

    @Mock
    private lateinit var httpClient: WebhookHttpClient

    private lateinit var deliveryService: WebhookDeliveryService

    private lateinit var testWebhook: Webhook
    private lateinit var testDelivery: WebhookDelivery
    private val testTenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        deliveryService = WebhookDeliveryService(
            webhookRepository,
            deliveryRepository,
            httpClient
        )

        testWebhook = Webhook(
            id = UUID.randomUUID(),
            name = "Test Webhook",
            url = "https://example.com/webhook",
            secret = "test-secret",
            events = listOf("member.created")
        )

        testDelivery = WebhookDelivery(
            id = UUID.randomUUID(),
            webhookId = testWebhook.id,
            eventType = "member.created",
            eventId = UUID.randomUUID(),
            payload = mapOf("id" to "123", "email" to "test@example.com")
        )
    }

    @Test
    fun `queueEvent should create deliveries for subscribed webhooks`() {
        // Given
        val eventData = WebhookEventData(
            eventType = "member.created",
            eventId = UUID.randomUUID(),
            payload = mapOf("id" to "123"),
            tenantId = testTenantId
        )

        whenever(webhookRepository.findActiveByEventType("member.created")) doReturn listOf(testWebhook)
        whenever(deliveryRepository.saveAll(any<List<WebhookDelivery>>())).thenAnswer { invocation ->
            invocation.getArgument<List<WebhookDelivery>>(0)
        }

        // When
        deliveryService.queueEvent(eventData)

        // Then
        verify(webhookRepository).findActiveByEventType("member.created")
        verify(deliveryRepository).saveAll(any<List<WebhookDelivery>>())
    }

    @Test
    fun `queueEvent should not create deliveries when no webhooks subscribed`() {
        // Given
        val eventData = WebhookEventData(
            eventType = "member.created",
            eventId = UUID.randomUUID(),
            payload = mapOf("id" to "123"),
            tenantId = testTenantId
        )

        whenever(webhookRepository.findActiveByEventType("member.created")) doReturn emptyList()

        // When
        deliveryService.queueEvent(eventData)

        // Then
        verify(deliveryRepository, never()).saveAll(any<List<WebhookDelivery>>())
    }

    @Test
    fun `processDelivery should mark as delivered on success`() {
        // Given
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }
        whenever(httpClient.deliver(testWebhook, testDelivery)) doReturn DeliveryResult(
            success = true,
            statusCode = 200,
            responseBody = "OK",
            error = null
        )

        // When
        deliveryService.processDelivery(testDelivery)

        // Then
        assertEquals(DeliveryStatus.DELIVERED, testDelivery.status)
        assertNotNull(testDelivery.deliveredAt)
    }

    @Test
    fun `processDelivery should mark as failed on HTTP error`() {
        // Given
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }
        whenever(httpClient.deliver(testWebhook, testDelivery)) doReturn DeliveryResult(
            success = false,
            statusCode = 500,
            responseBody = "Internal Server Error",
            error = "Server error"
        )

        // When
        deliveryService.processDelivery(testDelivery)

        // Then
        assertEquals(DeliveryStatus.FAILED, testDelivery.status)
        assertEquals(500, testDelivery.lastResponseCode)
    }

    @Test
    fun `processDelivery should skip inactive webhook`() {
        // Given
        testWebhook.deactivate()
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }

        // When
        deliveryService.processDelivery(testDelivery)

        // Then
        verify(httpClient, never()).deliver(any(), any())
    }

    @Test
    fun `processDelivery should handle missing webhook`() {
        // Given
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.empty()
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }

        // When
        deliveryService.processDelivery(testDelivery)

        // Then
        verify(httpClient, never()).deliver(any(), any())
    }

    @Test
    fun `sendTestWebhook should create and process delivery immediately`() {
        // Given
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }
        whenever(deliveryRepository.findById(any())).thenAnswer { invocation ->
            Optional.of(testDelivery)
        }
        whenever(httpClient.deliver(any(), any())) doReturn DeliveryResult(
            success = true,
            statusCode = 200,
            responseBody = "OK",
            error = null
        )

        // When
        val result = deliveryService.sendTestWebhook(testWebhook.id)

        // Then
        assertNotNull(result)
        verify(deliveryRepository, atLeast(1)).save(any<WebhookDelivery>())
    }

    @Test
    fun `sendTestWebhook should throw when webhook not found`() {
        // Given
        val webhookId = UUID.randomUUID()
        whenever(webhookRepository.findById(webhookId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            deliveryService.sendTestWebhook(webhookId)
        }
    }

    @Test
    fun `retryDelivery should process failed delivery`() {
        // Given
        testDelivery.markFailed(500, "Error", "Server error")
        whenever(deliveryRepository.findById(testDelivery.id)) doReturn Optional.of(testDelivery)
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }
        whenever(httpClient.deliver(any(), any())) doReturn DeliveryResult(
            success = true,
            statusCode = 200,
            responseBody = "OK",
            error = null
        )

        // When
        val result = deliveryService.retryDelivery(testDelivery.id)

        // Then
        assertNotNull(result)
    }

    @Test
    fun `retryDelivery should throw when delivery not found`() {
        // Given
        val deliveryId = UUID.randomUUID()
        whenever(deliveryRepository.findById(deliveryId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            deliveryService.retryDelivery(deliveryId)
        }
    }

    @Test
    fun `retryDelivery should reject pending delivery`() {
        // Given
        whenever(deliveryRepository.findById(testDelivery.id)) doReturn Optional.of(testDelivery)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            deliveryService.retryDelivery(testDelivery.id)
        }
    }

    @Test
    fun `getDeliveryHistory should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val deliveries = listOf(testDelivery)
        val page = PageImpl(deliveries, pageable, 1)

        whenever(deliveryRepository.findByWebhookId(testWebhook.id, pageable)) doReturn page

        // When
        val result = deliveryService.getDeliveryHistory(testWebhook.id, pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testDelivery, result.content[0])
    }

    @Test
    fun `getDelivery should return delivery when found`() {
        // Given
        whenever(deliveryRepository.findById(testDelivery.id)) doReturn Optional.of(testDelivery)

        // When
        val result = deliveryService.getDelivery(testDelivery.id)

        // Then
        assertEquals(testDelivery.id, result.id)
    }

    @Test
    fun `getDelivery should throw when not found`() {
        // Given
        val deliveryId = UUID.randomUUID()
        whenever(deliveryRepository.findById(deliveryId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            deliveryService.getDelivery(deliveryId)
        }
    }

    @Test
    fun `getDeliveryStats should return statistics`() {
        // Given
        whenever(deliveryRepository.countByWebhookId(testWebhook.id)) doReturn 10L
        whenever(deliveryRepository.countByWebhookIdAndStatus(testWebhook.id, DeliveryStatus.DELIVERED)) doReturn 7L
        whenever(deliveryRepository.countByWebhookIdAndStatus(testWebhook.id, DeliveryStatus.PENDING)) doReturn 1L
        whenever(deliveryRepository.countByWebhookIdAndStatus(testWebhook.id, DeliveryStatus.FAILED)) doReturn 2L
        whenever(deliveryRepository.countByWebhookIdAndStatus(testWebhook.id, DeliveryStatus.EXHAUSTED)) doReturn 0L

        // When
        val result = deliveryService.getDeliveryStats(testWebhook.id)

        // Then
        assertEquals(10L, result["total"])
        assertEquals(7L, result["delivered"])
        assertEquals(1L, result["pending"])
        assertEquals(2L, result["failed"])
        assertEquals(0L, result["exhausted"])
    }

    @Test
    fun `processPendingDeliveries should process batch`() {
        // Given
        val deliveries = listOf(testDelivery)
        whenever(deliveryRepository.findPendingDeliveries(100)) doReturn deliveries
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }
        whenever(httpClient.deliver(any(), any())) doReturn DeliveryResult(
            success = true,
            statusCode = 200,
            responseBody = "OK",
            error = null
        )

        // When
        val count = deliveryService.processPendingDeliveries(100)

        // Then
        assertEquals(1, count)
    }

    @Test
    fun `processRetries should process eligible deliveries`() {
        // Given
        testDelivery.markFailed(500, "Error", "Server error")
        testDelivery.scheduleManualRetry()
        val deliveries = listOf(testDelivery)

        whenever(deliveryRepository.findDeliveriesForRetry(any(), any())) doReturn deliveries
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(deliveryRepository.save(any<WebhookDelivery>())).thenAnswer { invocation ->
            invocation.getArgument<WebhookDelivery>(0)
        }
        whenever(httpClient.deliver(any(), any())) doReturn DeliveryResult(
            success = true,
            statusCode = 200,
            responseBody = "OK",
            error = null
        )

        // When
        val count = deliveryService.processRetries(100)

        // Then
        assertEquals(1, count)
    }
}
