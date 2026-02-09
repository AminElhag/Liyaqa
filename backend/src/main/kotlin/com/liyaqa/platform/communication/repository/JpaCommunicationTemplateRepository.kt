package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.CommunicationTemplate
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataCommunicationTemplateRepository : JpaRepository<CommunicationTemplate, UUID> {
    fun findByCode(code: String): Optional<CommunicationTemplate>
    fun existsByCode(code: String): Boolean
}

@Repository
class JpaCommunicationTemplateRepository(
    private val springDataRepository: SpringDataCommunicationTemplateRepository
) : CommunicationTemplateRepository {

    override fun save(template: CommunicationTemplate): CommunicationTemplate =
        springDataRepository.save(template)

    override fun findById(id: UUID): Optional<CommunicationTemplate> =
        springDataRepository.findById(id)

    override fun findByCode(code: String): Optional<CommunicationTemplate> =
        springDataRepository.findByCode(code)

    override fun findAll(pageable: Pageable): Page<CommunicationTemplate> =
        springDataRepository.findAll(pageable)

    override fun existsByCode(code: String): Boolean =
        springDataRepository.existsByCode(code)
}
