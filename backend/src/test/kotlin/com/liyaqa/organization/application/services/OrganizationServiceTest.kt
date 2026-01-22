package com.liyaqa.organization.application.services

import com.liyaqa.organization.application.commands.CreateOrganizationCommand
import com.liyaqa.organization.application.commands.UpdateOrganizationCommand
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
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
class OrganizationServiceTest {

    @Mock
    private lateinit var organizationRepository: OrganizationRepository

    private lateinit var organizationService: OrganizationService

    @BeforeEach
    fun setUp() {
        organizationService = OrganizationService(organizationRepository)
    }

    @Test
    fun `createOrganization should create organization with PENDING status`() {
        // Given
        val command = CreateOrganizationCommand(
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC
        )

        whenever(organizationRepository.save(any<Organization>())) doReturn createTestOrganization()

        // When
        val result = organizationService.createOrganization(command)

        // Then
        assertNotNull(result)
        verify(organizationRepository).save(any<Organization>())
    }

    @Test
    fun `getOrganization should return organization when found`() {
        // Given
        val testOrg = createTestOrganization()
        whenever(organizationRepository.findById(testOrg.id)) doReturn Optional.of(testOrg)

        // When
        val result = organizationService.getOrganization(testOrg.id)

        // Then
        assertEquals(testOrg.id, result.id)
        assertEquals(testOrg.name.en, result.name.en)
    }

    @Test
    fun `getOrganization should throw when organization not found`() {
        // Given
        val orgId = UUID.randomUUID()
        whenever(organizationRepository.findById(orgId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            organizationService.getOrganization(orgId)
        }
    }

    @Test
    fun `getAllOrganizations should return paginated organizations`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val organizations = listOf(createTestOrganization(), createTestOrganization())
        val page = PageImpl(organizations, pageable, organizations.size.toLong())

        whenever(organizationRepository.findAll(pageable)) doReturn page

        // When
        val result = organizationService.getAllOrganizations(pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `activateOrganization should change status from PENDING to ACTIVE`() {
        // Given
        val testOrg = createTestOrganization(status = OrganizationStatus.PENDING)
        whenever(organizationRepository.findById(testOrg.id)) doReturn Optional.of(testOrg)
        whenever(organizationRepository.save(any<Organization>())) doReturn testOrg

        // When
        val result = organizationService.activateOrganization(testOrg.id)

        // Then
        assertEquals(OrganizationStatus.ACTIVE, result.status)
        verify(organizationRepository).save(testOrg)
    }

    @Test
    fun `suspendOrganization should change status from ACTIVE to SUSPENDED`() {
        // Given
        val testOrg = createTestOrganization(status = OrganizationStatus.ACTIVE)
        whenever(organizationRepository.findById(testOrg.id)) doReturn Optional.of(testOrg)
        whenever(organizationRepository.save(any<Organization>())) doReturn testOrg

        // When
        val result = organizationService.suspendOrganization(testOrg.id)

        // Then
        assertEquals(OrganizationStatus.SUSPENDED, result.status)
    }

    @Test
    fun `closeOrganization should change status to CLOSED`() {
        // Given
        val testOrg = createTestOrganization(status = OrganizationStatus.ACTIVE)
        whenever(organizationRepository.findById(testOrg.id)) doReturn Optional.of(testOrg)
        whenever(organizationRepository.save(any<Organization>())) doReturn testOrg

        // When
        val result = organizationService.closeOrganization(testOrg.id)

        // Then
        assertEquals(OrganizationStatus.CLOSED, result.status)
    }

    @Test
    fun `deleteOrganization should delete only CLOSED organizations`() {
        // Given
        val testOrg = createTestOrganization(status = OrganizationStatus.CLOSED)
        whenever(organizationRepository.findById(testOrg.id)) doReturn Optional.of(testOrg)

        // When
        organizationService.deleteOrganization(testOrg.id)

        // Then
        verify(organizationRepository).deleteById(testOrg.id)
    }

    @Test
    fun `deleteOrganization should throw when organization not CLOSED`() {
        // Given
        val testOrg = createTestOrganization(status = OrganizationStatus.ACTIVE)
        whenever(organizationRepository.findById(testOrg.id)) doReturn Optional.of(testOrg)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            organizationService.deleteOrganization(testOrg.id)
        }

        verify(organizationRepository, never()).deleteById(any())
    }

    private fun createTestOrganization(
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Test Organization", ar = "منظمة اختبار"),
        status: OrganizationStatus = OrganizationStatus.PENDING
    ) = Organization(
        id = id,
        name = name,
        organizationType = OrganizationType.LLC,
        status = status
    )
}
