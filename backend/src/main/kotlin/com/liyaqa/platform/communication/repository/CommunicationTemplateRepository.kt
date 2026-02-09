package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.CommunicationTemplate
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface CommunicationTemplateRepository {
    fun save(template: CommunicationTemplate): CommunicationTemplate
    fun findById(id: UUID): Optional<CommunicationTemplate>
    fun findByCode(code: String): Optional<CommunicationTemplate>
    fun findAll(pageable: Pageable): Page<CommunicationTemplate>
    fun existsByCode(code: String): Boolean
}
