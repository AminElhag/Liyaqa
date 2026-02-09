package com.liyaqa.platform.access.repository

import com.liyaqa.platform.access.model.TenantApiKey
import java.util.Optional
import java.util.UUID

interface TenantApiKeyRepository {
    fun save(key: TenantApiKey): TenantApiKey
    fun findById(id: UUID): Optional<TenantApiKey>
    fun findByKeyPrefix(prefix: String): Optional<TenantApiKey>
    fun findByTenantId(tenantId: UUID): List<TenantApiKey>
    fun findByTenantIdAndIsActiveTrue(tenantId: UUID): List<TenantApiKey>
    fun countByTenantIdAndIsActiveTrue(tenantId: UUID): Long
    fun findAll(): List<TenantApiKey>
}
