package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataTenantRepository : JpaRepository<Tenant, UUID> {
    fun findByStatus(status: TenantStatus, pageable: Pageable): Page<Tenant>
    fun findByDealId(dealId: UUID): Optional<Tenant>
    fun findBySubdomain(subdomain: String): Optional<Tenant>
    fun existsBySubdomain(subdomain: String): Boolean
}

@Repository
class JpaTenantRepository(
    private val springDataRepository: SpringDataTenantRepository
) : TenantRepository {

    override fun save(tenant: Tenant): Tenant =
        springDataRepository.save(tenant)

    override fun findById(id: UUID): Optional<Tenant> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Tenant> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: TenantStatus, pageable: Pageable): Page<Tenant> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByDealId(dealId: UUID): Optional<Tenant> =
        springDataRepository.findByDealId(dealId)

    override fun findBySubdomain(subdomain: String): Optional<Tenant> =
        springDataRepository.findBySubdomain(subdomain)

    override fun existsBySubdomain(subdomain: String): Boolean =
        springDataRepository.existsBySubdomain(subdomain)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findAllById(ids: Iterable<UUID>): List<Tenant> =
        springDataRepository.findAllById(ids)
}
