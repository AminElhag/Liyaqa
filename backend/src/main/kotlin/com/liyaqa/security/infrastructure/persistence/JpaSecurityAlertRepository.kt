package com.liyaqa.security.infrastructure.persistence

import com.liyaqa.security.domain.model.AlertType
import com.liyaqa.security.domain.model.SecurityAlert
import com.liyaqa.security.domain.ports.SecurityAlertRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Internal JPA repository - do not inject directly
 */
interface SecurityAlertJpaRepository : JpaRepository<SecurityAlert, UUID> {
    fun findByUserId(userId: UUID, pageable: Pageable): Page<SecurityAlert>

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.resolved = false ORDER BY a.createdAt DESC")
    fun findUnresolvedByUserId(@Param("userId") userId: UUID): List<SecurityAlert>

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.acknowledgedAt IS NULL AND a.resolved = false ORDER BY a.createdAt DESC")
    fun findUnreadByUserId(@Param("userId") userId: UUID): List<SecurityAlert>

    @Query("SELECT COUNT(a) FROM SecurityAlert a WHERE a.userId = :userId AND a.acknowledgedAt IS NULL AND a.resolved = false")
    fun countUnreadByUserId(@Param("userId") userId: UUID): Long

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.alertType = :alertType ORDER BY a.createdAt DESC")
    fun findByUserIdAndAlertType(
        @Param("userId") userId: UUID,
        @Param("alertType") alertType: AlertType
    ): List<SecurityAlert>

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.createdAt >= :since ORDER BY a.createdAt DESC")
    fun findRecentByUserId(
        @Param("userId") userId: UUID,
        @Param("since") since: Instant
    ): List<SecurityAlert>

    @Modifying
    @Transactional
    @Query("DELETE FROM SecurityAlert a WHERE a.resolved = true AND a.createdAt < :before")
    fun deleteResolvedBefore(@Param("before") before: Instant): Int
}

/**
 * Implementation of SecurityAlertRepository that wraps the JPA repository
 */
@Repository
class JpaSecurityAlertRepositoryImpl(
    private val jpaRepository: SecurityAlertJpaRepository
) : SecurityAlertRepository {

    override fun save(alert: SecurityAlert): SecurityAlert =
        jpaRepository.save(alert)

    override fun saveAll(alerts: List<SecurityAlert>): List<SecurityAlert> =
        jpaRepository.saveAll(alerts)

    override fun findById(id: UUID): java.util.Optional<SecurityAlert> =
        jpaRepository.findById(id)

    override fun findByIdOrNull(id: UUID): SecurityAlert? =
        jpaRepository.findById(id).orElse(null)

    override fun findByUserId(userId: UUID, pageable: Pageable): Page<SecurityAlert> =
        jpaRepository.findByUserId(userId, pageable)

    override fun findUnresolvedByUserId(userId: UUID): List<SecurityAlert> =
        jpaRepository.findUnresolvedByUserId(userId)

    override fun findUnreadByUserId(userId: UUID): List<SecurityAlert> =
        jpaRepository.findUnreadByUserId(userId)

    override fun countUnreadByUserId(userId: UUID): Long =
        jpaRepository.countUnreadByUserId(userId)

    override fun findByUserIdAndAlertType(userId: UUID, alertType: AlertType): List<SecurityAlert> =
        jpaRepository.findByUserIdAndAlertType(userId, alertType)

    override fun findRecentByUserId(userId: UUID, since: Instant): List<SecurityAlert> =
        jpaRepository.findRecentByUserId(userId, since)

    override fun deleteResolvedBefore(before: Instant): Int =
        jpaRepository.deleteResolvedBefore(before)
}
