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

/**
 * Base entity for organization-level entities (no tenant_id).
 * Used for entities that exist at the organization level, like Organization itself.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class OrganizationLevelEntity(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    open val id: UUID = UUID.randomUUID()
) {
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
    fun orgLevelPrePersist() {
        this.createdAt = Instant.now()
        this.updatedAt = Instant.now()
    }

    @PreUpdate
    fun orgLevelPreUpdate() {
        this.updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OrganizationLevelEntity) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}

/**
 * Base entity that includes both tenant_id and organization_id.
 * Used for entities that need to support both club-level filtering
 * and organization-level (super-tenant) queries.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class OrganizationAwareEntity(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    open val id: UUID = UUID.randomUUID()
) {
    @Column(name = "tenant_id", nullable = false, updatable = false)
    open var tenantId: UUID = UUID.randomUUID()
        protected set

    @Column(name = "organization_id", nullable = false, updatable = false)
    open var organizationId: UUID = UUID.randomUUID()
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
    fun orgAwarePrePersist() {
        val tenant = TenantContext.getCurrentTenantOrNull()
        if (tenant != null) {
            this.tenantId = tenant.value
        }
        val org = TenantContext.getCurrentOrganizationOrNull()
        if (org != null) {
            this.organizationId = org.value
        }
        this.createdAt = Instant.now()
        this.updatedAt = Instant.now()
    }

    @PreUpdate
    fun orgAwarePreUpdate() {
        this.updatedAt = Instant.now()
    }

    /**
     * Manually set tenant and organization IDs.
     * Use this when creating entities outside of a request context.
     */
    fun setTenantAndOrganization(tenantId: UUID, organizationId: UUID) {
        this.tenantId = tenantId
        this.organizationId = organizationId
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OrganizationAwareEntity) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
