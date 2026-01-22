package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataClientSubscriptionRepository : JpaRepository<ClientSubscription, UUID> {

    fun findByStatus(status: ClientSubscriptionStatus, pageable: Pageable): Page<ClientSubscription>

    fun findByOrganizationId(organizationId: UUID): List<ClientSubscription>

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientSubscription>

    @Query("""
        SELECT cs FROM ClientSubscription cs
        WHERE cs.organizationId = :organizationId
        AND cs.status IN ('ACTIVE', 'TRIAL')
        ORDER BY cs.startDate DESC
    """)
    fun findActiveByOrganizationId(@Param("organizationId") organizationId: UUID): Optional<ClientSubscription>

    fun findByClientPlanId(clientPlanId: UUID, pageable: Pageable): Page<ClientSubscription>

    fun findBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<ClientSubscription>

    @Query("""
        SELECT cs FROM ClientSubscription cs
        WHERE cs.endDate <= :endDateBefore
        AND cs.status IN :statuses
    """)
    fun findExpiring(
        @Param("endDateBefore") endDateBefore: LocalDate,
        @Param("statuses") statuses: List<ClientSubscriptionStatus>
    ): List<ClientSubscription>

    @Query("""
        SELECT cs FROM ClientSubscription cs
        WHERE cs.status = 'TRIAL'
        AND cs.trialEndsAt <= :trialEndsBefore
    """)
    fun findTrialsExpiring(@Param("trialEndsBefore") trialEndsBefore: LocalDate): List<ClientSubscription>

    @Query("""
        SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END
        FROM ClientSubscription cs
        WHERE cs.organizationId = :organizationId
        AND cs.status IN ('ACTIVE', 'TRIAL')
    """)
    fun existsActiveByOrganizationId(@Param("organizationId") organizationId: UUID): Boolean

    fun countByStatus(status: ClientSubscriptionStatus): Long

    fun countByOrganizationIdAndStatus(organizationId: UUID, status: ClientSubscriptionStatus): Long

    @Query("""
        SELECT COUNT(cs) FROM ClientSubscription cs
        WHERE cs.organizationId = :organizationId
        AND cs.status = 'ACTIVE'
        AND cs.endDate <= :endDateBefore
    """)
    fun countExpiringWithinDays(
        @Param("organizationId") organizationId: UUID,
        @Param("endDateBefore") endDateBefore: LocalDate
    ): Long
}

@Repository
class JpaClientSubscriptionRepository(
    private val springDataRepository: SpringDataClientSubscriptionRepository
) : ClientSubscriptionRepository {

    override fun save(subscription: ClientSubscription): ClientSubscription =
        springDataRepository.save(subscription)

    override fun findById(id: UUID): Optional<ClientSubscription> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ClientSubscription> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: ClientSubscriptionStatus, pageable: Pageable): Page<ClientSubscription> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByOrganizationId(organizationId: UUID): List<ClientSubscription> =
        springDataRepository.findByOrganizationId(organizationId)

    override fun findByOrganizationIdPaged(organizationId: UUID, pageable: Pageable): Page<ClientSubscription> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findActiveByOrganizationId(organizationId: UUID): Optional<ClientSubscription> =
        springDataRepository.findActiveByOrganizationId(organizationId)

    override fun findByClientPlanId(clientPlanId: UUID, pageable: Pageable): Page<ClientSubscription> =
        springDataRepository.findByClientPlanId(clientPlanId, pageable)

    override fun findBySalesRepId(salesRepId: UUID, pageable: Pageable): Page<ClientSubscription> =
        springDataRepository.findBySalesRepId(salesRepId, pageable)

    override fun findExpiring(endDateBefore: LocalDate, statuses: List<ClientSubscriptionStatus>): List<ClientSubscription> =
        springDataRepository.findExpiring(endDateBefore, statuses)

    override fun findTrialsExpiring(trialEndsBefore: LocalDate): List<ClientSubscription> =
        springDataRepository.findTrialsExpiring(trialEndsBefore)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsActiveByOrganizationId(organizationId: UUID): Boolean =
        springDataRepository.existsActiveByOrganizationId(organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: ClientSubscriptionStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByOrganizationIdAndStatus(organizationId: UUID, status: ClientSubscriptionStatus): Long =
        springDataRepository.countByOrganizationIdAndStatus(organizationId, status)

    override fun countExpiringWithinDays(organizationId: UUID, days: Int): Long {
        val endDateBefore = LocalDate.now().plusDays(days.toLong())
        return springDataRepository.countExpiringWithinDays(organizationId, endDateBefore)
    }
}
