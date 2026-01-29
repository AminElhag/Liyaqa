package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Record of user acknowledgement of a security policy.
 */
@Entity
@Table(name = "policy_acknowledgements")
class PolicyAcknowledgement(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    val policy: SecurityPolicy,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "acknowledged_at", nullable = false)
    val acknowledgedAt: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(name = "acknowledgement_method", nullable = false)
    val acknowledgementMethod: AcknowledgementMethod,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null,

    @Column(name = "policy_version", nullable = false)
    val policyVersion: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PolicyAcknowledgement) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
