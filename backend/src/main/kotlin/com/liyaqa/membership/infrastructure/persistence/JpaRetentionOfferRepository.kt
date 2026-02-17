package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.RetentionOffer
import com.liyaqa.membership.domain.model.RetentionOfferStatus
import com.liyaqa.membership.domain.model.RetentionOfferType
import com.liyaqa.membership.domain.ports.RetentionOfferRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataRetentionOfferRepository : JpaRepository<RetentionOffer, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<RetentionOffer>

    fun findBySubscriptionId(subscriptionId: UUID): List<RetentionOffer>

    @Query("SELECT o FROM RetentionOffer o WHERE o.subscriptionId = :subscriptionId AND o.status = 'PENDING'")
    fun findPendingBySubscriptionId(@Param("subscriptionId") subscriptionId: UUID): List<RetentionOffer>

    fun findByStatus(status: RetentionOfferStatus, pageable: Pageable): Page<RetentionOffer>

    fun findByOfferType(type: RetentionOfferType, pageable: Pageable): Page<RetentionOffer>

    @Query("SELECT o FROM RetentionOffer o WHERE o.status = 'PENDING' AND o.expiresAt < :asOfDate")
    fun findExpiredPendingOffers(@Param("asOfDate") asOfDate: Instant): List<RetentionOffer>

    @Query("SELECT COUNT(o) FROM RetentionOffer o WHERE o.offerType = :type AND o.status = 'ACCEPTED'")
    fun countAcceptedByOfferType(@Param("type") type: RetentionOfferType): Long

    @Query("""
        SELECT
            COUNT(o) as total,
            SUM(CASE WHEN o.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
            SUM(CASE WHEN o.status = 'DECLINED' THEN 1 ELSE 0 END) as declined,
            SUM(CASE WHEN o.status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
        FROM RetentionOffer o
    """)
    fun getOfferAcceptanceStatsRaw(): Array<Any>

    @Query("""
        SELECT o.offerType, COUNT(o)
        FROM RetentionOffer o
        WHERE o.status = com.liyaqa.membership.domain.model.RetentionOfferStatus.ACCEPTED
        GROUP BY o.offerType
        ORDER BY COUNT(o) DESC
    """)
    fun getAcceptedOfferTypeStats(): List<Array<Any>>
}

@Repository
class JpaRetentionOfferRepository(
    private val springDataRepository: SpringDataRetentionOfferRepository
) : RetentionOfferRepository {

    override fun save(offer: RetentionOffer): RetentionOffer =
        springDataRepository.save(offer)

    override fun saveAll(offers: List<RetentionOffer>): List<RetentionOffer> =
        springDataRepository.saveAll(offers)

    override fun findById(id: UUID): Optional<RetentionOffer> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<RetentionOffer> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findBySubscriptionId(subscriptionId: UUID): List<RetentionOffer> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findPendingBySubscriptionId(subscriptionId: UUID): List<RetentionOffer> =
        springDataRepository.findPendingBySubscriptionId(subscriptionId)

    override fun findByStatus(status: RetentionOfferStatus, pageable: Pageable): Page<RetentionOffer> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByOfferType(type: RetentionOfferType, pageable: Pageable): Page<RetentionOffer> =
        springDataRepository.findByOfferType(type, pageable)

    override fun findAll(pageable: Pageable): Page<RetentionOffer> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findExpiredPendingOffers(asOfDate: Instant): List<RetentionOffer> =
        springDataRepository.findExpiredPendingOffers(asOfDate)

    override fun countAcceptedByOfferType(type: RetentionOfferType): Long =
        springDataRepository.countAcceptedByOfferType(type)

    override fun getOfferAcceptanceStats(): Map<String, Any> {
        return try {
            val result = springDataRepository.getOfferAcceptanceStatsRaw()
            if (result.isEmpty()) {
                return mapOf("total" to 0L, "accepted" to 0L, "declined" to 0L, "expired" to 0L, "acceptanceRate" to 0.0)
            }
            val total = (result[0] as? Number)?.toLong() ?: 0L
            val accepted = (result[1] as? Number)?.toLong() ?: 0L
            val declined = (result[2] as? Number)?.toLong() ?: 0L
            val expired = (result[3] as? Number)?.toLong() ?: 0L
            val acceptanceRate = if (total > 0) accepted.toDouble() / total else 0.0

            mapOf(
                "total" to total,
                "accepted" to accepted,
                "declined" to declined,
                "expired" to expired,
                "acceptanceRate" to acceptanceRate
            )
        } catch (e: Exception) {
            mapOf("total" to 0L, "accepted" to 0L, "declined" to 0L, "expired" to 0L, "acceptanceRate" to 0.0)
        }
    }

    override fun getAcceptedOfferTypeStats(): List<Array<Any>> =
        springDataRepository.getAcceptedOfferTypeStats()
}
