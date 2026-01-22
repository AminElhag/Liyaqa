package com.liyaqa.shop.domain.ports

import com.liyaqa.shop.domain.model.Order
import com.liyaqa.shop.domain.model.OrderStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Order entities.
 */
interface OrderRepository {
    fun save(order: Order): Order
    fun findById(id: UUID): Optional<Order>
    fun findByMemberIdAndStatus(memberId: UUID, status: OrderStatus): Optional<Order>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Order>
    fun findByMemberIdExcludingStatus(memberId: UUID, excludeStatus: OrderStatus, pageable: Pageable): Page<Order>
    fun findByInvoiceId(invoiceId: UUID): Optional<Order>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}
