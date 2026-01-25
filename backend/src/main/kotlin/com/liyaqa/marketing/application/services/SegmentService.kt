package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.application.commands.AddSegmentMembersCommand
import com.liyaqa.marketing.application.commands.CreateSegmentCommand
import com.liyaqa.marketing.application.commands.RemoveSegmentMemberCommand
import com.liyaqa.marketing.application.commands.UpdateSegmentCommand
import com.liyaqa.marketing.domain.model.Segment
import com.liyaqa.marketing.domain.model.SegmentCriteria
import com.liyaqa.marketing.domain.model.SegmentMember
import com.liyaqa.marketing.domain.model.SegmentType
import com.liyaqa.marketing.domain.ports.SegmentMemberRepository
import com.liyaqa.marketing.domain.ports.SegmentRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class SegmentService(
    private val segmentRepository: SegmentRepository,
    private val segmentMemberRepository: SegmentMemberRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository
) {
    private val logger = LoggerFactory.getLogger(SegmentService::class.java)

    // ==================== SEGMENT CRUD ====================

    /**
     * Create a new segment.
     */
    fun createSegment(command: CreateSegmentCommand): Segment {
        val segment = when (command.segmentType) {
            SegmentType.DYNAMIC -> {
                requireNotNull(command.criteria) { "Dynamic segments require criteria" }
                Segment.createDynamic(
                    name = command.name,
                    description = command.description,
                    criteria = command.criteria
                )
            }
            SegmentType.STATIC -> Segment.createStatic(
                name = command.name,
                description = command.description
            )
        }

        val saved = segmentRepository.save(segment)

        // Calculate initial member count for dynamic segments
        if (saved.isDynamic()) {
            recalculateSegmentCount(saved.id)
        }

        logger.info("Created segment: ${saved.id} - ${saved.name}")
        return saved
    }

    /**
     * Get segment by ID.
     */
    @Transactional(readOnly = true)
    fun getSegment(id: UUID): Segment {
        return segmentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Segment not found: $id") }
    }

    /**
     * List segments with pagination.
     */
    @Transactional(readOnly = true)
    fun listSegments(pageable: Pageable): Page<Segment> {
        return segmentRepository.findAll(pageable)
    }

    /**
     * Search segments.
     */
    @Transactional(readOnly = true)
    fun searchSegments(search: String?, isActive: Boolean?, pageable: Pageable): Page<Segment> {
        return segmentRepository.search(search, isActive, pageable)
    }

    /**
     * Update a segment.
     */
    fun updateSegment(id: UUID, command: UpdateSegmentCommand): Segment {
        val segment = getSegment(id)
        segment.update(
            name = command.name,
            description = command.description,
            criteria = command.criteria
        )

        val saved = segmentRepository.save(segment)

        // Recalculate count if criteria changed
        if (saved.isDynamic() && command.criteria != null) {
            recalculateSegmentCount(saved.id)
        }

        logger.info("Updated segment: ${saved.id}")
        return saved
    }

    /**
     * Delete a segment.
     */
    fun deleteSegment(id: UUID) {
        val segment = getSegment(id)
        segmentMemberRepository.deleteBySegmentId(id)
        segmentRepository.deleteById(id)
        logger.info("Deleted segment: $id")
    }

    /**
     * Activate a segment.
     */
    fun activateSegment(id: UUID): Segment {
        val segment = getSegment(id)
        segment.activate()
        return segmentRepository.save(segment)
    }

    /**
     * Deactivate a segment.
     */
    fun deactivateSegment(id: UUID): Segment {
        val segment = getSegment(id)
        segment.deactivate()
        return segmentRepository.save(segment)
    }

    // ==================== STATIC SEGMENT MEMBERS ====================

    /**
     * Add members to a static segment.
     */
    fun addMembers(command: AddSegmentMembersCommand): Int {
        val segment = getSegment(command.segmentId)
        require(segment.isStatic()) { "Can only add members to static segments" }

        var addedCount = 0
        for (memberId in command.memberIds) {
            if (!segmentMemberRepository.existsBySegmentIdAndMemberId(command.segmentId, memberId)) {
                val segmentMember = SegmentMember.create(command.segmentId, memberId)
                segmentMemberRepository.save(segmentMember)
                addedCount++
            }
        }

        // Update member count
        val count = segmentMemberRepository.countBySegmentId(command.segmentId).toInt()
        segment.updateMemberCount(count)
        segmentRepository.save(segment)

        logger.info("Added $addedCount members to segment ${command.segmentId}")
        return addedCount
    }

    /**
     * Remove a member from a static segment.
     */
    fun removeMember(command: RemoveSegmentMemberCommand) {
        val segment = getSegment(command.segmentId)
        require(segment.isStatic()) { "Can only remove members from static segments" }

        segmentMemberRepository.deleteBySegmentIdAndMemberId(command.segmentId, command.memberId)

        // Update member count
        val count = segmentMemberRepository.countBySegmentId(command.segmentId).toInt()
        segment.updateMemberCount(count)
        segmentRepository.save(segment)

        logger.info("Removed member ${command.memberId} from segment ${command.segmentId}")
    }

    /**
     * Get members in a segment (static or preview for dynamic).
     */
    @Transactional(readOnly = true)
    fun getSegmentMembers(segmentId: UUID, pageable: Pageable): Page<SegmentMember> {
        val segment = getSegment(segmentId)
        require(segment.isStatic()) { "Use previewMembers for dynamic segments" }
        return segmentMemberRepository.findBySegmentId(segmentId, pageable)
    }

    /**
     * Get member IDs in a segment.
     */
    @Transactional(readOnly = true)
    fun getSegmentMemberIds(segmentId: UUID): List<UUID> {
        val segment = getSegment(segmentId)
        return if (segment.isStatic()) {
            segmentMemberRepository.findMemberIdsBySegmentId(segmentId)
        } else {
            getMembersMatchingCriteria(segment.criteria!!, PageRequest.of(0, 10000))
                .map { it.id }
                .toList()
        }
    }

    // ==================== DYNAMIC SEGMENT EVALUATION ====================

    /**
     * Preview members that match a segment's criteria.
     */
    @Transactional(readOnly = true)
    fun previewMembers(segmentId: UUID, pageable: Pageable): Page<Member> {
        val segment = getSegment(segmentId)
        require(segment.isDynamic()) { "Preview is only for dynamic segments" }
        requireNotNull(segment.criteria) { "Dynamic segment must have criteria" }

        return getMembersMatchingCriteria(segment.criteria!!, pageable)
    }

    /**
     * Recalculate and update segment member count.
     */
    fun recalculateSegmentCount(segmentId: UUID): Int {
        val segment = getSegment(segmentId)

        val count = if (segment.isStatic()) {
            segmentMemberRepository.countBySegmentId(segmentId).toInt()
        } else {
            requireNotNull(segment.criteria) { "Dynamic segment must have criteria" }
            countMembersMatchingCriteria(segment.criteria!!)
        }

        segment.updateMemberCount(count)
        segmentRepository.save(segment)

        logger.debug("Recalculated segment $segmentId count: $count")
        return count
    }

    /**
     * Recalculate all dynamic segment counts.
     */
    fun recalculateAllDynamicSegments(): Int {
        val dynamicSegments = segmentRepository.findAllDynamic()
        var updated = 0

        for (segment in dynamicSegments) {
            try {
                recalculateSegmentCount(segment.id)
                updated++
            } catch (e: Exception) {
                logger.error("Error recalculating segment ${segment.id}: ${e.message}")
            }
        }

        logger.info("Recalculated $updated dynamic segments")
        return updated
    }

    /**
     * Get members matching criteria.
     */
    private fun getMembersMatchingCriteria(criteria: SegmentCriteria, pageable: Pageable): Page<Member> {
        // Build search parameters from criteria
        val status = criteria.memberStatuses?.firstOrNull()?.let { MemberStatus.valueOf(it) }
        val joinedAfter = criteria.joinedAfterDays?.let { LocalDate.now().minusDays(it.toLong()) }

        return memberRepository.search(
            search = null,
            status = status,
            joinedAfter = joinedAfter,
            joinedBefore = null,
            pageable = pageable
        )
    }

    /**
     * Count members matching criteria.
     */
    private fun countMembersMatchingCriteria(criteria: SegmentCriteria): Int {
        return getMembersMatchingCriteria(criteria, PageRequest.of(0, 1)).totalElements.toInt()
    }

    /**
     * Check if a member matches segment criteria.
     */
    @Transactional(readOnly = true)
    fun memberMatchesSegment(memberId: UUID, segmentId: UUID): Boolean {
        val segment = getSegment(segmentId)

        return if (segment.isStatic()) {
            segmentMemberRepository.existsBySegmentIdAndMemberId(segmentId, memberId)
        } else {
            val member = memberRepository.findById(memberId).orElse(null) ?: return false
            memberMatchesCriteria(member, segment.criteria!!)
        }
    }

    /**
     * Check if a member matches criteria.
     */
    private fun memberMatchesCriteria(member: Member, criteria: SegmentCriteria): Boolean {
        // Check member status
        if (criteria.memberStatuses != null &&
            !criteria.memberStatuses.contains(member.status.name)) {
            return false
        }

        // Check exclusions
        if (criteria.excludeMemberIds?.contains(member.id) == true) {
            return false
        }

        // Check gender
        if (criteria.gender != null && member.gender?.name != criteria.gender) {
            return false
        }

        // Check age
        if (member.dateOfBirth != null) {
            val age = java.time.Period.between(member.dateOfBirth, LocalDate.now()).years
            if (criteria.minAge != null && age < criteria.minAge) return false
            if (criteria.maxAge != null && age > criteria.maxAge) return false
        }

        // Check joined date
        if (criteria.joinedAfterDays != null) {
            val cutoffDate = LocalDate.now().minusDays(criteria.joinedAfterDays.toLong())
            if (member.createdAt.atZone(java.time.ZoneId.systemDefault()).toLocalDate().isBefore(cutoffDate)) {
                return false
            }
        }

        return true
    }
}
