package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface TenantRepository {
    fun save(tenant: Tenant): Tenant
    fun findById(id: UUID): Optional<Tenant>
    fun findAll(pageable: Pageable): Page<Tenant>
    fun findByStatus(status: TenantStatus, pageable: Pageable): Page<Tenant>
    fun findByDealId(dealId: UUID): Optional<Tenant>
    fun findBySubdomain(subdomain: String): Optional<Tenant>
    fun existsBySubdomain(subdomain: String): Boolean
    fun existsById(id: UUID): Boolean
    fun count(): Long
    fun findAllById(ids: Iterable<UUID>): List<Tenant>
}
