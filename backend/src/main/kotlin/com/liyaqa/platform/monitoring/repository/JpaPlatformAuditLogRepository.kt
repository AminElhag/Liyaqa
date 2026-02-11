package com.liyaqa.platform.monitoring.repository

import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditLog
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import jakarta.persistence.EntityManager
import jakarta.persistence.criteria.Predicate
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

interface SpringDataPlatformAuditLogRepository : JpaRepository<PlatformAuditLog, UUID>

@Repository
class JpaPlatformAuditLogRepository(
    private val springDataRepository: SpringDataPlatformAuditLogRepository,
    private val entityManager: EntityManager
) : PlatformAuditLogRepository {

    override fun save(log: PlatformAuditLog): PlatformAuditLog =
        springDataRepository.save(log)

    override fun findById(id: UUID): PlatformAuditLog? =
        springDataRepository.findById(id).orElse(null)

    override fun findAll(pageable: Pageable): Page<PlatformAuditLog> =
        springDataRepository.findAll(pageable)

    override fun findByFilters(
        action: PlatformAuditAction?,
        actorId: UUID?,
        resourceType: PlatformAuditResourceType?,
        tenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?,
        pageable: Pageable
    ): Page<PlatformAuditLog> {
        val cb = entityManager.criteriaBuilder

        // Count query
        val countCq = cb.createQuery(Long::class.java)
        val countRoot = countCq.from(PlatformAuditLog::class.java)
        countCq.select(cb.count(countRoot))

        val countPredicates = buildPredicates(cb, countRoot, action, actorId, resourceType, tenantId, dateFrom, dateTo, search)
        if (countPredicates.isNotEmpty()) {
            countCq.where(*countPredicates.toTypedArray())
        }
        val total = entityManager.createQuery(countCq).singleResult

        // Main query
        val cq = cb.createQuery(PlatformAuditLog::class.java)
        val root = cq.from(PlatformAuditLog::class.java)

        val predicates = buildPredicates(cb, root, action, actorId, resourceType, tenantId, dateFrom, dateTo, search)
        if (predicates.isNotEmpty()) {
            cq.where(*predicates.toTypedArray())
        }
        cq.orderBy(cb.desc(root.get<Instant>("createdAt")))

        val query = entityManager.createQuery(cq)
        if (pageable.isPaged) {
            query.firstResult = pageable.offset.toInt()
            query.maxResults = pageable.pageSize
        }
        val results = query.resultList

        return PageImpl(results, pageable, total)
    }

    private fun buildPredicates(
        cb: jakarta.persistence.criteria.CriteriaBuilder,
        root: jakarta.persistence.criteria.Root<PlatformAuditLog>,
        action: PlatformAuditAction?,
        actorId: UUID?,
        resourceType: PlatformAuditResourceType?,
        tenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?
    ): List<Predicate> {
        val predicates = mutableListOf<Predicate>()

        action?.let {
            predicates.add(cb.equal(root.get<PlatformAuditAction>("action"), it))
        }
        actorId?.let {
            predicates.add(cb.equal(root.get<UUID>("actorId"), it))
        }
        resourceType?.let {
            predicates.add(cb.equal(root.get<PlatformAuditResourceType>("resourceType"), it))
        }
        tenantId?.let {
            predicates.add(cb.equal(root.get<UUID>("tenantId"), it))
        }
        dateFrom?.let {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), it))
        }
        dateTo?.let {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), it))
        }
        search?.takeIf { it.isNotBlank() }?.let {
            predicates.add(cb.like(cb.lower(root.get("actorName")), "%${it.lowercase()}%"))
        }

        return predicates
    }
}
