package com.liyaqa.organization.application.services

import com.liyaqa.organization.application.commands.CreateLocationCommand
import com.liyaqa.organization.application.commands.UpdateLocationCommand
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class LocationService(
    private val locationRepository: LocationRepository,
    private val clubRepository: ClubRepository
) {
    fun createLocation(command: CreateLocationCommand): Location {
        val club = clubRepository.findById(command.clubId)
            .orElseThrow { NoSuchElementException("Club not found with id: ${command.clubId}") }

        val location = Location(
            clubId = command.clubId,
            name = command.name,
            address = command.address,
            phone = command.phone,
            email = command.email
        )

        // Initialize tenant and organization from club
        location.initializeFromClub(club)

        return locationRepository.save(location)
    }

    @Transactional(readOnly = true)
    fun getLocation(id: UUID): Location {
        return locationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Location not found with id: $id") }
    }

    @Transactional(readOnly = true)
    fun getLocationsByClub(clubId: UUID, pageable: Pageable): Page<Location> {
        return locationRepository.findByClubId(clubId, pageable)
    }

    @Transactional(readOnly = true)
    fun getAllLocations(pageable: Pageable): Page<Location> {
        return locationRepository.findAll(pageable)
    }

    @Transactional(readOnly = true)
    fun getLocationsByStatus(status: LocationStatus, pageable: Pageable): Page<Location> {
        return locationRepository.findByStatus(status, pageable)
    }

    /**
     * Get all locations for an organization (super-tenant query).
     */
    @Transactional(readOnly = true)
    fun getLocationsByOrganization(organizationId: UUID, pageable: Pageable): Page<Location> {
        return locationRepository.findByOrganizationId(organizationId, pageable)
    }

    fun updateLocation(id: UUID, command: UpdateLocationCommand): Location {
        val location = getLocation(id)

        command.name?.let { location.name = it }
        command.address?.let { location.address = it }
        command.phone?.let { location.phone = it }
        command.email?.let { location.email = it }

        return locationRepository.save(location)
    }

    fun temporarilyCloseLocation(id: UUID): Location {
        val location = getLocation(id)
        location.temporarilyClose()
        return locationRepository.save(location)
    }

    fun reopenLocation(id: UUID): Location {
        val location = getLocation(id)
        location.reopen()
        return locationRepository.save(location)
    }

    fun permanentlyCloseLocation(id: UUID): Location {
        val location = getLocation(id)
        location.permanentlyClose()
        return locationRepository.save(location)
    }
}