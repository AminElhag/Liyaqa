package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.RetentionOffer
import com.liyaqa.membership.domain.model.RetentionOfferStatus
import com.liyaqa.membership.domain.model.RetentionOfferType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for RetentionOffer entity.
 * Retention offers are tenant-scoped (belong to a club).
 */
interface RetentionOfferRepository {
    fun save(offer: RetentionOffer): RetentionOffer
    fun saveAll(offers: List<RetentionOffer>): List<RetentionOffer>
    fun findById(id: UUID): Optional<RetentionOffer>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<RetentionOffer>
    fun findBySubscriptionId(subscriptionId: UUID): List<RetentionOffer>
    fun findPendingBySubscriptionId(subscriptionId: UUID): List<RetentionOffer>
    fun findByStatus(status: RetentionOfferStatus, pageable: Pageable): Page<RetentionOffer>
    fun findByOfferType(type: RetentionOfferType, pageable: Pageable): Page<RetentionOffer>
    fun findAll(pageable: Pageable): Page<RetentionOffer>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find expired pending offers that need to be marked as expired.
     */
    fun findExpiredPendingOffers(asOfDate: Instant): List<RetentionOffer>

    /**
     * Count accepted offers by type.
     */
    fun countAcceptedByOfferType(type: RetentionOfferType): Long

    /**
     * Get offer acceptance rate statistics.
     */
    fun getOfferAcceptanceStats(): Map<String, Any>
}
