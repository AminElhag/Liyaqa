package com.liyaqa.platform.access.repository

import com.liyaqa.platform.access.model.ImpersonationSession
import jakarta.persistence.EntityManager
import jakarta.persistence.criteria.Predicate
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataImpersonationSessionRepository : JpaRepository<ImpersonationSession, UUID> {
    fun findByPlatformUserIdAndIsActiveTrue(platformUserId: UUID): Optional<ImpersonationSession>
    fun findByIsActiveTrue(): List<ImpersonationSession>
    fun countByPlatformUserIdAndIsActiveTrue(platformUserId: UUID): Long
}

@Repository
class JpaImpersonationSessionRepository(
    private val springDataRepository: SpringDataImpersonationSessionRepository,
    private val entityManager: EntityManager
) : ImpersonationSessionRepository {

    override fun save(session: ImpersonationSession): ImpersonationSession =
        springDataRepository.save(session)

    override fun findById(id: UUID): Optional<ImpersonationSession> =
        springDataRepository.findById(id)

    override fun findByPlatformUserIdAndIsActiveTrue(platformUserId: UUID): Optional<ImpersonationSession> =
        springDataRepository.findByPlatformUserIdAndIsActiveTrue(platformUserId)

    override fun findByIsActiveTrue(): List<ImpersonationSession> =
        springDataRepository.findByIsActiveTrue()

    override fun countByPlatformUserIdAndIsActiveTrue(platformUserId: UUID): Long =
        springDataRepository.countByPlatformUserIdAndIsActiveTrue(platformUserId)

    override fun findByFilters(
        platformUserId: UUID?,
        targetTenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        pageable: Pageable
    ): Page<ImpersonationSession> {
        val cb = entityManager.criteriaBuilder
        val cq = cb.createQuery(ImpersonationSession::class.java)
        val root = cq.from(ImpersonationSession::class.java)

        val predicates = mutableListOf<Predicate>()

        platformUserId?.let {
            predicates.add(cb.equal(root.get<UUID>("platformUserId"), it))
        }
        targetTenantId?.let {
            predicates.add(cb.equal(root.get<UUID>("targetTenantId"), it))
        }
        dateFrom?.let {
            predicates.add(cb.greaterThanOrEqualTo(root.get("startedAt"), it))
        }
        dateTo?.let {
            predicates.add(cb.lessThanOrEqualTo(root.get("startedAt"), it))
        }

        if (predicates.isNotEmpty()) {
            cq.where(*predicates.toTypedArray())
        }
        cq.orderBy(cb.desc(root.get<Instant>("startedAt")))

        val query = entityManager.createQuery(cq)
        val total = query.resultList.size.toLong()

        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize

        // Count query
        val countCq = cb.createQuery(Long::class.java)
        val countRoot = countCq.from(ImpersonationSession::class.java)
        countCq.select(cb.count(countRoot))

        val countPredicates = mutableListOf<Predicate>()
        platformUserId?.let {
            countPredicates.add(cb.equal(countRoot.get<UUID>("platformUserId"), it))
        }
        targetTenantId?.let {
            countPredicates.add(cb.equal(countRoot.get<UUID>("targetTenantId"), it))
        }
        dateFrom?.let {
            countPredicates.add(cb.greaterThanOrEqualTo(countRoot.get("startedAt"), it))
        }
        dateTo?.let {
            countPredicates.add(cb.lessThanOrEqualTo(countRoot.get("startedAt"), it))
        }
        if (countPredicates.isNotEmpty()) {
            countCq.where(*countPredicates.toTypedArray())
        }

        val countTotal = entityManager.createQuery(countCq).singleResult

        // Re-run main query with pagination
        val mainQuery = entityManager.createQuery(cq)
        mainQuery.firstResult = pageable.offset.toInt()
        mainQuery.maxResults = pageable.pageSize
        val results = mainQuery.resultList

        return PageImpl(results, pageable, countTotal)
    }
}
