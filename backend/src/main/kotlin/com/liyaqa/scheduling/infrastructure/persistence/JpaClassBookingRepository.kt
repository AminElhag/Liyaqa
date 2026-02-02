package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataClassBookingRepository : JpaRepository<ClassBooking, UUID> {
    fun findBySessionId(sessionId: UUID): List<ClassBooking>
    fun findBySessionIdAndStatus(sessionId: UUID, status: BookingStatus): List<ClassBooking>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ClassBooking>
    fun findByMemberIdAndStatus(memberId: UUID, status: BookingStatus, pageable: Pageable): Page<ClassBooking>
    fun findBySessionIdAndMemberId(sessionId: UUID, memberId: UUID): Optional<ClassBooking>
    fun existsBySessionIdAndMemberId(sessionId: UUID, memberId: UUID): Boolean
    fun existsBySessionIdAndMemberIdAndStatusIn(sessionId: UUID, memberId: UUID, statuses: List<BookingStatus>): Boolean
    fun countBySessionId(sessionId: UUID): Long
    fun countBySessionIdAndStatus(sessionId: UUID, status: BookingStatus): Long
    fun countByMemberIdAndStatus(memberId: UUID, status: BookingStatus): Long

    @Query("""
        SELECT b FROM ClassBooking b
        WHERE b.sessionId = :sessionId
        AND b.status = 'WAITLISTED'
        ORDER BY b.waitlistPosition ASC
    """)
    fun findWaitlistedBySessionIdOrderByPosition(@Param("sessionId") sessionId: UUID): List<ClassBooking>

    @Query("""
        SELECT b FROM ClassBooking b
        JOIN ClassSession s ON b.sessionId = s.id
        WHERE b.memberId = :memberId
        AND s.sessionDate >= :fromDate
        AND b.status IN ('CONFIRMED', 'WAITLISTED')
        ORDER BY s.sessionDate ASC, s.startTime ASC
    """)
    fun findUpcomingByMemberId(
        @Param("memberId") memberId: UUID,
        @Param("fromDate") fromDate: LocalDate,
        pageable: Pageable
    ): Page<ClassBooking>

    @Query("""
        SELECT b FROM ClassBooking b
        JOIN ClassSession s ON b.sessionId = s.id
        WHERE b.memberId = :memberId
        AND s.sessionDate < :beforeDate
        ORDER BY s.sessionDate DESC, s.startTime DESC
    """)
    fun findPastByMemberId(
        @Param("memberId") memberId: UUID,
        @Param("beforeDate") beforeDate: LocalDate,
        pageable: Pageable
    ): Page<ClassBooking>

    @Query("""
        SELECT b FROM ClassBooking b
        JOIN ClassSession s ON b.sessionId = s.id
        WHERE b.memberId = :memberId
        AND s.sessionDate = :sessionDate
        AND b.status IN ('CONFIRMED', 'WAITLISTED')
    """)
    fun findActiveBookingsByMemberAndDate(
        @Param("memberId") memberId: UUID,
        @Param("sessionDate") sessionDate: LocalDate
    ): List<ClassBooking>

    /**
     * Finds active bookings for a member on a specific date with sessions and gym classes preloaded.
     * This eliminates N+1 queries by fetching all related data in a single query.
     *
     * Returns a map where:
     * - Key: ClassBooking
     * - Value: Pair of (ClassSession, GymClass)
     *
     * This allows BookingService to validate overlapping bookings without additional queries.
     */
    @Query("""
        SELECT b, s, gc FROM ClassBooking b
        JOIN ClassSession s ON b.sessionId = s.id
        JOIN GymClass gc ON s.gymClassId = gc.id
        WHERE b.memberId = :memberId
        AND s.sessionDate = :sessionDate
        AND b.status IN ('CONFIRMED', 'WAITLISTED')
    """)
    fun findActiveBookingsWithSessionsAndClasses(
        @Param("memberId") memberId: UUID,
        @Param("sessionDate") sessionDate: LocalDate
    ): List<Array<Any>>
}

@Repository
class JpaClassBookingRepository(
    private val springDataRepository: SpringDataClassBookingRepository
) : ClassBookingRepository {

    override fun save(booking: ClassBooking): ClassBooking =
        springDataRepository.save(booking)

    override fun saveAll(bookings: List<ClassBooking>): List<ClassBooking> =
        springDataRepository.saveAll(bookings)

    override fun findById(id: UUID): Optional<ClassBooking> =
        springDataRepository.findById(id)

    override fun findBySessionId(sessionId: UUID): List<ClassBooking> =
        springDataRepository.findBySessionId(sessionId)

    override fun findBySessionIdAndStatus(sessionId: UUID, status: BookingStatus): List<ClassBooking> =
        springDataRepository.findBySessionIdAndStatus(sessionId, status)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ClassBooking> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByMemberIdAndStatus(
        memberId: UUID,
        status: BookingStatus,
        pageable: Pageable
    ): Page<ClassBooking> =
        springDataRepository.findByMemberIdAndStatus(memberId, status, pageable)

    override fun findBySessionIdAndMemberId(sessionId: UUID, memberId: UUID): Optional<ClassBooking> =
        springDataRepository.findBySessionIdAndMemberId(sessionId, memberId)

    override fun findWaitlistedBySessionIdOrderByPosition(sessionId: UUID): List<ClassBooking> =
        springDataRepository.findWaitlistedBySessionIdOrderByPosition(sessionId)

    override fun findUpcomingByMemberId(
        memberId: UUID,
        fromDate: LocalDate,
        pageable: Pageable
    ): Page<ClassBooking> =
        springDataRepository.findUpcomingByMemberId(memberId, fromDate, pageable)

    override fun findPastByMemberId(
        memberId: UUID,
        beforeDate: LocalDate,
        pageable: Pageable
    ): Page<ClassBooking> =
        springDataRepository.findPastByMemberId(memberId, beforeDate, pageable)

    override fun findAll(pageable: Pageable): Page<ClassBooking> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsBySessionIdAndMemberId(sessionId: UUID, memberId: UUID): Boolean =
        springDataRepository.existsBySessionIdAndMemberId(sessionId, memberId)

    override fun existsBySessionIdAndMemberIdAndStatusIn(
        sessionId: UUID,
        memberId: UUID,
        statuses: List<BookingStatus>
    ): Boolean =
        springDataRepository.existsBySessionIdAndMemberIdAndStatusIn(sessionId, memberId, statuses)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countBySessionId(sessionId: UUID): Long =
        springDataRepository.countBySessionId(sessionId)

    override fun countBySessionIdAndStatus(sessionId: UUID, status: BookingStatus): Long =
        springDataRepository.countBySessionIdAndStatus(sessionId, status)

    override fun countByMemberIdAndStatus(memberId: UUID, status: BookingStatus): Long =
        springDataRepository.countByMemberIdAndStatus(memberId, status)

    override fun findActiveBookingsByMemberAndDate(memberId: UUID, sessionDate: LocalDate): List<ClassBooking> =
        springDataRepository.findActiveBookingsByMemberAndDate(memberId, sessionDate)

    override fun findActiveBookingsWithSessionsAndClasses(memberId: UUID, sessionDate: LocalDate): List<Array<Any>> =
        springDataRepository.findActiveBookingsWithSessionsAndClasses(memberId, sessionDate)
}
