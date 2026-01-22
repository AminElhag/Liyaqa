package com.liyaqa.shop.infrastructure.persistence

import com.liyaqa.shop.domain.model.Order
import com.liyaqa.shop.domain.model.OrderStatus
import com.liyaqa.shop.domain.ports.OrderRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for Order.
 */
interface SpringDataOrderRepository : JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o WHERE o.memberId = :memberId AND o.status = :status")
    fun findByMemberIdAndStatus(
        @Param("memberId") memberId: UUID,
        @Param("status") status: OrderStatus
    ): Optional<Order>

    @Query("SELECT o FROM Order o WHERE o.memberId = :memberId ORDER BY o.createdAt DESC")
    fun findByMemberId(@Param("memberId") memberId: UUID, pageable: Pageable): Page<Order>

    @Query("SELECT o FROM Order o WHERE o.memberId = :memberId AND o.status != :excludeStatus ORDER BY o.createdAt DESC")
    fun findByMemberIdExcludingStatus(
        @Param("memberId") memberId: UUID,
        @Param("excludeStatus") excludeStatus: OrderStatus,
        pageable: Pageable
    ): Page<Order>

    @Query("SELECT o FROM Order o WHERE o.invoiceId = :invoiceId")
    fun findByInvoiceId(@Param("invoiceId") invoiceId: UUID): Optional<Order>
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaOrderRepository(
    private val springDataRepository: SpringDataOrderRepository
) : OrderRepository {

    override fun save(order: Order): Order {
        return springDataRepository.save(order)
    }

    override fun findById(id: UUID): Optional<Order> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberIdAndStatus(memberId: UUID, status: OrderStatus): Optional<Order> {
        return springDataRepository.findByMemberIdAndStatus(memberId, status)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Order> {
        return springDataRepository.findByMemberId(memberId, pageable)
    }

    override fun findByMemberIdExcludingStatus(
        memberId: UUID,
        excludeStatus: OrderStatus,
        pageable: Pageable
    ): Page<Order> {
        return springDataRepository.findByMemberIdExcludingStatus(memberId, excludeStatus, pageable)
    }

    override fun findByInvoiceId(invoiceId: UUID): Optional<Order> {
        return springDataRepository.findByInvoiceId(invoiceId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }
}
