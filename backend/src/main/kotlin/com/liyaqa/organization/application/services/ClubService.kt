package com.liyaqa.organization.application.services

import com.liyaqa.organization.application.commands.CreateClubCommand
import com.liyaqa.organization.application.commands.UpdateClubCommand
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ClubService(
    private val clubRepository: ClubRepository,
    private val organizationRepository: OrganizationRepository
) {
    fun createClub(command: CreateClubCommand): Club {
        require(organizationRepository.existsById(command.organizationId)) {
            "Organization not found with id: ${command.organizationId}"
        }

        val club = Club(
            organizationId = command.organizationId,
            name = command.name,
            description = command.description
        )

        return clubRepository.save(club)
    }

    @Transactional(readOnly = true)
    fun getClub(id: UUID): Club {
        return clubRepository.findById(id)
            .orElseThrow { NoSuchElementException("Club not found with id: $id") }
    }

    @Transactional(readOnly = true)
    fun getClubsByOrganization(organizationId: UUID, pageable: Pageable): Page<Club> {
        return clubRepository.findByOrganizationId(organizationId, pageable)
    }

    @Transactional(readOnly = true)
    fun getClubsByOrganizationAndStatus(
        organizationId: UUID,
        status: ClubStatus,
        pageable: Pageable
    ): Page<Club> {
        return clubRepository.findByOrganizationIdAndStatus(organizationId, status, pageable)
    }

    fun updateClub(id: UUID, command: UpdateClubCommand): Club {
        val club = getClub(id)

        command.name?.let { club.name = it }
        command.description?.let { club.description = it }

        return clubRepository.save(club)
    }

    fun activateClub(id: UUID): Club {
        val club = getClub(id)
        club.activate()
        return clubRepository.save(club)
    }

    fun suspendClub(id: UUID): Club {
        val club = getClub(id)
        club.suspend()
        return clubRepository.save(club)
    }

    fun closeClub(id: UUID): Club {
        val club = getClub(id)
        club.close()
        return clubRepository.save(club)
    }
}