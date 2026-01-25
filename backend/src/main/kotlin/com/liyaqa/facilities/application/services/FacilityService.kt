package com.liyaqa.facilities.application.services

import com.liyaqa.facilities.application.commands.*
import com.liyaqa.facilities.domain.model.*
import com.liyaqa.facilities.domain.ports.FacilityRepository
import com.liyaqa.facilities.domain.ports.FacilitySlotRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@Service
@Transactional
class FacilityService(
    private val facilityRepository: FacilityRepository,
    private val slotRepository: FacilitySlotRepository
) {
    private val logger = LoggerFactory.getLogger(FacilityService::class.java)

    fun createFacility(command: CreateFacilityCommand): Facility {
        val facility = Facility(
            locationId = command.locationId,
            name = command.name,
            description = command.description,
            type = command.type,
            capacity = command.capacity,
            hourlyRate = command.hourlyRate,
            hourlyRateCurrency = command.hourlyRateCurrency,
            requiresSubscription = command.requiresSubscription,
            bookingWindowDays = command.bookingWindowDays,
            minBookingMinutes = command.minBookingMinutes,
            maxBookingMinutes = command.maxBookingMinutes,
            bufferMinutes = command.bufferMinutes,
            genderRestriction = command.genderRestriction,
            imageUrl = command.imageUrl
        )

        command.operatingHours?.forEach { hours ->
            facility.addOperatingHours(
                FacilityOperatingHours(
                    dayOfWeek = hours.dayOfWeek,
                    openTime = hours.openTime,
                    closeTime = hours.closeTime,
                    isClosed = hours.isClosed
                )
            )
        }

        logger.info("Created facility: ${facility.name.en}")
        return facilityRepository.save(facility)
    }

    fun updateFacility(id: UUID, command: UpdateFacilityCommand): Facility {
        val facility = facilityRepository.findById(id)
            .orElseThrow { NoSuchElementException("Facility not found: $id") }

        command.name?.let { facility.name = it }
        command.description?.let { facility.description = it }
        command.type?.let { facility.type = it }
        command.capacity?.let { facility.capacity = it }
        command.hourlyRate?.let { facility.hourlyRate = it }
        command.hourlyRateCurrency?.let { facility.hourlyRateCurrency = it }
        command.requiresSubscription?.let { facility.requiresSubscription = it }
        command.bookingWindowDays?.let { facility.bookingWindowDays = it }
        command.minBookingMinutes?.let { facility.minBookingMinutes = it }
        command.maxBookingMinutes?.let { facility.maxBookingMinutes = it }
        command.bufferMinutes?.let { facility.bufferMinutes = it }
        command.genderRestriction?.let { facility.genderRestriction = it }
        command.imageUrl?.let { facility.imageUrl = it }

        command.operatingHours?.let { hoursList ->
            facility.operatingHours.clear()
            hoursList.forEach { hours ->
                facility.addOperatingHours(
                    FacilityOperatingHours(
                        dayOfWeek = hours.dayOfWeek,
                        openTime = hours.openTime,
                        closeTime = hours.closeTime,
                        isClosed = hours.isClosed
                    )
                )
            }
        }

        logger.info("Updated facility: $id")
        return facilityRepository.save(facility)
    }

    @Transactional(readOnly = true)
    fun getFacility(id: UUID): Facility? =
        facilityRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listFacilities(pageable: Pageable): Page<Facility> =
        facilityRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun listFacilitiesByLocation(locationId: UUID, pageable: Pageable): Page<Facility> =
        facilityRepository.findByLocationId(locationId, pageable)

    @Transactional(readOnly = true)
    fun listActiveFacilitiesByLocation(locationId: UUID, pageable: Pageable): Page<Facility> =
        facilityRepository.findByLocationIdAndStatus(locationId, FacilityStatus.ACTIVE, pageable)

    fun activateFacility(id: UUID): Facility {
        val facility = facilityRepository.findById(id)
            .orElseThrow { NoSuchElementException("Facility not found: $id") }
        facility.activate()
        return facilityRepository.save(facility)
    }

    fun deactivateFacility(id: UUID): Facility {
        val facility = facilityRepository.findById(id)
            .orElseThrow { NoSuchElementException("Facility not found: $id") }
        facility.deactivate()
        return facilityRepository.save(facility)
    }

    fun deleteFacility(id: UUID) {
        if (!facilityRepository.existsById(id)) {
            throw NoSuchElementException("Facility not found: $id")
        }
        facilityRepository.deleteById(id)
        logger.info("Deleted facility: $id")
    }

    // Slot generation
    fun generateSlots(command: GenerateSlotsCommand): List<FacilitySlot> {
        val facility = facilityRepository.findById(command.facilityId)
            .orElseThrow { NoSuchElementException("Facility not found: ${command.facilityId}") }

        val slots = mutableListOf<FacilitySlot>()
        var currentDate = command.startDate

        while (!currentDate.isAfter(command.endDate)) {
            if (slotRepository.existsByFacilityIdAndSlotDate(facility.id, currentDate)) {
                currentDate = currentDate.plusDays(1)
                continue
            }

            val dayOfWeek = currentDate.dayOfWeek.value
            val hours = facility.operatingHours.find { it.dayOfWeek == dayOfWeek }

            if (hours != null && !hours.isClosed) {
                val generatedSlots = generateSlotsForDay(
                    facilityId = facility.id,
                    date = currentDate,
                    openTime = hours.openTime,
                    closeTime = hours.closeTime,
                    slotDurationMinutes = facility.minBookingMinutes,
                    bufferMinutes = facility.bufferMinutes
                )
                slots.addAll(generatedSlots)
            }

            currentDate = currentDate.plusDays(1)
        }

        val savedSlots = slotRepository.saveAll(slots)
        logger.info("Generated ${savedSlots.size} slots for facility ${facility.id}")
        return savedSlots
    }

    private fun generateSlotsForDay(
        facilityId: UUID,
        date: LocalDate,
        openTime: LocalTime,
        closeTime: LocalTime,
        slotDurationMinutes: Int,
        bufferMinutes: Int
    ): List<FacilitySlot> {
        val slots = mutableListOf<FacilitySlot>()
        var currentStart = openTime

        while (currentStart.plusMinutes(slotDurationMinutes.toLong()).isBefore(closeTime) ||
            currentStart.plusMinutes(slotDurationMinutes.toLong()) == closeTime) {

            val slotEnd = currentStart.plusMinutes(slotDurationMinutes.toLong())

            slots.add(
                FacilitySlot(
                    facilityId = facilityId,
                    slotDate = date,
                    startTime = currentStart,
                    endTime = slotEnd
                )
            )

            currentStart = slotEnd.plusMinutes(bufferMinutes.toLong())
        }

        return slots
    }

    @Transactional(readOnly = true)
    fun getSlotsByDate(facilityId: UUID, date: LocalDate): List<FacilitySlot> =
        slotRepository.findByFacilityIdAndSlotDate(facilityId, date)

    @Transactional(readOnly = true)
    fun getAvailableSlotsByDate(facilityId: UUID, date: LocalDate): List<FacilitySlot> =
        slotRepository.findByFacilityIdAndSlotDateAndStatus(facilityId, date, SlotStatus.AVAILABLE)

    @Transactional(readOnly = true)
    fun getSlotsByDateRange(facilityId: UUID, startDate: LocalDate, endDate: LocalDate): List<FacilitySlot> =
        slotRepository.findByFacilityIdAndSlotDateBetween(facilityId, startDate, endDate)
}
