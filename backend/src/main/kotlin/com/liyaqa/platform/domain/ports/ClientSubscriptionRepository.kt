package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ClientSubscription entity.
 * ClientSubscriptions are platform-level (not tenant-scoped) and represent
 * B2B subscription relationships between organizations and Liyaqa.
 */
interface ClientSubscriptionRepository {
    fun save(subscription: ClientSubscription): ClientSubscription
    fun findById(id: UUID): Optional<ClientSubscription>
    fun findAll(pageable: Pageable): Page<ClientSubscription>
    fun findByStatus(status: ClientSubscriptionStatus, pageable: Pageable): Page<ClientSubscription>
    fun findByOrganizationId(organizationId: UUID): List<ClientSubscription>
    fun findByOrganizationIdPaged(organizationId: UUID, pageable: Pageable): Page<ClientSubscription>
    fun findActiveByOrganizationId(organizationId: UUID): Optional<ClientSubscription>
    fun findByClientPlanId(clientPlanId: UUID, pageable: Pageable): Page<ClientSubscription>
    fun findBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<ClientSubscription>
    fun findExpiring(endDateBefore: LocalDate, statuses: List<ClientSubscriptionStatus>): List<ClientSubscription>
    fun findTrialsExpiring(trialEndsBefore: LocalDate): List<ClientSubscription>
    fun existsById(id: UUID): Boolean
    fun existsActiveByOrganizationId(organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: ClientSubscriptionStatus): Long
    fun countByOrganizationIdAndStatus(organizationId: UUID, status: ClientSubscriptionStatus): Long
    fun countExpiringWithinDays(organizationId: UUID, days: Int): Long
}
