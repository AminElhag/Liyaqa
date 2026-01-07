package com.liyaqa.organization.domain.model

import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EntityListeners
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import jakarta.persistence.Version
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.UUID

/**
 * Club entity - serves as the tenant for all data isolation.
 * Club.id IS the tenant_id for all entities under this club.
 *
 * A club belongs to an organization and can have multiple locations.
 */
@Entity
@Table(name = "clubs")
@EntityListeners(AuditingEntityListener::class)
@FilterDef(
    name = "organizationFilter",
    parameters = [ParamDef(name = "organizationId", type = UUID::class)]
)
@Filter(name = "organizationFilter", condition = "organization_id = :organizationId")
class Club(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false, updatable = false)
    val organizationId: UUID,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ClubStatus = ClubStatus.ACTIVE

) {
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now()
        protected set

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
        protected set

    @Version
    @Column(name = "version")
    var version: Long = 0
        protected set

    /**
     * The tenant ID for this club - used for data isolation.
     * This is the same as the club ID.
     */
    val tenantId: UUID
        get() = id

    @PrePersist
    fun clubPrePersist() {
        this.createdAt = Instant.now()
        this.updatedAt = Instant.now()
    }

    @PreUpdate
    fun clubPreUpdate() {
        this.updatedAt = Instant.now()
    }

    /**
     * Suspend the club.
     * Only active clubs can be suspended.
     */
    fun suspend() {
        require(status == ClubStatus.ACTIVE) {
            "Only active clubs can be suspended"
        }
        status = ClubStatus.SUSPENDED
    }

    /**
     * Activate the club.
     * Only suspended clubs can be activated.
     */
    fun activate() {
        require(status == ClubStatus.SUSPENDED) {
            "Only suspended clubs can be activated"
        }
        status = ClubStatus.ACTIVE
    }

    /**
     * Permanently close the club.
     */
    fun close() {
        require(status != ClubStatus.CLOSED) {
            "Club is already closed"
        }
        status = ClubStatus.CLOSED
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Club) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}