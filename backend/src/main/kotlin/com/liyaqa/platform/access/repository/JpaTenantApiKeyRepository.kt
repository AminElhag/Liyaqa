package com.liyaqa.platform.access.repository

import com.liyaqa.platform.access.model.TenantApiKey
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataTenantApiKeyRepository : JpaRepository<TenantApiKey, UUID> {
    fun findByKeyPrefix(prefix: String): Optional<TenantApiKey>
    fun findByTenantId(tenantId: UUID): List<TenantApiKey>
    fun findByTenantIdAndIsActiveTrue(tenantId: UUID): List<TenantApiKey>
    fun countByTenantIdAndIsActiveTrue(tenantId: UUID): Long
}

@Repository
class JpaTenantApiKeyRepository(
    private val springDataRepository: SpringDataTenantApiKeyRepository
) : TenantApiKeyRepository {

    override fun save(key: TenantApiKey): TenantApiKey =
        springDataRepository.save(key)

    override fun findById(id: UUID): Optional<TenantApiKey> =
        springDataRepository.findById(id)

    override fun findByKeyPrefix(prefix: String): Optional<TenantApiKey> =
        springDataRepository.findByKeyPrefix(prefix)

    override fun findByTenantId(tenantId: UUID): List<TenantApiKey> =
        springDataRepository.findByTenantId(tenantId)

    override fun findByTenantIdAndIsActiveTrue(tenantId: UUID): List<TenantApiKey> =
        springDataRepository.findByTenantIdAndIsActiveTrue(tenantId)

    override fun countByTenantIdAndIsActiveTrue(tenantId: UUID): Long =
        springDataRepository.countByTenantIdAndIsActiveTrue(tenantId)

    override fun findAll(): List<TenantApiKey> =
        springDataRepository.findAll()
}
