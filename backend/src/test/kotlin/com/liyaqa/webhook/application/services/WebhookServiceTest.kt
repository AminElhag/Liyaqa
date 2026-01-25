package com.liyaqa.webhook.application.services

import com.liyaqa.webhook.application.commands.CreateWebhookCommand
import com.liyaqa.webhook.application.commands.UpdateWebhookCommand
import com.liyaqa.webhook.domain.model.Webhook
import com.liyaqa.webhook.domain.model.WebhookEventType
import com.liyaqa.webhook.domain.ports.WebhookRepository
import com.liyaqa.webhook.infrastructure.crypto.WebhookSignatureService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WebhookServiceTest {

    @Mock
    private lateinit var webhookRepository: WebhookRepository

    @Mock
    private lateinit var signatureService: WebhookSignatureService

    private lateinit var webhookService: WebhookService

    private lateinit var testWebhook: Webhook

    @BeforeEach
    fun setUp() {
        webhookService = WebhookService(webhookRepository, signatureService)

        whenever(signatureService.generateSecret()) doReturn "test-secret-key"

        testWebhook = Webhook(
            id = UUID.randomUUID(),
            name = "Test Webhook",
            url = "https://example.com/webhook",
            secret = "test-secret",
            events = listOf("member.created", "member.updated")
        )
    }

    @Test
    fun `createWebhook should create webhook with valid data`() {
        // Given
        val command = CreateWebhookCommand(
            name = "My Webhook",
            url = "https://api.example.com/webhooks",
            events = listOf("member.created")
        )

        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.createWebhook(command)

        // Then
        assertEquals("My Webhook", result.name)
        assertEquals("https://api.example.com/webhooks", result.url)
        assertEquals(listOf("member.created"), result.events)
        assertEquals("test-secret-key", result.secret)
        assertTrue(result.isActive)
        verify(webhookRepository).save(any())
    }

    @Test
    fun `createWebhook should reject non-HTTPS URL`() {
        // Given
        val command = CreateWebhookCommand(
            name = "My Webhook",
            url = "http://example.com/webhook",
            events = listOf("member.created")
        )

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            webhookService.createWebhook(command)
        }
    }

    @Test
    fun `createWebhook should allow localhost HTTP`() {
        // Given
        val command = CreateWebhookCommand(
            name = "Local Webhook",
            url = "http://localhost:3000/webhook",
            events = listOf("member.created")
        )

        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.createWebhook(command)

        // Then
        assertEquals("http://localhost:3000/webhook", result.url)
    }

    @Test
    fun `createWebhook should reject empty events`() {
        // Given
        val command = CreateWebhookCommand(
            name = "My Webhook",
            url = "https://example.com/webhook",
            events = emptyList()
        )

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            webhookService.createWebhook(command)
        }
    }

    @Test
    fun `createWebhook should reject invalid event type`() {
        // Given
        val command = CreateWebhookCommand(
            name = "My Webhook",
            url = "https://example.com/webhook",
            events = listOf("invalid.event")
        )

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            webhookService.createWebhook(command)
        }
    }

    @Test
    fun `createWebhook should accept wildcard event`() {
        // Given
        val command = CreateWebhookCommand(
            name = "All Events Webhook",
            url = "https://example.com/webhook",
            events = listOf("*")
        )

        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.createWebhook(command)

        // Then
        assertEquals(listOf("*"), result.events)
    }

    @Test
    fun `getWebhook should return webhook when found`() {
        // Given
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)

        // When
        val result = webhookService.getWebhook(testWebhook.id)

        // Then
        assertEquals(testWebhook.id, result.id)
        assertEquals(testWebhook.name, result.name)
    }

    @Test
    fun `getWebhook should throw when not found`() {
        // Given
        val webhookId = UUID.randomUUID()
        whenever(webhookRepository.findById(webhookId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            webhookService.getWebhook(webhookId)
        }
    }

    @Test
    fun `updateWebhook should update fields`() {
        // Given
        val command = UpdateWebhookCommand(
            id = testWebhook.id,
            name = "Updated Name",
            url = "https://new-url.com/webhook"
        )

        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.updateWebhook(command)

        // Then
        assertEquals("Updated Name", result.name)
        assertEquals("https://new-url.com/webhook", result.url)
    }

    @Test
    fun `updateWebhook should activate webhook`() {
        // Given
        testWebhook.deactivate()
        val command = UpdateWebhookCommand(
            id = testWebhook.id,
            isActive = true
        )

        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.updateWebhook(command)

        // Then
        assertTrue(result.isActive)
    }

    @Test
    fun `deleteWebhook should delete when exists`() {
        // Given
        whenever(webhookRepository.existsById(testWebhook.id)) doReturn true

        // When
        webhookService.deleteWebhook(testWebhook.id)

        // Then
        verify(webhookRepository).deleteById(testWebhook.id)
    }

    @Test
    fun `deleteWebhook should throw when not found`() {
        // Given
        val webhookId = UUID.randomUUID()
        whenever(webhookRepository.existsById(webhookId)) doReturn false

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            webhookService.deleteWebhook(webhookId)
        }
        verify(webhookRepository, never()).deleteById(webhookId)
    }

    @Test
    fun `listWebhooks should return paginated results`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val webhooks = listOf(testWebhook)
        val page = PageImpl(webhooks, pageable, 1)

        whenever(webhookRepository.findAll(pageable)) doReturn page

        // When
        val result = webhookService.listWebhooks(pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testWebhook, result.content[0])
    }

    @Test
    fun `activateWebhook should activate webhook`() {
        // Given
        testWebhook.deactivate()
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.activateWebhook(testWebhook.id)

        // Then
        assertTrue(result.isActive)
    }

    @Test
    fun `deactivateWebhook should deactivate webhook`() {
        // Given
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.deactivateWebhook(testWebhook.id)

        // Then
        assertFalse(result.isActive)
    }

    @Test
    fun `regenerateSecret should update webhook secret`() {
        // Given
        val oldSecret = testWebhook.secret
        whenever(webhookRepository.findById(testWebhook.id)) doReturn Optional.of(testWebhook)
        whenever(webhookRepository.save(any<Webhook>())).thenAnswer { invocation ->
            invocation.getArgument<Webhook>(0)
        }

        // When
        val result = webhookService.regenerateSecret(testWebhook.id)

        // Then
        assertEquals("test-secret-key", result.secret)
    }

    @Test
    fun `findActiveWebhooksForEvent should delegate to repository`() {
        // Given
        val eventType = "member.created"
        whenever(webhookRepository.findActiveByEventType(eventType)) doReturn listOf(testWebhook)

        // When
        val result = webhookService.findActiveWebhooksForEvent(eventType)

        // Then
        assertEquals(1, result.size)
        assertEquals(testWebhook, result[0])
    }

    @Test
    fun `getAvailableEventTypes should return all event types`() {
        // When
        val result = webhookService.getAvailableEventTypes()

        // Then
        assertTrue(result.contains("member.created"))
        assertTrue(result.contains("subscription.created"))
        assertTrue(result.contains("invoice.paid"))
    }
}
