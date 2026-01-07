package com.liyaqa.organization.infrastructure.persistence

import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.ports.ClubRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClubRepository : JpaRepository<Club, UUID> {
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Club>
    fun findByOrganizationIdAndStatus(organizationId: UUID, status: ClubStatus, pageable: Pageable): Page<Club>
    fun existsByOrganizationId(organizationId: UUID): Boolean
    fun countByOrganizationId(organizationId: UUID): Long
}

@Repository
class JpaClubRepository(
    private val springDataRepository: SpringDataClubRepository
) : ClubRepository {

    override fun save(club: Club): Club =
        springDataRepository.save(club)

    override fun findById(id: UUID): Optional<Club> =
        springDataRepository.findById(id)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Club> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findByOrganizationIdAndStatus(
        organizationId: UUID,
        status: ClubStatus,
        pageable: Pageable
    ): Page<Club> = springDataRepository.findByOrganizationIdAndStatus(organizationId, status, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByOrganizationId(organizationId: UUID): Boolean =
        springDataRepository.existsByOrganizationId(organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun countByOrganizationId(organizationId: UUID): Long =
        springDataRepository.countByOrganizationId(organizationId)
}