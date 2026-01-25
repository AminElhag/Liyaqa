package com.liyaqa.marketing.infrastructure.persistence

import com.liyaqa.marketing.domain.model.Segment
import com.liyaqa.marketing.domain.model.SegmentMember
import com.liyaqa.marketing.domain.model.SegmentType
import com.liyaqa.marketing.domain.ports.SegmentMemberRepository
import com.liyaqa.marketing.domain.ports.SegmentRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataSegmentRepository : JpaRepository<Segment, UUID> {

    fun findByIsActiveTrue(pageable: Pageable): Page<Segment>

    fun findBySegmentType(segmentType: SegmentType, pageable: Pageable): Page<Segment>

    @Query("""
        SELECT s FROM Segment s
        WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:isActive IS NULL OR s.isActive = :isActive)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("isActive") isActive: Boolean?,
        pageable: Pageable
    ): Page<Segment>

    fun findBySegmentTypeAndIsActiveTrue(segmentType: SegmentType): List<Segment>
}

interface SpringDataSegmentMemberRepository : JpaRepository<SegmentMember, UUID> {

    fun findBySegmentId(segmentId: UUID, pageable: Pageable): Page<SegmentMember>

    @Query("SELECT sm.memberId FROM SegmentMember sm WHERE sm.segmentId = :segmentId")
    fun findMemberIdsBySegmentId(@Param("segmentId") segmentId: UUID): List<UUID>

    fun existsBySegmentIdAndMemberId(segmentId: UUID, memberId: UUID): Boolean

    @Modifying
    @Query("DELETE FROM SegmentMember sm WHERE sm.segmentId = :segmentId AND sm.memberId = :memberId")
    fun deleteBySegmentIdAndMemberId(
        @Param("segmentId") segmentId: UUID,
        @Param("memberId") memberId: UUID
    )

    @Modifying
    @Query("DELETE FROM SegmentMember sm WHERE sm.segmentId = :segmentId")
    fun deleteBySegmentId(@Param("segmentId") segmentId: UUID)

    fun countBySegmentId(segmentId: UUID): Long
}

@Repository
class JpaSegmentRepository(
    private val springDataRepository: SpringDataSegmentRepository
) : SegmentRepository {

    override fun save(segment: Segment): Segment = springDataRepository.save(segment)

    override fun findById(id: UUID): Optional<Segment> = springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Segment> = springDataRepository.findAll(pageable)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean = springDataRepository.existsById(id)

    override fun findActive(pageable: Pageable): Page<Segment> =
        springDataRepository.findByIsActiveTrue(pageable)

    override fun findByType(segmentType: SegmentType, pageable: Pageable): Page<Segment> =
        springDataRepository.findBySegmentType(segmentType, pageable)

    override fun search(search: String?, isActive: Boolean?, pageable: Pageable): Page<Segment> =
        springDataRepository.search(search, isActive, pageable)

    override fun findAllDynamic(): List<Segment> =
        springDataRepository.findBySegmentTypeAndIsActiveTrue(SegmentType.DYNAMIC)
}

@Repository
class JpaSegmentMemberRepository(
    private val springDataRepository: SpringDataSegmentMemberRepository
) : SegmentMemberRepository {

    override fun save(segmentMember: SegmentMember): SegmentMember = springDataRepository.save(segmentMember)

    override fun saveAll(segmentMembers: List<SegmentMember>): List<SegmentMember> =
        springDataRepository.saveAll(segmentMembers)

    override fun findById(id: UUID): Optional<SegmentMember> = springDataRepository.findById(id)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun findBySegmentId(segmentId: UUID, pageable: Pageable): Page<SegmentMember> =
        springDataRepository.findBySegmentId(segmentId, pageable)

    override fun findMemberIdsBySegmentId(segmentId: UUID): List<UUID> =
        springDataRepository.findMemberIdsBySegmentId(segmentId)

    override fun existsBySegmentIdAndMemberId(segmentId: UUID, memberId: UUID): Boolean =
        springDataRepository.existsBySegmentIdAndMemberId(segmentId, memberId)

    override fun deleteBySegmentIdAndMemberId(segmentId: UUID, memberId: UUID) =
        springDataRepository.deleteBySegmentIdAndMemberId(segmentId, memberId)

    override fun deleteBySegmentId(segmentId: UUID) = springDataRepository.deleteBySegmentId(segmentId)

    override fun countBySegmentId(segmentId: UUID): Long = springDataRepository.countBySegmentId(segmentId)
}
