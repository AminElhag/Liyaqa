package com.liyaqa.trainer.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.trainer.application.services.TrainerClientService
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerClientRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for trainer client management.
 *
 * Endpoints:
 * - List clients with pagination and filtering
 * - Get client details
 * - Update client information (goals, notes, status)
 */
@RestController
@RequestMapping("/api/trainer-portal/clients")
@Tag(name = "Trainer Portal - Clients", description = "Trainer client management")
class TrainerClientController(
    private val trainerClientService: TrainerClientService,
    private val trainerClientRepository: JpaTrainerClientRepository,
    private val memberRepository: MemberRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(TrainerClientController::class.java)

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "List trainer clients", description = "Get paginated list of trainer's clients with optional filtering")
    fun getClients(
        @RequestParam trainerId: UUID,
        @RequestParam(required = false) status: TrainerClientStatus?,
        @RequestParam(required = false) search: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "startDate") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<TrainerClientResponse>> {
        logger.debug("Fetching clients for trainer $trainerId (status: $status, search: $search, page: $page)")

        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val clientPage = if (status != null) {
            trainerClientService.getClientsForTrainerByStatus(trainerId, status, pageable)
        } else {
            trainerClientService.getClientsForTrainer(trainerId, pageable)
        }

        // Enrich with member details
        val responses = clientPage.content.map { client ->
            val member = memberRepository.findById(client.memberId).orElse(null)
            val user = member?.userId?.let { userRepository.findById(it).orElse(null) }

            TrainerClientResponse.from(
                client = client,
                memberName = user?.displayName?.get("en") ?: "${member?.firstName?.get("en")} ${member?.lastName?.get("en")}",
                memberEmail = user?.email ?: member?.email,
                memberPhone = member?.phone
            )
        }

        val response = PageResponse(
            content = responses,
            page = clientPage.number,
            size = clientPage.size,
            totalElements = clientPage.totalElements,
            totalPages = clientPage.totalPages,
            first = clientPage.isFirst,
            last = clientPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_view')")
    @Operation(summary = "Get client details", description = "Get detailed information about a specific trainer-client relationship")
    fun getClient(@PathVariable id: UUID): ResponseEntity<TrainerClientResponse> {
        logger.debug("Fetching client $id")

        val client = trainerClientService.getClient(id)
        val member = memberRepository.findById(client.memberId).orElse(null)
        val user = member?.userId?.let { userRepository.findById(it).orElse(null) }

        val response = TrainerClientResponse.from(
            client = client,
            memberName = user?.displayName?.get("en") ?: "${member?.firstName?.get("en")} ${member?.lastName?.get("en")}",
            memberEmail = user?.email ?: member?.email,
            memberPhone = member?.phone
        )

        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_update')")
    @Operation(summary = "Update client information", description = "Update client goals, notes, or status")
    fun updateClient(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTrainerClientRequest
    ): ResponseEntity<TrainerClientResponse> {
        logger.debug("Updating client $id")

        val client = trainerClientService.getClient(id)

        // Update mutable fields
        request.goalsEn?.let { client.goalsEn = it }
        request.goalsAr?.let { client.goalsAr = it }
        request.notesEn?.let { client.notesEn = it }
        request.notesAr?.let { client.notesAr = it }
        request.status?.let { newStatus ->
            when (newStatus) {
                TrainerClientStatus.ACTIVE -> client.reactivate()
                TrainerClientStatus.INACTIVE -> client.deactivate()
                TrainerClientStatus.ON_HOLD -> client.putOnHold()
                TrainerClientStatus.COMPLETED -> client.complete()
            }
        }

        val updated = trainerClientRepository.save(client)

        // Enrich response with member details
        val member = memberRepository.findById(updated.memberId).orElse(null)
        val user = member?.userId?.let { userRepository.findById(it).orElse(null) }

        val response = TrainerClientResponse.from(
            client = updated,
            memberName = user?.displayName?.get("en") ?: "${member?.firstName?.get("en")} ${member?.lastName?.get("en")}",
            memberEmail = user?.email ?: member?.email,
            memberPhone = member?.phone
        )

        logger.info("Updated client $id")
        return ResponseEntity.ok(response)
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isOwnProfile(#trainerId)")
    @Operation(summary = "Get client statistics", description = "Get statistics about trainer's clients")
    fun getClientStats(@RequestParam trainerId: UUID): ResponseEntity<Map<String, Any>> {
        logger.debug("Fetching client stats for trainer $trainerId")

        val allClients = trainerClientService.getClientsForTrainer(trainerId, PageRequest.of(0, 1000)).content

        val stats = mapOf(
            "total" to allClients.size,
            "active" to allClients.count { it.status == TrainerClientStatus.ACTIVE },
            "onHold" to allClients.count { it.status == TrainerClientStatus.ON_HOLD },
            "completed" to allClients.count { it.status == TrainerClientStatus.COMPLETED },
            "inactive" to allClients.count { it.status == TrainerClientStatus.INACTIVE }
        )

        return ResponseEntity.ok(stats)
    }
}
