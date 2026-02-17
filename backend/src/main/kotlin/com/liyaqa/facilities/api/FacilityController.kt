package com.liyaqa.facilities.api

import com.liyaqa.facilities.application.commands.*
import com.liyaqa.facilities.application.services.FacilityService
import com.liyaqa.facilities.domain.model.SlotStatus
import com.liyaqa.facilities.domain.ports.FacilityBookingRepository
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/facilities")
@Tag(name = "Facilities", description = "Facility management")
class FacilityController(
    private val facilityService: FacilityService,
    private val facilityBookingRepository: FacilityBookingRepository
) {
    @PostMapping
    @PreAuthorize("hasAuthority('facilities_create')")
    @Operation(summary = "Create a new facility")
    fun createFacility(
        @Valid @RequestBody request: CreateFacilityRequest
    ): ResponseEntity<FacilityResponse> {
        val command = CreateFacilityCommand(
            locationId = request.locationId,
            name = LocalizedText(request.nameEn, request.nameAr),
            description = request.descriptionEn?.let { LocalizedText(it, request.descriptionAr) },
            type = request.type,
            capacity = request.capacity,
            hourlyRate = request.hourlyRate,
            hourlyRateCurrency = request.hourlyRateCurrency,
            requiresSubscription = request.requiresSubscription,
            bookingWindowDays = request.bookingWindowDays,
            minBookingMinutes = request.minBookingMinutes,
            maxBookingMinutes = request.maxBookingMinutes,
            bufferMinutes = request.bufferMinutes,
            genderRestriction = request.genderRestriction,
            imageUrl = request.imageUrl,
            operatingHours = request.operatingHours?.map {
                OperatingHoursInput(it.dayOfWeek, it.openTime, it.closeTime, it.isClosed)
            }
        )
        val facility = facilityService.createFacility(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(FacilityResponse.from(facility))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('facilities_view')")
    @Operation(summary = "List all facilities")
    fun listFacilities(
        @RequestParam(required = false) locationId: UUID?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<FacilityResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name.en"))
        val facilitiesPage = if (locationId != null) {
            facilityService.listFacilitiesByLocation(locationId, pageable)
        } else {
            facilityService.listFacilities(pageable)
        }

        val response = PageResponse(
            content = facilitiesPage.content.map { FacilityResponse.from(it) },
            page = facilitiesPage.number,
            size = facilitiesPage.size,
            totalElements = facilitiesPage.totalElements,
            totalPages = facilitiesPage.totalPages,
            first = facilitiesPage.isFirst,
            last = facilitiesPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('facilities_view')")
    @Operation(summary = "Get facility by ID")
    fun getFacility(@PathVariable id: UUID): ResponseEntity<FacilityResponse> {
        val facility = facilityService.getFacility(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(FacilityResponse.from(facility))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('facilities_update')")
    @Operation(summary = "Update a facility")
    fun updateFacility(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateFacilityRequest
    ): ResponseEntity<FacilityResponse> {
        val command = UpdateFacilityCommand(
            name = request.nameEn?.let { LocalizedText(it, request.nameAr) },
            description = request.descriptionEn?.let { LocalizedText(it, request.descriptionAr) },
            type = request.type,
            capacity = request.capacity,
            hourlyRate = request.hourlyRate,
            hourlyRateCurrency = request.hourlyRateCurrency,
            requiresSubscription = request.requiresSubscription,
            bookingWindowDays = request.bookingWindowDays,
            minBookingMinutes = request.minBookingMinutes,
            maxBookingMinutes = request.maxBookingMinutes,
            bufferMinutes = request.bufferMinutes,
            genderRestriction = request.genderRestriction,
            imageUrl = request.imageUrl,
            operatingHours = request.operatingHours?.map {
                OperatingHoursInput(it.dayOfWeek, it.openTime, it.closeTime, it.isClosed)
            }
        )
        val facility = facilityService.updateFacility(id, command)
        return ResponseEntity.ok(FacilityResponse.from(facility))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('facilities_delete')")
    @Operation(summary = "Delete a facility")
    fun deleteFacility(@PathVariable id: UUID): ResponseEntity<Void> {
        facilityService.deleteFacility(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('facilities_update')")
    @Operation(summary = "Activate a facility")
    fun activateFacility(@PathVariable id: UUID): ResponseEntity<FacilityResponse> {
        val facility = facilityService.activateFacility(id)
        return ResponseEntity.ok(FacilityResponse.from(facility))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('facilities_update')")
    @Operation(summary = "Deactivate a facility")
    fun deactivateFacility(@PathVariable id: UUID): ResponseEntity<FacilityResponse> {
        val facility = facilityService.deactivateFacility(id)
        return ResponseEntity.ok(FacilityResponse.from(facility))
    }

    // ========== Slots ==========

    @PostMapping("/{id}/slots/generate")
    @PreAuthorize("hasAuthority('facilities_update')")
    @Operation(summary = "Generate time slots for a facility")
    fun generateSlots(
        @PathVariable id: UUID,
        @Valid @RequestBody request: GenerateSlotsRequest
    ): ResponseEntity<List<FacilitySlotResponse>> {
        val command = GenerateSlotsCommand(
            facilityId = id,
            startDate = request.startDate,
            endDate = request.endDate
        )
        val slots = facilityService.generateSlots(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(slots.map { FacilitySlotResponse.from(it, null) })
    }

    @GetMapping("/{id}/slots")
    @PreAuthorize("hasAuthority('facilities_view')")
    @Operation(summary = "Get slots for a facility")
    fun getSlots(
        @PathVariable id: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam(defaultValue = "false") availableOnly: Boolean
    ): ResponseEntity<List<FacilitySlotResponse>> {
        val slots = when {
            date != null -> {
                if (availableOnly) {
                    facilityService.getAvailableSlotsByDate(id, date)
                } else {
                    facilityService.getSlotsByDate(id, date)
                }
            }
            startDate != null && endDate != null -> {
                facilityService.getSlotsByDateRange(id, startDate, endDate)
            }
            else -> {
                facilityService.getSlotsByDate(id, LocalDate.now())
            }
        }

        val bookedSlotIds = slots.filter { it.status == SlotStatus.BOOKED }.map { it.id }
        val bookingMap = facilityBookingRepository.findBySlotIdIn(bookedSlotIds)
            .associateBy { it.slotId }

        return ResponseEntity.ok(slots.map { FacilitySlotResponse.from(it, bookingMap[it.id]) })
    }
}
