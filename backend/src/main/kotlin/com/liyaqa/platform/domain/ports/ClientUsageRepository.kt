package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientUsage
import com.liyaqa.platform.domain.model.UsageLevel
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ClientUsage entity.
 * Tracks client resource usage against plan limits.
 */
interface ClientUsageRepository {
    fun save(usage: ClientUsage): ClientUsage
    fun findById(id: UUID): Optional<ClientUsage>
    fun findByOrganizationId(organizationId: UUID): Optional<ClientUsage>
    fun findAll(pageable: Pageable): Page<ClientUsage>
    fun findExceeded(pageable: Pageable): Page<ClientUsage>
    fun findByMemberUsageLevel(level: UsageLevel, pageable: Pageable): Page<ClientUsage>
    fun findApproachingLimits(warningThresholdPercent: Int, pageable: Pageable): Page<ClientUsage>
    fun findInGracePeriod(pageable: Pageable): Page<ClientUsage>
    fun existsById(id: UUID): Boolean
    fun existsByOrganizationId(organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countExceeded(): Long
    fun countApproachingLimits(warningThresholdPercent: Int): Long
}
