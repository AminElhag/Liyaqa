package com.liyaqa.shared.domain

import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Version
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.UUID

/**
 * Base entity class for all domain entities.
 * Provides common fields: id, tenantId, timestamps, and version for optimistic locking.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class BaseEntity(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    open val id: UUID = UUID.randomUUID()
) {
    @Column(name = "tenant_id", nullable = false, updatable = false)
    open var tenantId: UUID = UUID.randomUUID()
        protected set

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    open var createdAt: Instant = Instant.now()
        protected set

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    open var updatedAt: Instant = Instant.now()
        protected set

    @Version
    @Column(name = "version")
    open var version: Long = 0
        protected set

    @PrePersist
    fun prePersist() {
        val tenant = TenantContext.getCurrentTenantOrNull()
        if (tenant != null) {
            this.tenantId = tenant.value
        }
        this.createdAt = Instant.now()
        this.updatedAt = Instant.now()
    }

    @PreUpdate
    fun preUpdate() {
        this.updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is BaseEntity) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
