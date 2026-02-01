package com.liyaqa.security.domain.ports

import com.liyaqa.security.domain.model.AlertType
import com.liyaqa.security.domain.model.SecurityAlert
import com.liyaqa.security.domain.model.Severity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.UUID

/**
 * Repository interface for security alerts.
 */
interface SecurityAlertRepository {
    /**
     * Saves a security alert.
     */
    fun save(alert: SecurityAlert): SecurityAlert

    /**
     * Finds an alert by ID.
     */
    fun findByIdOrNull(id: UUID): SecurityAlert?

    /**
     * Finds all alerts for a user.
     */
    fun findByUserId(userId: UUID, pageable: Pageable): Page<SecurityAlert>

    /**
     * Finds unresolved alerts for a user.
     */
    fun findUnresolvedByUserId(userId: UUID): List<SecurityAlert>

    /**
     * Finds unread alerts for a user.
     */
    fun findUnreadByUserId(userId: UUID): List<SecurityAlert>

    /**
     * Counts unread alerts for a user.
     */
    fun countUnreadByUserId(userId: UUID): Long

    /**
     * Finds alerts by type and user.
     */
    fun findByUserIdAndAlertType(userId: UUID, alertType: AlertType): List<SecurityAlert>

    /**
     * Finds recent alerts for a user (within last N days).
     */
    fun findRecentByUserId(userId: UUID, since: Instant): List<SecurityAlert>

    /**
     * Deletes old resolved alerts.
     */
    fun deleteResolvedBefore(before: Instant): Int
}
