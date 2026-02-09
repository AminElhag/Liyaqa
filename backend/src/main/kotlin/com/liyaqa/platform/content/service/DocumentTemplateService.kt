package com.liyaqa.platform.content.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.jknack.handlebars.Handlebars
import com.liyaqa.platform.content.dto.CreateTemplateRequest
import com.liyaqa.platform.content.dto.TemplatePreviewRequest
import com.liyaqa.platform.content.dto.TemplatePreviewResponse
import com.liyaqa.platform.content.dto.TemplateResponse
import com.liyaqa.platform.content.dto.TemplateVersionResponse
import com.liyaqa.platform.content.dto.UpdateTemplateRequest
import com.liyaqa.platform.content.exception.DuplicateTemplateKeyException
import com.liyaqa.platform.content.exception.TemplateNotFoundException
import com.liyaqa.platform.content.exception.TemplateNotFoundByKeyException
import com.liyaqa.platform.content.exception.TemplateRenderException
import com.liyaqa.platform.content.repository.DocumentTemplateRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class DocumentTemplateService(
    private val templateRepository: DocumentTemplateRepository,
    private val auditService: AuditService,
    private val securityService: SecurityService,
    private val objectMapper: ObjectMapper
) {
    private val handlebars = Handlebars()

    @Transactional
    fun createTemplate(request: CreateTemplateRequest): TemplateResponse {
        if (templateRepository.existsByKey(request.key)) {
            throw DuplicateTemplateKeyException(request.key)
        }

        val template = com.liyaqa.platform.content.model.DocumentTemplate.create(
            key = request.key,
            name = request.name,
            nameAr = request.nameAr,
            type = request.type,
            content = request.content,
            contentAr = request.contentAr,
            variables = request.variables
        )

        val saved = templateRepository.save(template)

        auditService.logAsync(
            action = AuditAction.CREATE,
            entityType = "DocumentTemplate",
            entityId = saved.id,
            description = "Created template: ${saved.name}",
            newValue = objectMapper.writeValueAsString(TemplateResponse.from(saved))
        )

        return TemplateResponse.from(saved)
    }

    @Transactional(readOnly = true)
    fun getTemplate(id: UUID): TemplateResponse {
        val template = templateRepository.findById(id)
            .orElseThrow { TemplateNotFoundException(id) }
        return TemplateResponse.from(template)
    }

    @Transactional(readOnly = true)
    fun getTemplateByKey(key: String): TemplateResponse {
        val template = templateRepository.findByKey(key)
            .orElseThrow { TemplateNotFoundByKeyException(key) }
        return TemplateResponse.from(template)
    }

    @Transactional(readOnly = true)
    fun listTemplates(pageable: Pageable): Page<TemplateResponse> {
        return templateRepository.findAll(pageable).map { TemplateResponse.from(it) }
    }

    @Transactional
    fun updateTemplate(id: UUID, request: UpdateTemplateRequest): TemplateResponse {
        val template = templateRepository.findById(id)
            .orElseThrow { TemplateNotFoundException(id) }

        val oldValue = objectMapper.writeValueAsString(TemplateResponse.from(template))

        request.name?.let { template.name = it }
        request.nameAr?.let { template.nameAr = it }
        request.content?.let { template.content = it }
        request.contentAr?.let { template.contentAr = it }
        request.variables?.let { template.variables = it.toMutableList() }
        request.isActive?.let { template.isActive = it }

        template.updatedBy = securityService.getCurrentUserId()

        val saved = templateRepository.save(template)

        auditService.logAsync(
            action = AuditAction.UPDATE,
            entityType = "DocumentTemplate",
            entityId = saved.id,
            description = "Updated template: ${saved.name}",
            oldValue = oldValue,
            newValue = objectMapper.writeValueAsString(TemplateResponse.from(saved))
        )

        return TemplateResponse.from(saved)
    }

    @Transactional
    fun deleteTemplate(id: UUID) {
        val template = templateRepository.findById(id)
            .orElseThrow { TemplateNotFoundException(id) }

        templateRepository.deleteById(id)

        auditService.logAsync(
            action = AuditAction.DELETE,
            entityType = "DocumentTemplate",
            entityId = id,
            description = "Deleted template: ${template.name}"
        )
    }

    @Transactional(readOnly = true)
    fun previewTemplate(id: UUID, request: TemplatePreviewRequest): TemplatePreviewResponse {
        val template = templateRepository.findById(id)
            .orElseThrow { TemplateNotFoundException(id) }

        val content = if (request.locale.lowercase() == "ar" && template.contentAr != null) {
            template.contentAr!!
        } else {
            template.content
        }

        try {
            val compiled = handlebars.compileInline(content)
            val rendered = compiled.apply(request.variables)
            return TemplatePreviewResponse(
                renderedContent = rendered,
                locale = request.locale
            )
        } catch (e: Exception) {
            throw TemplateRenderException("Failed to render template: ${e.message}", e)
        }
    }

    @Transactional(readOnly = true)
    fun getTemplateVersionHistory(id: UUID, pageable: Pageable): Page<TemplateVersionResponse> {
        // Verify template exists
        templateRepository.findById(id)
            .orElseThrow { TemplateNotFoundException(id) }

        return auditService.getAuditLogsByEntity("DocumentTemplate", id, pageable).map { log ->
            TemplateVersionResponse(
                id = log.id,
                action = log.action.name,
                description = log.description,
                oldValue = log.oldValue,
                newValue = log.newValue,
                userId = log.userId,
                userEmail = log.userEmail,
                createdAt = log.createdAt
            )
        }
    }
}
