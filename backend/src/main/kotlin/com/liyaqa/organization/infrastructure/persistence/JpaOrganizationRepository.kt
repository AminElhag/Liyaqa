package com.liyaqa.organization.infrastructure.persistence

import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.ports.OrganizationRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataOrganizationRepository : JpaRepository<Organization, UUID> {
    fun findByStatus(status: OrganizationStatus, pageable: Pageable): Page<Organization>
    fun countByStatus(status: OrganizationStatus): Long

    @Query("SELECT COUNT(o) FROM Organization o WHERE o.createdAt > :after")
    fun countByCreatedAtAfter(@Param("after") after: Instant): Long

    @Query("SELECT COUNT(o) FROM Organization o WHERE o.createdAt >= :start AND o.createdAt < :end")
    fun countByCreatedAtBetween(@Param("start") start: Instant, @Param("end") end: Instant): Long
}

@Repository
class JpaOrganizationRepository(
    private val springDataRepository: SpringDataOrganizationRepository
) : OrganizationRepository {

    override fun save(organization: Organization): Organization =
        springDataRepository.save(organization)

    override fun findById(id: UUID): Optional<Organization> =
        springDataRepository.findById(id)

    override fun findByStatus(status: OrganizationStatus, pageable: Pageable): Page<Organization> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAll(pageable: Pageable): Page<Organization> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: OrganizationStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countCreatedAfter(after: Instant): Long =
        springDataRepository.countByCreatedAtAfter(after)

    override fun countCreatedBetween(start: Instant, end: Instant): Long =
        springDataRepository.countByCreatedAtBetween(start, end)
}