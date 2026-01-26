package com.liyaqa.facilities.application.services

import com.liyaqa.facilities.application.commands.CreateBookingCommand
import com.liyaqa.facilities.domain.model.*
import com.liyaqa.facilities.domain.ports.FacilityBookingRepository
import com.liyaqa.facilities.domain.ports.FacilityRepository
import com.liyaqa.facilities.domain.ports.FacilitySlotRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

/**
 * Enriched facility booking with related entity details
 */
data class EnrichedFacilityBooking(
    val id: UUID,
    val facilityId: UUID,
    val facilityName: LocalizedText,
    val facilityType: FacilityType,
    val memberId: UUID,
    val memberName: String,
    val memberNumber: String,
    val memberPhone: String?,
    val slotDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: BookingStatus,
    val notes: String?,
    val bookedAt: Instant,
    val checkedInAt: Instant?
)

@Service
@Transactional
class FacilityBookingService(
    private val bookingRepository: FacilityBookingRepository,
    private val slotRepository: FacilitySlotRepository,
    private val facilityRepository: FacilityRepository,
    private val memberRepository: MemberRepository
) {
    private val logger = LoggerFactory.getLogger(FacilityBookingService::class.java)

    fun createBooking(command: CreateBookingCommand): FacilityBooking {
        // Validate facility exists
        val facility = facilityRepository.findById(command.facilityId)
            .orElseThrow { NoSuchElementException("Facility not found: ${command.facilityId}") }

        if (facility.status != FacilityStatus.ACTIVE) {
            throw IllegalStateException("Facility is not active")
        }

        // Validate member exists
        if (!memberRepository.existsById(command.memberId)) {
            throw NoSuchElementException("Member not found: ${command.memberId}")
        }

        // Validate slot exists and is available
        val slot = slotRepository.findById(command.slotId)
            .orElseThrow { NoSuchElementException("Slot not found: ${command.slotId}") }

        if (slot.facilityId != command.facilityId) {
            throw IllegalArgumentException("Slot does not belong to the specified facility")
        }

        if (!slot.isAvailable) {
            throw IllegalStateException("Slot is not available for booking")
        }

        // Check if slot already has an active booking
        val activeStatuses = listOf(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN)
        if (bookingRepository.existsBySlotIdAndStatusIn(slot.id, activeStatuses)) {
            throw IllegalStateException("Slot is already booked")
        }

        // Create booking
        val booking = FacilityBooking(
            facilityId = command.facilityId,
            slotId = command.slotId,
            memberId = command.memberId,
            notes = command.notes
        )

        // Mark slot as booked
        slot.book()
        slotRepository.save(slot)

        val savedBooking = bookingRepository.save(booking)
        logger.info("Created facility booking: ${savedBooking.id} for member ${command.memberId}")

        return savedBooking
    }

    @Transactional(readOnly = true)
    fun getBooking(id: UUID): FacilityBooking? =
        bookingRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun getMemberBookings(memberId: UUID, pageable: Pageable): Page<FacilityBooking> =
        bookingRepository.findByMemberId(memberId, pageable)

    @Transactional(readOnly = true)
    fun getMemberUpcomingBookings(memberId: UUID, pageable: Pageable): Page<FacilityBooking> =
        bookingRepository.findUpcomingByMemberId(memberId, pageable)

    @Transactional(readOnly = true)
    fun getFacilityBookings(facilityId: UUID, pageable: Pageable): Page<FacilityBooking> =
        bookingRepository.findByFacilityId(facilityId, pageable)

    fun checkIn(bookingId: UUID): FacilityBooking {
        val booking = bookingRepository.findById(bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: $bookingId") }

        booking.checkIn()
        logger.info("Checked in booking: $bookingId")

        return bookingRepository.save(booking)
    }

    fun complete(bookingId: UUID): FacilityBooking {
        val booking = bookingRepository.findById(bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: $bookingId") }

        booking.complete()
        logger.info("Completed booking: $bookingId")

        return bookingRepository.save(booking)
    }

    fun cancel(bookingId: UUID, reason: String? = null): FacilityBooking {
        val booking = bookingRepository.findById(bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: $bookingId") }

        booking.cancel(reason)

        // Release the slot
        val slot = slotRepository.findById(booking.slotId).orElse(null)
        slot?.let {
            it.release()
            slotRepository.save(it)
        }

        logger.info("Cancelled booking: $bookingId")
        return bookingRepository.save(booking)
    }

    fun markNoShow(bookingId: UUID): FacilityBooking {
        val booking = bookingRepository.findById(bookingId)
            .orElseThrow { NoSuchElementException("Booking not found: $bookingId") }

        booking.markNoShow()
        logger.info("Marked booking as no-show: $bookingId")

        return bookingRepository.save(booking)
    }

    @Transactional(readOnly = true)
    fun countMemberNoShows(memberId: UUID, since: Instant): Long =
        bookingRepository.countByMemberIdAndStatusAndBookedAtAfter(memberId, BookingStatus.NO_SHOW, since)

    /**
     * Count today's bookings
     */
    @Transactional(readOnly = true)
    fun countTodayBookings(): Int =
        bookingRepository.findBySlotDate(LocalDate.now()).size

    /**
     * Get bookings by date with enriched details
     */
    @Transactional(readOnly = true)
    fun getBookingsByDate(date: LocalDate): List<EnrichedFacilityBooking> {
        val bookings = bookingRepository.findBySlotDate(date)
        return bookings.mapNotNull { enrichBooking(it) }
    }

    /**
     * Check in a booking and return enriched details
     */
    fun checkInEnriched(bookingId: UUID): EnrichedFacilityBooking {
        val booking = checkIn(bookingId)
        return enrichBooking(booking) ?: throw NoSuchElementException("Could not enrich booking: $bookingId")
    }

    /**
     * Cancel a booking and return enriched details
     */
    fun cancelEnriched(bookingId: UUID, reason: String? = null): EnrichedFacilityBooking {
        val booking = cancel(bookingId, reason)
        return enrichBooking(booking) ?: throw NoSuchElementException("Could not enrich booking: $bookingId")
    }

    /**
     * Enrich a booking with related entity details
     */
    private fun enrichBooking(booking: FacilityBooking): EnrichedFacilityBooking? {
        val facility = facilityRepository.findById(booking.facilityId).orElse(null) ?: return null
        val slot = slotRepository.findById(booking.slotId).orElse(null) ?: return null
        val member = memberRepository.findById(booking.memberId).orElse(null) ?: return null

        return EnrichedFacilityBooking(
            id = booking.id,
            facilityId = booking.facilityId,
            facilityName = facility.name,
            facilityType = facility.type,
            memberId = booking.memberId,
            memberName = "${member.firstName.en} ${member.lastName.en}",
            memberNumber = member.id.toString().take(8).uppercase(),
            memberPhone = member.phone,
            slotDate = slot.slotDate,
            startTime = slot.startTime,
            endTime = slot.endTime,
            status = booking.status,
            notes = booking.notes,
            bookedAt = booking.bookedAt,
            checkedInAt = booking.checkedInAt
        )
    }
}
