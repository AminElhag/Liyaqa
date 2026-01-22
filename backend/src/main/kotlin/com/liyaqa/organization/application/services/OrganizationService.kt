package com.liyaqa.organization.application.services

import com.liyaqa.organization.application.commands.CreateOrganizationCommand
import com.liyaqa.organization.application.commands.UpdateOrganizationCommand
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.ZatcaInfo
import com.liyaqa.organization.domain.ports.OrganizationRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class OrganizationService(
    private val organizationRepository: OrganizationRepository
) {
    fun createOrganization(command: CreateOrganizationCommand): Organization {
        val zatcaInfo = if (command.vatRegistrationNumber != null ||
            command.commercialRegistrationNumber != null ||
            command.zatcaAddress != null
        ) {
            ZatcaInfo(
                vatRegistrationNumber = command.vatRegistrationNumber,
                commercialRegistrationNumber = command.commercialRegistrationNumber,
                address = command.zatcaAddress
            )
        } else null

        val organization = Organization(
            name = command.name,
            tradeName = command.tradeName,
            organizationType = command.organizationType,
            email = command.email,
            phone = command.phone,
            website = command.website,
            zatcaInfo = zatcaInfo,
            status = OrganizationStatus.PENDING
        )

        return organizationRepository.save(organization)
    }

    @Transactional(readOnly = true)
    fun getOrganization(id: UUID): Organization {
        return organizationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Organization not found with id: $id") }
    }

    @Transactional(readOnly = true)
    fun getAllOrganizations(pageable: Pageable): Page<Organization> {
        return organizationRepository.findAll(pageable)
    }

    @Transactional(readOnly = true)
    fun getOrganizationsByStatus(status: OrganizationStatus, pageable: Pageable): Page<Organization> {
        return organizationRepository.findByStatus(status, pageable)
    }

    fun updateOrganization(id: UUID, command: UpdateOrganizationCommand): Organization {
        val org = getOrganization(id)

        command.name?.let { org.name = it }
        command.tradeName?.let { org.tradeName = it }
        command.organizationType?.let { org.organizationType = it }
        command.email?.let { org.email = it }
        command.phone?.let { org.phone = it }
        command.website?.let { org.website = it }

        if (command.vatRegistrationNumber != null ||
            command.commercialRegistrationNumber != null ||
            command.zatcaAddress != null
        ) {
            org.updateZatcaInfo(
                ZatcaInfo(
                    vatRegistrationNumber = command.vatRegistrationNumber
                        ?: org.zatcaInfo?.vatRegistrationNumber,
                    commercialRegistrationNumber = command.commercialRegistrationNumber
                        ?: org.zatcaInfo?.commercialRegistrationNumber,
                    address = command.zatcaAddress ?: org.zatcaInfo?.address
                )
            )
        }

        return organizationRepository.save(org)
    }

    fun activateOrganization(id: UUID): Organization {
        val org = getOrganization(id)
        org.activate()
        return organizationRepository.save(org)
    }

    fun suspendOrganization(id: UUID): Organization {
        val org = getOrganization(id)
        org.suspend()
        return organizationRepository.save(org)
    }

    fun closeOrganization(id: UUID): Organization {
        val org = getOrganization(id)
        org.close()
        return organizationRepository.save(org)
    }

    /**
     * Deletes an organization.
     * Only CLOSED organizations with no clubs can be deleted.
     */
    fun deleteOrganization(id: UUID) {
        val org = getOrganization(id)
        require(org.status == OrganizationStatus.CLOSED) {
            "Only CLOSED organizations can be deleted. Current status: ${org.status}"
        }
        organizationRepository.deleteById(id)
    }
}