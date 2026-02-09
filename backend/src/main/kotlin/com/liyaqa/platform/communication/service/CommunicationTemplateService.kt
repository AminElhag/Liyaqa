package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.dto.CreateTemplateCommand
import com.liyaqa.platform.communication.dto.UpdateTemplateCommand
import com.liyaqa.platform.communication.exception.CommunicationTemplateNotFoundException
import com.liyaqa.platform.communication.exception.DuplicateTemplateCodeException
import com.liyaqa.platform.communication.model.CommunicationTemplate
import com.liyaqa.platform.communication.repository.CommunicationTemplateRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class RenderedTemplate(
    val subject: String,
    val body: String
)

@Service
@Transactional
class CommunicationTemplateService(
    private val templateRepository: CommunicationTemplateRepository
) {

    fun createTemplate(command: CreateTemplateCommand): CommunicationTemplate {
        if (templateRepository.existsByCode(command.code)) {
            throw DuplicateTemplateCodeException(command.code)
        }
        val template = CommunicationTemplate.create(
            code = command.code,
            nameEn = command.nameEn,
            nameAr = command.nameAr,
            subjectEn = command.subjectEn,
            subjectAr = command.subjectAr,
            bodyEn = command.bodyEn,
            bodyAr = command.bodyAr,
            channel = command.channel,
            variables = command.variables.toMutableList()
        )
        return templateRepository.save(template)
    }

    fun updateTemplate(id: UUID, command: UpdateTemplateCommand): CommunicationTemplate {
        val template = templateRepository.findById(id)
            .orElseThrow { CommunicationTemplateNotFoundException(id.toString()) }
        command.nameEn?.let { template.nameEn = it }
        command.nameAr?.let { template.nameAr = it }
        command.subjectEn?.let { template.subjectEn = it }
        command.subjectAr?.let { template.subjectAr = it }
        command.bodyEn?.let { template.bodyEn = it }
        command.bodyAr?.let { template.bodyAr = it }
        command.channel?.let { template.channel = it }
        command.variables?.let { template.variables = it.toMutableList() }
        command.isActive?.let { template.isActive = it }
        return templateRepository.save(template)
    }

    @Transactional(readOnly = true)
    fun getTemplate(id: UUID): CommunicationTemplate =
        templateRepository.findById(id)
            .orElseThrow { CommunicationTemplateNotFoundException(id.toString()) }

    @Transactional(readOnly = true)
    fun getTemplateByCode(code: String): CommunicationTemplate =
        templateRepository.findByCode(code)
            .orElseThrow { CommunicationTemplateNotFoundException(code) }

    @Transactional(readOnly = true)
    fun listTemplates(pageable: Pageable): Page<CommunicationTemplate> =
        templateRepository.findAll(pageable)

    fun renderTemplate(code: String, variables: Map<String, String>, locale: String = "en"): RenderedTemplate {
        val template = getTemplateByCode(code)
        val subject = substituteVariables(template.getSubject(locale), variables)
        val body = substituteVariables(template.getBody(locale), variables)
        return RenderedTemplate(subject = subject, body = body)
    }

    private fun substituteVariables(text: String, variables: Map<String, String>): String {
        var result = text
        for ((key, value) in variables) {
            result = result.replace("{{$key}}", value)
        }
        return result
    }
}
