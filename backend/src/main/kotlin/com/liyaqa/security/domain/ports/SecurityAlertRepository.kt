package com.liyaqa.security.domain.ports

import com.liyaqa.security.domain.model.AlertType
import com.liyaqa.security.domain.model.SecurityAlert
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.UUID

interface SecurityAlertRepository {
    fun save(alert: SecurityAlert): SecurityAlert
    fun saveAll(alerts: List<SecurityAlert>): List<SecurityAlert>
    fun findById(id: UUID): java.util.Optional<SecurityAlert>
    fun findByIdOrNull(id: UUID): SecurityAlert?
    fun findByUserId(userId: UUID, pageable: Pageable): Page<SecurityAlert>
    fun findUnresolvedByUserId(userId: UUID): List<SecurityAlert>
    fun findUnreadByUserId(userId: UUID): List<SecurityAlert>
    fun countUnreadByUserId(userId: UUID): Long
    fun findByUserIdAndAlertType(userId: UUID, alertType: AlertType): List<SecurityAlert>
    fun findRecentByUserId(userId: UUID, since: Instant): List<SecurityAlert>
    fun deleteResolvedBefore(before: Instant): Int
}
