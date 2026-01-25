package com.liyaqa.marketing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Static segment membership - manually added members to a segment.
 */
@Entity
@Table(name = "marketing_segment_members")
class SegmentMember(
    @Column(name = "segment_id", nullable = false)
    val segmentId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "added_at", nullable = false)
    val addedAt: Instant = Instant.now(),

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    companion object {
        fun create(segmentId: UUID, memberId: UUID): SegmentMember {
            return SegmentMember(
                segmentId = segmentId,
                memberId = memberId
            )
        }
    }
}
