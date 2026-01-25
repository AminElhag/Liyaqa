package com.liyaqa.marketing.domain.ports

import com.liyaqa.marketing.domain.model.Segment
import com.liyaqa.marketing.domain.model.SegmentMember
import com.liyaqa.marketing.domain.model.SegmentType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Port for segment persistence operations.
 */
interface SegmentRepository {
    fun save(segment: Segment): Segment
    fun findById(id: UUID): Optional<Segment>
    fun findAll(pageable: Pageable): Page<Segment>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean

    /**
     * Find active segments.
     */
    fun findActive(pageable: Pageable): Page<Segment>

    /**
     * Find segments by type.
     */
    fun findByType(segmentType: SegmentType, pageable: Pageable): Page<Segment>

    /**
     * Search segments by name.
     */
    fun search(search: String?, isActive: Boolean?, pageable: Pageable): Page<Segment>

    /**
     * Find all dynamic segments for recalculation.
     */
    fun findAllDynamic(): List<Segment>
}

/**
 * Port for segment member persistence operations.
 */
interface SegmentMemberRepository {
    fun save(segmentMember: SegmentMember): SegmentMember
    fun saveAll(segmentMembers: List<SegmentMember>): List<SegmentMember>
    fun findById(id: UUID): Optional<SegmentMember>
    fun deleteById(id: UUID)

    /**
     * Find all members in a segment.
     */
    fun findBySegmentId(segmentId: UUID, pageable: Pageable): Page<SegmentMember>

    /**
     * Find member IDs in a segment.
     */
    fun findMemberIdsBySegmentId(segmentId: UUID): List<UUID>

    /**
     * Check if member is in segment.
     */
    fun existsBySegmentIdAndMemberId(segmentId: UUID, memberId: UUID): Boolean

    /**
     * Delete member from segment.
     */
    fun deleteBySegmentIdAndMemberId(segmentId: UUID, memberId: UUID)

    /**
     * Delete all members from segment.
     */
    fun deleteBySegmentId(segmentId: UUID)

    /**
     * Count members in segment.
     */
    fun countBySegmentId(segmentId: UUID): Long
}
