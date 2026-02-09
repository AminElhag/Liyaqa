package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataTicketV2Repository : JpaRepository<Ticket, UUID> {
    fun findByStatus(status: TicketStatus): List<Ticket>
    fun findByStatusAndResolvedAtBefore(status: TicketStatus, before: Instant): List<Ticket>
    fun countByStatus(status: TicketStatus): Long
    fun countByAssignedToId(assignedToId: UUID): Long
    fun findByAssignedToId(assignedToId: UUID): List<Ticket>
}

@Repository
class JpaTicketRepository(
    private val springDataRepository: SpringDataTicketV2Repository
) : TicketRepository {

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    override fun save(ticket: Ticket): Ticket =
        springDataRepository.save(ticket)

    override fun findById(id: UUID): Optional<Ticket> =
        springDataRepository.findById(id)

    override fun findByFilters(
        status: TicketStatus?,
        priority: TicketPriority?,
        category: TicketCategory?,
        assignedToId: UUID?,
        tenantId: UUID?,
        slaBreached: Boolean?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?,
        pageable: Pageable
    ): Page<Ticket> {
        val cb = entityManager.criteriaBuilder
        val cq = cb.createQuery(Ticket::class.java)
        val root = cq.from(Ticket::class.java)

        val predicates = mutableListOf<jakarta.persistence.criteria.Predicate>()

        status?.let {
            predicates.add(cb.equal(root.get<TicketStatus>("status"), it))
        }
        priority?.let {
            predicates.add(cb.equal(root.get<TicketPriority>("priority"), it))
        }
        category?.let {
            predicates.add(cb.equal(root.get<TicketCategory>("category"), it))
        }
        assignedToId?.let {
            predicates.add(cb.equal(root.get<UUID>("assignedToId"), it))
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
        search?.let {
            val searchPattern = "%${it.lowercase()}%"
            val subjectPredicate = cb.like(cb.lower(root.get("subject")), searchPattern)
            val ticketNumberPredicate = cb.like(cb.lower(root.get("ticketNumber")), searchPattern)
            predicates.add(cb.or(subjectPredicate, ticketNumberPredicate))
        }
        slaBreached?.let { breached ->
            if (breached) {
                val now = Instant.now()
                val notClosed = cb.notEqual(root.get<TicketStatus>("status"), TicketStatus.CLOSED)
                val notResolved = cb.notEqual(root.get<TicketStatus>("status"), TicketStatus.RESOLVED)
                val deadlinePassed = cb.lessThan(root.get<Instant>("slaDeadline"), now)
                predicates.add(cb.and(notClosed, notResolved, deadlinePassed))
            }
        }

        if (predicates.isNotEmpty()) {
            cq.where(*predicates.toTypedArray())
        }

        val orders = pageable.sort.map { order ->
            if (order.isAscending) cb.asc(root.get<Any>(order.property))
            else cb.desc(root.get<Any>(order.property))
        }.toList()
        if (orders.isNotEmpty()) {
            cq.orderBy(orders)
        }

        val query = entityManager.createQuery(cq)
        query.firstResult = pageable.offset.toInt()
        query.maxResults = pageable.pageSize
        val results = query.resultList

        // Count query
        val countCq = cb.createQuery(Long::class.java)
        val countRoot = countCq.from(Ticket::class.java)
        countCq.select(cb.count(countRoot))

        val countPredicates = mutableListOf<jakarta.persistence.criteria.Predicate>()
        status?.let { countPredicates.add(cb.equal(countRoot.get<TicketStatus>("status"), it)) }
        priority?.let { countPredicates.add(cb.equal(countRoot.get<TicketPriority>("priority"), it)) }
        category?.let { countPredicates.add(cb.equal(countRoot.get<TicketCategory>("category"), it)) }
        assignedToId?.let { countPredicates.add(cb.equal(countRoot.get<UUID>("assignedToId"), it)) }
        tenantId?.let { countPredicates.add(cb.equal(countRoot.get<UUID>("tenantId"), it)) }
        dateFrom?.let { countPredicates.add(cb.greaterThanOrEqualTo(countRoot.get("createdAt"), it)) }
        dateTo?.let { countPredicates.add(cb.lessThanOrEqualTo(countRoot.get("createdAt"), it)) }
        search?.let {
            val searchPattern = "%${it.lowercase()}%"
            countPredicates.add(cb.or(
                cb.like(cb.lower(countRoot.get("subject")), searchPattern),
                cb.like(cb.lower(countRoot.get("ticketNumber")), searchPattern)
            ))
        }
        slaBreached?.let { breached ->
            if (breached) {
                val now = Instant.now()
                countPredicates.add(cb.and(
                    cb.notEqual(countRoot.get<TicketStatus>("status"), TicketStatus.CLOSED),
                    cb.notEqual(countRoot.get<TicketStatus>("status"), TicketStatus.RESOLVED),
                    cb.lessThan(countRoot.get<Instant>("slaDeadline"), now)
                ))
            }
        }
        if (countPredicates.isNotEmpty()) {
            countCq.where(*countPredicates.toTypedArray())
        }

        val total = entityManager.createQuery(countCq).singleResult
        return PageImpl(results, pageable, total)
    }

    override fun findByStatus(status: TicketStatus): List<Ticket> =
        springDataRepository.findByStatus(status)

    override fun findByStatusAndResolvedAtBefore(status: TicketStatus, before: Instant): List<Ticket> =
        springDataRepository.findByStatusAndResolvedAtBefore(status, before)

    override fun countByStatus(status: TicketStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByAssignedToId(assignedToId: UUID): Long =
        springDataRepository.countByAssignedToId(assignedToId)

    override fun findByAssignedToId(assignedToId: UUID): List<Ticket> =
        springDataRepository.findByAssignedToId(assignedToId)

    override fun count(): Long =
        springDataRepository.count()

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)
}
