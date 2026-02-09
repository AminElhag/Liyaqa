package com.liyaqa.platform.content.repository

import com.liyaqa.platform.content.model.DocumentTemplate
import com.liyaqa.platform.content.model.TemplateType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataDocumentTemplateRepository : JpaRepository<DocumentTemplate, UUID> {
    fun findByKey(key: String): Optional<DocumentTemplate>
    fun findByType(type: TemplateType, pageable: Pageable): Page<DocumentTemplate>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<DocumentTemplate>
    fun existsByKey(key: String): Boolean
}

@Repository
class JpaDocumentTemplateRepository(
    private val springDataRepository: SpringDataDocumentTemplateRepository
) : DocumentTemplateRepository {

    override fun save(template: DocumentTemplate): DocumentTemplate =
        springDataRepository.save(template)

    override fun findById(id: UUID): Optional<DocumentTemplate> =
        springDataRepository.findById(id)

    override fun findByKey(key: String): Optional<DocumentTemplate> =
        springDataRepository.findByKey(key)

    override fun findAll(pageable: Pageable): Page<DocumentTemplate> =
        springDataRepository.findAll(pageable)

    override fun findByType(type: TemplateType, pageable: Pageable): Page<DocumentTemplate> =
        springDataRepository.findByType(type, pageable)

    override fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<DocumentTemplate> =
        springDataRepository.findByIsActive(isActive, pageable)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsByKey(key: String): Boolean =
        springDataRepository.existsByKey(key)
}
