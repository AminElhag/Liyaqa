package com.liyaqa.organization.domain.ports

import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Organization entity.
 * Organizations are top-level entities without tenant filtering.
 */
interface OrganizationRepository {
    fun save(organization: Organization): Organization
    fun findById(id: UUID): Optional<Organization>
    fun findByStatus(status: OrganizationStatus, pageable: Pageable): Page<Organization>
    fun findAll(pageable: Pageable): Page<Organization>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}