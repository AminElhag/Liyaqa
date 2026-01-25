package com.liyaqa.facilities.domain.ports

import com.liyaqa.facilities.domain.model.BookingStatus
import com.liyaqa.facilities.domain.model.FacilityBooking
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.time.LocalDate
import java.util.*

interface FacilityBookingRepository {
    fun save(booking: FacilityBooking): FacilityBooking
    fun findById(id: UUID): Optional<FacilityBooking>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<FacilityBooking>
    fun findByFacilityId(facilityId: UUID, pageable: Pageable): Page<FacilityBooking>
    fun findBySlotId(slotId: UUID): Optional<FacilityBooking>
    fun findByMemberIdAndStatus(memberId: UUID, status: BookingStatus, pageable: Pageable): Page<FacilityBooking>
    fun findByFacilityIdAndBookedAtBetween(facilityId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<FacilityBooking>
    fun findUpcomingByMemberId(memberId: UUID, pageable: Pageable): Page<FacilityBooking>
    fun countByMemberIdAndStatusAndBookedAtAfter(memberId: UUID, status: BookingStatus, after: Instant): Long
    fun existsBySlotIdAndStatusIn(slotId: UUID, statuses: List<BookingStatus>): Boolean
    fun deleteById(id: UUID)
}
