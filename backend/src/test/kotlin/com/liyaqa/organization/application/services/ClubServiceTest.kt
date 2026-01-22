package com.liyaqa.organization.application.services

import com.liyaqa.organization.application.commands.CreateClubCommand
import com.liyaqa.organization.application.commands.UpdateClubCommand
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
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
class ClubServiceTest {

    @Mock
    private lateinit var clubRepository: ClubRepository

    @Mock
    private lateinit var organizationRepository: OrganizationRepository

    private lateinit var clubService: ClubService

    private val testOrganizationId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        clubService = ClubService(clubRepository, organizationRepository)
    }

    @Test
    fun `createClub should create club when organization exists`() {
        // Given
        val command = CreateClubCommand(
            organizationId = testOrganizationId,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار")
        )

        whenever(organizationRepository.existsById(testOrganizationId)) doReturn true
        whenever(clubRepository.save(any<Club>())) doReturn createTestClub()

        // When
        val result = clubService.createClub(command)

        // Then
        assertNotNull(result)
        verify(clubRepository).save(any<Club>())
    }

    @Test
    fun `createClub should throw when organization not found`() {
        // Given
        val command = CreateClubCommand(
            organizationId = testOrganizationId,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار")
        )

        whenever(organizationRepository.existsById(testOrganizationId)) doReturn false

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            clubService.createClub(command)
        }

        verify(clubRepository, never()).save(any<Club>())
    }

    @Test
    fun `getClub should return club when found`() {
        // Given
        val testClub = createTestClub()
        whenever(clubRepository.findById(testClub.id)) doReturn Optional.of(testClub)

        // When
        val result = clubService.getClub(testClub.id)

        // Then
        assertEquals(testClub.id, result.id)
        assertEquals(testClub.name.en, result.name.en)
    }

    @Test
    fun `getClub should throw when club not found`() {
        // Given
        val clubId = UUID.randomUUID()
        whenever(clubRepository.findById(clubId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            clubService.getClub(clubId)
        }
    }

    @Test
    fun `getClubsByOrganization should return paginated clubs`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val clubs = listOf(createTestClub(), createTestClub())
        val page = PageImpl(clubs, pageable, clubs.size.toLong())

        whenever(clubRepository.findByOrganizationId(testOrganizationId, pageable)) doReturn page

        // When
        val result = clubService.getClubsByOrganization(testOrganizationId, pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `activateClub should change status from SUSPENDED to ACTIVE`() {
        // Given
        val testClub = createTestClub(status = ClubStatus.SUSPENDED)
        whenever(clubRepository.findById(testClub.id)) doReturn Optional.of(testClub)
        whenever(clubRepository.save(any<Club>())) doReturn testClub

        // When
        val result = clubService.activateClub(testClub.id)

        // Then
        assertEquals(ClubStatus.ACTIVE, result.status)
    }

    @Test
    fun `suspendClub should change status from ACTIVE to SUSPENDED`() {
        // Given
        val testClub = createTestClub(status = ClubStatus.ACTIVE)
        whenever(clubRepository.findById(testClub.id)) doReturn Optional.of(testClub)
        whenever(clubRepository.save(any<Club>())) doReturn testClub

        // When
        val result = clubService.suspendClub(testClub.id)

        // Then
        assertEquals(ClubStatus.SUSPENDED, result.status)
    }

    @Test
    fun `closeClub should change status to CLOSED`() {
        // Given
        val testClub = createTestClub(status = ClubStatus.ACTIVE)
        whenever(clubRepository.findById(testClub.id)) doReturn Optional.of(testClub)
        whenever(clubRepository.save(any<Club>())) doReturn testClub

        // When
        val result = clubService.closeClub(testClub.id)

        // Then
        assertEquals(ClubStatus.CLOSED, result.status)
    }

    @Test
    fun `deleteClub should delete only CLOSED clubs`() {
        // Given
        val testClub = createTestClub(status = ClubStatus.CLOSED)
        whenever(clubRepository.findById(testClub.id)) doReturn Optional.of(testClub)

        // When
        clubService.deleteClub(testClub.id)

        // Then
        verify(clubRepository).deleteById(testClub.id)
    }

    @Test
    fun `deleteClub should throw when club not CLOSED`() {
        // Given
        val testClub = createTestClub(status = ClubStatus.ACTIVE)
        whenever(clubRepository.findById(testClub.id)) doReturn Optional.of(testClub)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            clubService.deleteClub(testClub.id)
        }

        verify(clubRepository, never()).deleteById(any())
    }

    private fun createTestClub(
        id: UUID = UUID.randomUUID(),
        organizationId: UUID = testOrganizationId,
        name: LocalizedText = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
        status: ClubStatus = ClubStatus.ACTIVE
    ) = Club(
        id = id,
        organizationId = organizationId,
        name = name,
        status = status
    )
}
