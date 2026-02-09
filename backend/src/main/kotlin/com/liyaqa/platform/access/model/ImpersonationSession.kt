package com.liyaqa.platform.access.model

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "impersonation_sessions")
class ImpersonationSession(
    @Column(name = "platform_user_id", nullable = false)
    val platformUserId: UUID,

    @Column(name = "target_tenant_id", nullable = false)
    val targetTenantId: UUID,

    @Column(name = "target_user_id", nullable = false)
    val targetUserId: UUID,

    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    val purpose: String,

    @Column(name = "started_at", nullable = false)
    val startedAt: Instant = Instant.now(),

    @Column(name = "ended_at")
    var endedAt: Instant? = null,

    @Column(name = "actions_performed", columnDefinition = "TEXT")
    var actionsPerformed: String? = null,

    @Column(name = "ip_address", length = 45)
    val ipAddress: String? = null,

    @Column(name = "user_agent", length = 500)
    val userAgent: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    id: UUID = UUID.randomUUID()
) : OrganizationLevelEntity(id) {

    fun endSession() {
        this.endedAt = Instant.now()
        this.isActive = false
    }

    fun addAction(action: String) {
        val actions = getActionsList().toMutableList()
        actions.add(action)
        this.actionsPerformed = mapper.writeValueAsString(actions)
    }

    fun getActionsList(): List<String> {
        val raw = actionsPerformed ?: return emptyList()
        return try {
            mapper.readValue(raw)
        } catch (_: Exception) {
            emptyList()
        }
    }

    companion object {
        private val mapper = jacksonObjectMapper()

        fun create(
            platformUserId: UUID,
            targetTenantId: UUID,
            targetUserId: UUID,
            purpose: String,
            ipAddress: String? = null,
            userAgent: String? = null
        ): ImpersonationSession {
            return ImpersonationSession(
                platformUserId = platformUserId,
                targetTenantId = targetTenantId,
                targetUserId = targetUserId,
                purpose = purpose,
                startedAt = Instant.now(),
                ipAddress = ipAddress,
                userAgent = userAgent
            )
        }
    }
}
