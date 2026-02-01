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

@Repository
interface JpaSecurityAlertRepository : JpaRepository<SecurityAlert, UUID>, SecurityAlertRepository {

    override fun findByIdOrNull(id: UUID): SecurityAlert? {
        return findById(id).orElse(null)
    }

    override fun findByUserId(userId: UUID, pageable: Pageable): Page<SecurityAlert>

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.resolved = false ORDER BY a.createdAt DESC")
    override fun findUnresolvedByUserId(@Param("userId") userId: UUID): List<SecurityAlert>

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.acknowledgedAt IS NULL AND a.resolved = false ORDER BY a.createdAt DESC")
    override fun findUnreadByUserId(@Param("userId") userId: UUID): List<SecurityAlert>

    @Query("SELECT COUNT(a) FROM SecurityAlert a WHERE a.userId = :userId AND a.acknowledgedAt IS NULL AND a.resolved = false")
    override fun countUnreadByUserId(@Param("userId") userId: UUID): Long

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.alertType = :alertType ORDER BY a.createdAt DESC")
    override fun findByUserIdAndAlertType(
        @Param("userId") userId: UUID,
        @Param("alertType") alertType: AlertType
    ): List<SecurityAlert>

    @Query("SELECT a FROM SecurityAlert a WHERE a.userId = :userId AND a.createdAt >= :since ORDER BY a.createdAt DESC")
    override fun findRecentByUserId(
        @Param("userId") userId: UUID,
        @Param("since") since: Instant
    ): List<SecurityAlert>

    @Modifying
    @Transactional
    @Query("DELETE FROM SecurityAlert a WHERE a.resolved = true AND a.createdAt < :before")
    override fun deleteResolvedBefore(@Param("before") before: Instant): Int
}
