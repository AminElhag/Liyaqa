package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import java.util.UUID

/**
 * Per-category credit tracking for a member's class pack balance.
 * Tracks allocated and remaining credits for each category independently.
 */
@Entity
@Table(name = "member_category_balances")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberCategoryBalance(
    id: UUID = UUID.randomUUID(),

    @Column(name = "balance_id", nullable = false)
    val balanceId: UUID,

    @Column(name = "category_id", nullable = false)
    val categoryId: UUID,

    @Column(name = "credits_allocated", nullable = false)
    val creditsAllocated: Int,

    @Column(name = "credits_remaining", nullable = false)
    var creditsRemaining: Int

) : BaseEntity(id) {

    /**
     * Uses one credit from this category balance.
     */
    fun useCredit() {
        require(creditsRemaining > 0) { "No credits remaining for this category" }
        creditsRemaining--
    }

    /**
     * Refunds one credit back to this category balance.
     */
    fun refundCredit() {
        require(creditsRemaining < creditsAllocated) { "Cannot refund: no credits used in this category" }
        creditsRemaining++
    }

    fun hasCredits(): Boolean = creditsRemaining > 0
}
