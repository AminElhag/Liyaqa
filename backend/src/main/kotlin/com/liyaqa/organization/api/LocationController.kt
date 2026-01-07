package com.liyaqa.organization.api

import com.liyaqa.organization.application.commands.CreateLocationCommand
import com.liyaqa.organization.application.commands.UpdateLocationCommand
import com.liyaqa.organization.application.services.LocationService
import com.liyaqa.shared.domain.LocalizedAddress
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/locations")
class LocationController(
    private val locationService: LocationService
) {
    @PostMapping
    fun createLocation(
        @Valid @RequestBody request: CreateLocationRequest
    ): ResponseEntity<LocationResponse> {
        val address = buildAddress(request)

        val command = CreateLocationCommand(
            clubId = request.clubId,
            name = LocalizedText(request.nameEn, request.nameAr),
            address = address,
            phone = request.phone,
            email = request.email
        )
        val location = locationService.createLocation(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(LocationResponse.from(location))
    }

    @GetMapping("/{id}")
    fun getLocation(@PathVariable id: UUID): ResponseEntity<LocationResponse> {
        val location = locationService.getLocation(id)
        return ResponseEntity.ok(LocationResponse.from(location))
    }

    @GetMapping
    fun getAllLocations(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<LocationResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val locationPage = locationService.getAllLocations(pageable)

        val response = PageResponse(
            content = locationPage.content.map { LocationResponse.from(it) },
            page = locationPage.number,
            size = locationPage.size,
            totalElements = locationPage.totalElements,
            totalPages = locationPage.totalPages,
            first = locationPage.isFirst,
            last = locationPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/club/{clubId}")
    fun getLocationsByClub(
        @PathVariable clubId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<LocationResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val locationPage = locationService.getLocationsByClub(clubId, pageable)

        val response = PageResponse(
            content = locationPage.content.map { LocationResponse.from(it) },
            page = locationPage.number,
            size = locationPage.size,
            totalElements = locationPage.totalElements,
            totalPages = locationPage.totalPages,
            first = locationPage.isFirst,
            last = locationPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/organization/{organizationId}")
    fun getLocationsByOrganization(
        @PathVariable organizationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<LocationResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val locationPage = locationService.getLocationsByOrganization(organizationId, pageable)

        val response = PageResponse(
            content = locationPage.content.map { LocationResponse.from(it) },
            page = locationPage.number,
            size = locationPage.size,
            totalElements = locationPage.totalElements,
            totalPages = locationPage.totalPages,
            first = locationPage.isFirst,
            last = locationPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    fun updateLocation(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateLocationRequest
    ): ResponseEntity<LocationResponse> {
        val address = buildAddressFromUpdate(request)

        val command = UpdateLocationCommand(
            name = request.nameEn?.let { LocalizedText(it, request.nameAr) },
            address = address,
            phone = request.phone,
            email = request.email
        )
        val location = locationService.updateLocation(id, command)
        return ResponseEntity.ok(LocationResponse.from(location))
    }

    @PostMapping("/{id}/temporarily-close")
    fun temporarilyCloseLocation(@PathVariable id: UUID): ResponseEntity<LocationResponse> {
        val location = locationService.temporarilyCloseLocation(id)
        return ResponseEntity.ok(LocationResponse.from(location))
    }

    @PostMapping("/{id}/reopen")
    fun reopenLocation(@PathVariable id: UUID): ResponseEntity<LocationResponse> {
        val location = locationService.reopenLocation(id)
        return ResponseEntity.ok(LocationResponse.from(location))
    }

    @PostMapping("/{id}/permanently-close")
    fun permanentlyCloseLocation(@PathVariable id: UUID): ResponseEntity<LocationResponse> {
        val location = locationService.permanentlyCloseLocation(id)
        return ResponseEntity.ok(LocationResponse.from(location))
    }

    private fun buildAddress(request: CreateLocationRequest): LocalizedAddress? {
        return if (request.streetEn != null || request.cityEn != null ||
            request.buildingEn != null || request.districtEn != null
        ) {
            LocalizedAddress(
                street = request.streetEn?.let { LocalizedText(it, request.streetAr) },
                building = request.buildingEn?.let { LocalizedText(it, request.buildingAr) },
                city = request.cityEn?.let { LocalizedText(it, request.cityAr) },
                district = request.districtEn?.let { LocalizedText(it, request.districtAr) },
                postalCode = request.postalCode,
                countryCode = request.countryCode
            )
        } else null
    }

    private fun buildAddressFromUpdate(request: UpdateLocationRequest): LocalizedAddress? {
        return if (request.streetEn != null || request.cityEn != null ||
            request.buildingEn != null || request.districtEn != null ||
            request.postalCode != null || request.countryCode != null
        ) {
            LocalizedAddress(
                street = request.streetEn?.let { LocalizedText(it, request.streetAr) },
                building = request.buildingEn?.let { LocalizedText(it, request.buildingAr) },
                city = request.cityEn?.let { LocalizedText(it, request.cityAr) },
                district = request.districtEn?.let { LocalizedText(it, request.districtAr) },
                postalCode = request.postalCode,
                countryCode = request.countryCode
            )
        } else null
    }
}