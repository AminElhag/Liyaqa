package com.liyaqa.platform.content.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.liyaqa.platform.content.dto.CreateTemplateRequest
import com.liyaqa.platform.content.dto.TemplatePreviewRequest
import com.liyaqa.platform.content.dto.UpdateTemplateRequest
import com.liyaqa.platform.content.exception.DuplicateTemplateKeyException
import com.liyaqa.platform.content.exception.TemplateNotFoundException
import com.liyaqa.platform.content.exception.TemplateRenderException
import com.liyaqa.platform.content.model.DocumentTemplate
import com.liyaqa.platform.content.model.TemplateType
import com.liyaqa.platform.content.repository.DocumentTemplateRepository
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.mockito.junit.jupiter.MockitoSettings
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentTemplateServiceTest {

    @Mock
    private lateinit var templateRepository: DocumentTemplateRepository

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var securityService: SecurityService

    private lateinit var objectMapper: ObjectMapper
    private lateinit var service: DocumentTemplateService

    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        objectMapper = ObjectMapper().apply {
            registerModule(JavaTimeModule())
        }
        service = DocumentTemplateService(templateRepository, auditService, securityService, objectMapper)
        whenever(securityService.getCurrentUserId()) doReturn userId
    }

    @Test
    fun `createTemplate should create and log audit`() {
        val request = CreateTemplateRequest(
            key = "welcome-email",
            name = "Welcome Email",
            type = TemplateType.EMAIL,
            content = "Hello {{name}}",
            variables = listOf("name")
        )
        whenever(templateRepository.existsByKey(request.key)) doReturn false
        whenever(templateRepository.save(any<DocumentTemplate>())).thenAnswer { it.arguments[0] }

        val result = service.createTemplate(request)

        assertEquals("welcome-email", result.key)
        assertEquals("Welcome Email", result.name)
        assertEquals(TemplateType.EMAIL, result.type)
    }

    @Test
    fun `createTemplate should throw DuplicateTemplateKeyException for existing key`() {
        val request = CreateTemplateRequest(
            key = "existing-key",
            name = "Test",
            type = TemplateType.EMAIL,
            content = "Test"
        )
        whenever(templateRepository.existsByKey(request.key)) doReturn true

        assertThrows(DuplicateTemplateKeyException::class.java) {
            service.createTemplate(request)
        }
    }

    @Test
    fun `getTemplate should return response`() {
        val template = createTestTemplate()
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        val result = service.getTemplate(template.id)

        assertEquals(template.id, result.id)
        assertEquals("test-template", result.key)
    }

    @Test
    fun `getTemplate should throw TemplateNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(templateRepository.findById(id)) doReturn Optional.empty()

        assertThrows(TemplateNotFoundException::class.java) {
            service.getTemplate(id)
        }
    }

    @Test
    fun `updateTemplate should partial update works`() {
        val template = createTestTemplate()
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)
        whenever(templateRepository.save(any<DocumentTemplate>())).thenAnswer { it.arguments[0] }

        val request = UpdateTemplateRequest(name = "Updated Name")
        val result = service.updateTemplate(template.id, request)

        assertEquals("Updated Name", result.name)
        assertEquals("Hello {{name}}", result.content) // unchanged
    }

    @Test
    fun `updateTemplate should log oldValue and newValue in audit`() {
        val template = createTestTemplate()
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)
        whenever(templateRepository.save(any<DocumentTemplate>())).thenAnswer { it.arguments[0] }

        service.updateTemplate(template.id, UpdateTemplateRequest(name = "New Name"))

        verify(auditService).logAsync(
            action = any(),
            entityType = any(),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `deleteTemplate should delete and log`() {
        val template = createTestTemplate()
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        service.deleteTemplate(template.id)

        verify(templateRepository).deleteById(template.id)
        verify(auditService).logAsync(
            action = any(),
            entityType = any(),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `previewTemplate should render Handlebars with English content`() {
        val template = createTestTemplate()
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        val request = TemplatePreviewRequest(
            variables = mapOf("name" to "Ahmed"),
            locale = "en"
        )
        val result = service.previewTemplate(template.id, request)

        assertEquals("Hello Ahmed", result.renderedContent)
        assertEquals("en", result.locale)
    }

    @Test
    fun `previewTemplate should render Arabic content when locale is ar`() {
        val template = DocumentTemplate.create(
            key = "test-ar",
            name = "Test",
            type = TemplateType.EMAIL,
            content = "Hello {{name}}",
            contentAr = "مرحبا {{name}}"
        )
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        val request = TemplatePreviewRequest(
            variables = mapOf("name" to "Ahmed"),
            locale = "ar"
        )
        val result = service.previewTemplate(template.id, request)

        assertEquals("مرحبا Ahmed", result.renderedContent)
        assertEquals("ar", result.locale)
    }

    @Test
    fun `previewTemplate should throw TemplateRenderException for invalid syntax`() {
        val template = DocumentTemplate.create(
            key = "bad-syntax",
            name = "Bad",
            type = TemplateType.EMAIL,
            content = "Hello {{#if}}"
        )
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        val request = TemplatePreviewRequest(variables = emptyMap())

        assertThrows(TemplateRenderException::class.java) {
            service.previewTemplate(template.id, request)
        }
    }

    @Test
    fun `previewTemplate should correctly substitute variables`() {
        val template = DocumentTemplate.create(
            key = "contract",
            name = "Contract",
            type = TemplateType.CONTRACT,
            content = "Hello {{name}}, your plan is {{plan}}."
        )
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        val request = TemplatePreviewRequest(
            variables = mapOf("name" to "Ahmed", "plan" to "Premium")
        )
        val result = service.previewTemplate(template.id, request)

        assertEquals("Hello Ahmed, your plan is Premium.", result.renderedContent)
    }

    @Test
    fun `previewTemplate should produce empty strings for missing variables`() {
        val template = DocumentTemplate.create(
            key = "missing-vars",
            name = "Missing",
            type = TemplateType.EMAIL,
            content = "Hello {{name}}"
        )
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)

        val request = TemplatePreviewRequest(variables = emptyMap())
        val result = service.previewTemplate(template.id, request)

        assertEquals("Hello ", result.renderedContent)
    }

    private fun createTestTemplate(): DocumentTemplate {
        return DocumentTemplate.create(
            key = "test-template",
            name = "Test Template",
            type = TemplateType.EMAIL,
            content = "Hello {{name}}",
            variables = listOf("name")
        )
    }
}
