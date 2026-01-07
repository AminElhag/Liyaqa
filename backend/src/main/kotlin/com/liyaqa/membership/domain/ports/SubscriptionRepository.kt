package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Subscription entity.
 * Subscriptions are tenant-scoped (belong to a club).
 */
interface SubscriptionRepository {
    fun save(subscription: Subscription): Subscription
    fun findById(id: UUID): Optional<Subscription>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Subscription>
    fun findActiveByMemberId(memberId: UUID): Optional<Subscription>
    fun findByPlanId(planId: UUID, pageable: Pageable): Page<Subscription>
    fun findByStatus(status: SubscriptionStatus, pageable: Pageable): Page<Subscription>
    fun findAll(pageable: Pageable): Page<Subscription>
    fun findExpiringBefore(date: LocalDate, pageable: Pageable): Page<Subscription>
    fun existsById(id: UUID): Boolean
    fun existsActiveByMemberId(memberId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByMemberId(memberId: UUID): Long
}