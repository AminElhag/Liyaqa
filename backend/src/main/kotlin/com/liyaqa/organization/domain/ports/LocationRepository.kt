package com.liyaqa.organization.domain.ports

import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Location entity.
 * Supports both tenant-level (club) and organization-level queries.
 */
interface LocationRepository {
    fun save(location: Location): Location
    fun findById(id: UUID): Optional<Location>
    fun findByClubId(clubId: UUID, pageable: Pageable): Page<Location>
    fun findByStatus(status: LocationStatus, pageable: Pageable): Page<Location>
    fun findAll(pageable: Pageable): Page<Location>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    // Organization-level queries (for super-tenant access)
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Location>
    fun countByOrganizationId(organizationId: UUID): Long
}