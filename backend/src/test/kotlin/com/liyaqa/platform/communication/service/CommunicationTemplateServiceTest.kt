package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.dto.CreateTemplateCommand
import com.liyaqa.platform.communication.dto.UpdateTemplateCommand
import com.liyaqa.platform.communication.exception.CommunicationTemplateNotFoundException
import com.liyaqa.platform.communication.exception.DuplicateTemplateCodeException
import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.CommunicationTemplate
import com.liyaqa.platform.communication.repository.CommunicationTemplateRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.whenever
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class CommunicationTemplateServiceTest {

    @Mock
    private lateinit var templateRepository: CommunicationTemplateRepository

    private lateinit var service: CommunicationTemplateService

    @BeforeEach
    fun setUp() {
        service = CommunicationTemplateService(templateRepository)
    }

    @Test
    fun `createTemplate should save template correctly`() {
        val command = CreateTemplateCommand(
            code = "WELCOME_EMAIL",
            nameEn = "Welcome Email",
            subjectEn = "Welcome to {{facilityName}}",
            bodyEn = "Hello {{name}}, welcome!",
            variables = listOf("facilityName", "name")
        )
        val expected = CommunicationTemplate.create(
            code = command.code,
            nameEn = command.nameEn,
            subjectEn = command.subjectEn,
            bodyEn = command.bodyEn,
            variables = command.variables.toMutableList()
        )
        whenever(templateRepository.existsByCode(command.code)) doReturn false
        whenever(templateRepository.save(any<CommunicationTemplate>())) doReturn expected

        val result = service.createTemplate(command)

        assertEquals("WELCOME_EMAIL", result.code)
        assertEquals("Welcome Email", result.nameEn)
    }

    @Test
    fun `createTemplate should reject duplicate code`() {
        val command = CreateTemplateCommand(
            code = "WELCOME_EMAIL",
            nameEn = "Welcome Email",
            subjectEn = "Welcome",
            bodyEn = "Hello"
        )
        whenever(templateRepository.existsByCode(command.code)) doReturn true

        assertThrows(DuplicateTemplateCodeException::class.java) {
            service.createTemplate(command)
        }
    }

    @Test
    fun `updateTemplate should update fields`() {
        val template = CommunicationTemplate.create(
            code = "WELCOME_EMAIL",
            nameEn = "Old Name",
            subjectEn = "Old Subject",
            bodyEn = "Old Body"
        )
        val command = UpdateTemplateCommand(nameEn = "New Name")
        whenever(templateRepository.findById(template.id)) doReturn Optional.of(template)
        whenever(templateRepository.save(any<CommunicationTemplate>())) doReturn template

        val result = service.updateTemplate(template.id, command)

        assertEquals("New Name", result.nameEn)
    }

    @Test
    fun `renderTemplate should substitute variables`() {
        val template = CommunicationTemplate.create(
            code = "WELCOME",
            nameEn = "Welcome",
            subjectEn = "Welcome {{name}}",
            bodyEn = "Hello {{name}}, your facility is {{facility}}."
        )
        whenever(templateRepository.findByCode("WELCOME")) doReturn Optional.of(template)

        val result = service.renderTemplate(
            code = "WELCOME",
            variables = mapOf("name" to "John", "facility" to "FitGym")
        )

        assertEquals("Welcome John", result.subject)
        assertEquals("Hello John, your facility is FitGym.", result.body)
    }
}
