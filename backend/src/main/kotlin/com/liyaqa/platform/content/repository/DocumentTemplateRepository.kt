package com.liyaqa.platform.content.repository

import com.liyaqa.platform.content.model.DocumentTemplate
import com.liyaqa.platform.content.model.TemplateType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface DocumentTemplateRepository {
    fun save(template: DocumentTemplate): DocumentTemplate
    fun findById(id: UUID): Optional<DocumentTemplate>
    fun findByKey(key: String): Optional<DocumentTemplate>
    fun findAll(pageable: Pageable): Page<DocumentTemplate>
    fun findByType(type: TemplateType, pageable: Pageable): Page<DocumentTemplate>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<DocumentTemplate>
    fun deleteById(id: UUID)
    fun existsByKey(key: String): Boolean
}
