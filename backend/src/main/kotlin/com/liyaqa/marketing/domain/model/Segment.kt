package com.liyaqa.marketing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.util.UUID

/**
 * Criteria for dynamic segment membership.
 */
data class SegmentCriteria(
    val memberStatuses: List<String>? = null,           // ACTIVE, INACTIVE, SUSPENDED
    val subscriptionStatuses: List<String>? = null,     // ACTIVE, EXPIRED, CANCELLED
    val planIds: List<UUID>? = null,                    // Specific membership plans
    val inactiveDays: Int? = null,                      // Members inactive for X days
    val joinedAfterDays: Int? = null,                   // Joined within last X days
    val expiringWithinDays: Int? = null,                // Subscription expiring within X days
    val expiredWithinDays: Int? = null,                 // Subscription expired within X days
    val hasActiveSubscription: Boolean? = null,         // Has active subscription
    val gender: String? = null,                         // MALE, FEMALE
    val minAge: Int? = null,                            // Minimum age
    val maxAge: Int? = null,                            // Maximum age
    val tags: List<String>? = null,                     // Member tags
    val excludeMemberIds: List<UUID>? = null            // Members to exclude
)

/**
 * Marketing segment for grouping members.
 * Can be dynamic (criteria-based) or static (manually managed).
 */
@Entity
@Table(name = "marketing_segments")
class Segment(
    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "description", columnDefinition = "text")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "segment_type", nullable = false)
    var segmentType: SegmentType = SegmentType.DYNAMIC,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "criteria")
    var criteria: SegmentCriteria? = null,

    @Column(name = "member_count", nullable = false)
    var memberCount: Int = 0,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Update segment details.
     */
    fun update(
        name: String? = null,
        description: String? = null,
        criteria: SegmentCriteria? = null
    ) {
        name?.let { this.name = it }
        description?.let { this.description = it }
        criteria?.let { this.criteria = it }
    }

    /**
     * Update the member count.
     */
    fun updateMemberCount(count: Int) {
        this.memberCount = count
    }

    /**
     * Activate the segment.
     */
    fun activate() {
        this.isActive = true
    }

    /**
     * Deactivate the segment.
     */
    fun deactivate() {
        this.isActive = false
    }

    /**
     * Check if this is a dynamic segment.
     */
    fun isDynamic(): Boolean = segmentType == SegmentType.DYNAMIC

    /**
     * Check if this is a static segment.
     */
    fun isStatic(): Boolean = segmentType == SegmentType.STATIC

    companion object {
        fun createDynamic(
            name: String,
            description: String? = null,
            criteria: SegmentCriteria
        ): Segment {
            return Segment(
                name = name,
                description = description,
                segmentType = SegmentType.DYNAMIC,
                criteria = criteria
            )
        }

        fun createStatic(
            name: String,
            description: String? = null
        ): Segment {
            return Segment(
                name = name,
                description = description,
                segmentType = SegmentType.STATIC,
                criteria = null
            )
        }
    }
}
