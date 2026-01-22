package com.liyaqa.organization.application.services

import com.liyaqa.organization.application.commands.CreateLocationCommand
import com.liyaqa.organization.application.commands.UpdateLocationCommand
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LocationServiceTest {

    @Mock
    private lateinit var locationRepository: LocationRepository

    @Mock
    private lateinit var clubRepository: ClubRepository

    private lateinit var locationService: LocationService

    private val testOrganizationId = UUID.randomUUID()
    private val testClubId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        locationService = LocationService(locationRepository, clubRepository)
    }

    @Test
    fun `createLocation should create location when club exists`() {
        // Given
        val testClub = createTestClub()
        val command = CreateLocationCommand(
            clubId = testClubId,
            name = LocalizedText(en = "Test Location", ar = "موقع اختبار")
        )

        whenever(clubRepository.findById(testClubId)) doReturn Optional.of(testClub)
        whenever(locationRepository.save(any<Location>())) doReturn createTestLocation()

        // When
        val result = locationService.createLocation(command)

        // Then
        assertNotNull(result)
        verify(locationRepository).save(any<Location>())
    }

    @Test
    fun `createLocation should throw when club not found`() {
        // Given
        val command = CreateLocationCommand(
            clubId = testClubId,
            name = LocalizedText(en = "Test Location", ar = "موقع اختبار")
        )

        whenever(clubRepository.findById(testClubId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            locationService.createLocation(command)
        }

        verify(locationRepository, never()).save(any<Location>())
    }

    @Test
    fun `getLocation should return location when found`() {
        // Given
        val testLocation = createTestLocation()
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)

        // When
        val result = locationService.getLocation(testLocation.id)

        // Then
        assertEquals(testLocation.id, result.id)
        assertEquals(testLocation.name.en, result.name.en)
    }

    @Test
    fun `getLocation should throw when location not found`() {
        // Given
        val locationId = UUID.randomUUID()
        whenever(locationRepository.findById(locationId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            locationService.getLocation(locationId)
        }
    }

    @Test
    fun `getLocationsByClub should return paginated locations`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val locations = listOf(createTestLocation(), createTestLocation())
        val page = PageImpl(locations, pageable, locations.size.toLong())

        whenever(locationRepository.findByClubId(testClubId, pageable)) doReturn page

        // When
        val result = locationService.getLocationsByClub(testClubId, pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `temporarilyCloseLocation should change status from ACTIVE to TEMPORARILY_CLOSED`() {
        // Given
        val testLocation = createTestLocation(status = LocationStatus.ACTIVE)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(locationRepository.save(any<Location>())) doReturn testLocation

        // When
        val result = locationService.temporarilyCloseLocation(testLocation.id)

        // Then
        assertEquals(LocationStatus.TEMPORARILY_CLOSED, result.status)
    }

    @Test
    fun `reopenLocation should change status from TEMPORARILY_CLOSED to ACTIVE`() {
        // Given
        val testLocation = createTestLocation(status = LocationStatus.TEMPORARILY_CLOSED)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(locationRepository.save(any<Location>())) doReturn testLocation

        // When
        val result = locationService.reopenLocation(testLocation.id)

        // Then
        assertEquals(LocationStatus.ACTIVE, result.status)
    }

    @Test
    fun `permanentlyCloseLocation should change status to PERMANENTLY_CLOSED`() {
        // Given
        val testLocation = createTestLocation(status = LocationStatus.ACTIVE)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)
        whenever(locationRepository.save(any<Location>())) doReturn testLocation

        // When
        val result = locationService.permanentlyCloseLocation(testLocation.id)

        // Then
        assertEquals(LocationStatus.PERMANENTLY_CLOSED, result.status)
    }

    @Test
    fun `deleteLocation should delete only PERMANENTLY_CLOSED locations`() {
        // Given
        val testLocation = createTestLocation(status = LocationStatus.PERMANENTLY_CLOSED)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)

        // When
        locationService.deleteLocation(testLocation.id)

        // Then
        verify(locationRepository).deleteById(testLocation.id)
    }

    @Test
    fun `deleteLocation should throw when location not PERMANENTLY_CLOSED`() {
        // Given
        val testLocation = createTestLocation(status = LocationStatus.ACTIVE)
        whenever(locationRepository.findById(testLocation.id)) doReturn Optional.of(testLocation)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            locationService.deleteLocation(testLocation.id)
        }

        verify(locationRepository, never()).deleteById(any())
    }

    private fun createTestClub(
        id: UUID = testClubId,
        organizationId: UUID = testOrganizationId,
        name: LocalizedText = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
        status: ClubStatus = ClubStatus.ACTIVE
    ) = Club(
        id = id,
        organizationId = organizationId,
        name = name,
        status = status
    )

    private fun createTestLocation(
        id: UUID = UUID.randomUUID(),
        clubId: UUID = testClubId,
        name: LocalizedText = LocalizedText(en = "Test Location", ar = "موقع اختبار"),
        status: LocationStatus = LocationStatus.ACTIVE
    ) = Location(
        id = id,
        clubId = clubId,
        name = name,
        status = status
    )
}
