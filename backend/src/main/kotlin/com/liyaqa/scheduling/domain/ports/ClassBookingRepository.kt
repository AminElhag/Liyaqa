package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for ClassBooking entities.
 */
interface ClassBookingRepository {
    fun save(booking: ClassBooking): ClassBooking
    fun saveAll(bookings: List<ClassBooking>): List<ClassBooking>
    fun findById(id: UUID): Optional<ClassBooking>
    fun findBySessionId(sessionId: UUID): List<ClassBooking>
    fun findBySessionIdAndStatus(sessionId: UUID, status: BookingStatus): List<ClassBooking>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<ClassBooking>
    fun findByMemberIdAndStatus(memberId: UUID, status: BookingStatus, pageable: Pageable): Page<ClassBooking>
    fun findBySessionIdAndMemberId(sessionId: UUID, memberId: UUID): Optional<ClassBooking>
    fun findWaitlistedBySessionIdOrderByPosition(sessionId: UUID): List<ClassBooking>
    fun findUpcomingByMemberId(memberId: UUID, fromDate: LocalDate, pageable: Pageable): Page<ClassBooking>
    fun findPastByMemberId(memberId: UUID, beforeDate: LocalDate, pageable: Pageable): Page<ClassBooking>
    fun findAll(pageable: Pageable): Page<ClassBooking>
    fun existsById(id: UUID): Boolean
    fun existsBySessionIdAndMemberId(sessionId: UUID, memberId: UUID): Boolean
    fun existsBySessionIdAndMemberIdAndStatusIn(sessionId: UUID, memberId: UUID, statuses: List<BookingStatus>): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countBySessionId(sessionId: UUID): Long
    fun countBySessionIdAndStatus(sessionId: UUID, status: BookingStatus): Long
    fun countByMemberIdAndStatus(memberId: UUID, status: BookingStatus): Long

    /**
     * Finds bookings filtered by session date range and optional status.
     */
    fun findByDateRange(dateFrom: LocalDate?, dateTo: LocalDate?, status: BookingStatus?, pageable: Pageable): Page<ClassBooking>

    /**
     * Finds all active bookings (CONFIRMED or WAITLISTED) for a member on a specific date.
     * Used for concurrent booking validation to prevent double-booking.
     */
    fun findActiveBookingsByMemberAndDate(memberId: UUID, sessionDate: LocalDate): List<ClassBooking>

    /**
     * Finds active bookings with sessions and gym classes preloaded.
     * Optimized for overlap validation - returns tuple of (booking, session, gymClass).
     * This eliminates N+1 queries by fetching all data in a single query.
     */
    fun findActiveBookingsWithSessionsAndClasses(memberId: UUID, sessionDate: LocalDate): List<Array<Any>>
}
