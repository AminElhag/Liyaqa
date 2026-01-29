package com.liyaqa.facilities.infrastructure.persistence

import com.liyaqa.facilities.domain.model.BookingStatus
import com.liyaqa.facilities.domain.model.FacilityBooking
import com.liyaqa.facilities.domain.ports.FacilityBookingRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.util.*

interface SpringDataFacilityBookingRepository : JpaRepository<FacilityBooking, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<FacilityBooking>
    fun findByFacilityId(facilityId: UUID, pageable: Pageable): Page<FacilityBooking>
    fun findBySlotId(slotId: UUID): Optional<FacilityBooking>
    fun findByMemberIdAndStatus(memberId: UUID, status: BookingStatus, pageable: Pageable): Page<FacilityBooking>
    fun findByFacilityIdAndBookedAtBetween(facilityId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<FacilityBooking>

    @Query("SELECT b FROM FacilityBooking b WHERE b.memberId = :memberId AND b.status IN ('CONFIRMED', 'CHECKED_IN') ORDER BY b.bookedAt DESC")
    fun findUpcomingByMemberId(@Param("memberId") memberId: UUID, pageable: Pageable): Page<FacilityBooking>

    fun countByMemberIdAndStatusAndBookedAtAfter(memberId: UUID, status: BookingStatus, after: Instant): Long
    fun existsBySlotIdAndStatusIn(slotId: UUID, statuses: List<BookingStatus>): Boolean

    @Query("SELECT b FROM FacilityBooking b JOIN FacilitySlot s ON b.slotId = s.id WHERE s.slotDate = :date ORDER BY s.startTime")
    fun findBySlotDate(@Param("date") date: LocalDate): List<FacilityBooking>
}

@Repository
class JpaFacilityBookingRepository(
    private val springDataRepository: SpringDataFacilityBookingRepository
) : FacilityBookingRepository {

    override fun save(booking: FacilityBooking): FacilityBooking =
        springDataRepository.save(booking)

    override fun findById(id: UUID): Optional<FacilityBooking> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<FacilityBooking> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByFacilityId(facilityId: UUID, pageable: Pageable): Page<FacilityBooking> =
        springDataRepository.findByFacilityId(facilityId, pageable)

    override fun findBySlotId(slotId: UUID): Optional<FacilityBooking> =
        springDataRepository.findBySlotId(slotId)

    override fun findByMemberIdAndStatus(memberId: UUID, status: BookingStatus, pageable: Pageable): Page<FacilityBooking> =
        springDataRepository.findByMemberIdAndStatus(memberId, status, pageable)

    override fun findByFacilityIdAndBookedAtBetween(facilityId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<FacilityBooking> =
        springDataRepository.findByFacilityIdAndBookedAtBetween(facilityId, start, end, pageable)

    override fun findUpcomingByMemberId(memberId: UUID, pageable: Pageable): Page<FacilityBooking> =
        springDataRepository.findUpcomingByMemberId(memberId, pageable)

    override fun countByMemberIdAndStatusAndBookedAtAfter(memberId: UUID, status: BookingStatus, after: Instant): Long =
        springDataRepository.countByMemberIdAndStatusAndBookedAtAfter(memberId, status, after)

    override fun existsBySlotIdAndStatusIn(slotId: UUID, statuses: List<BookingStatus>): Boolean =
        springDataRepository.existsBySlotIdAndStatusIn(slotId, statuses)

    override fun findBySlotDate(date: LocalDate): List<FacilityBooking> =
        springDataRepository.findBySlotDate(date)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
