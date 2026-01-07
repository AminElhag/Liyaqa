package com.liyaqa.organization.domain.ports

import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Club entity.
 * Clubs can be filtered by organization ID for super-tenant queries.
 */
interface ClubRepository {
    fun save(club: Club): Club
    fun findById(id: UUID): Optional<Club>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Club>
    fun findByOrganizationIdAndStatus(organizationId: UUID, status: ClubStatus, pageable: Pageable): Page<Club>
    fun existsById(id: UUID): Boolean
    fun existsByOrganizationId(organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun countByOrganizationId(organizationId: UUID): Long
}