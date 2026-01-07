package com.liyaqa.organization.infrastructure.persistence

import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.ports.LocationRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataLocationRepository : JpaRepository<Location, UUID> {
    fun findByClubId(clubId: UUID, pageable: Pageable): Page<Location>
    fun findByStatus(status: LocationStatus, pageable: Pageable): Page<Location>

    @Query("SELECT l FROM Location l WHERE l.organizationId = :organizationId")
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Location>

    @Query("SELECT COUNT(l) FROM Location l WHERE l.organizationId = :organizationId")
    fun countByOrganizationId(organizationId: UUID): Long
}

@Repository
class JpaLocationRepository(
    private val springDataRepository: SpringDataLocationRepository
) : LocationRepository {

    override fun save(location: Location): Location =
        springDataRepository.save(location)

    override fun findById(id: UUID): Optional<Location> =
        springDataRepository.findById(id)

    override fun findByClubId(clubId: UUID, pageable: Pageable): Page<Location> =
        springDataRepository.findByClubId(clubId, pageable)

    override fun findByStatus(status: LocationStatus, pageable: Pageable): Page<Location> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAll(pageable: Pageable): Page<Location> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Location> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun countByOrganizationId(organizationId: UUID): Long =
        springDataRepository.countByOrganizationId(organizationId)
}