package com.liyaqa.platform.api

import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.platform.api.dto.ClientClubResponse
import com.liyaqa.platform.api.dto.ClientHealthResponse
import com.liyaqa.platform.api.dto.ClientResponse
import com.liyaqa.platform.api.dto.ClientStatsResponse
import com.liyaqa.platform.api.dto.CreateClientClubRequest
import com.liyaqa.platform.api.dto.LocalizedTextResponse
import com.liyaqa.platform.api.dto.OnboardClientRequest
import com.liyaqa.platform.api.dto.OnboardingResultResponse
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.AdminUserResponse
import com.liyaqa.platform.api.dto.SetupAdminRequest
import com.liyaqa.platform.application.services.ClientHealthService
import com.liyaqa.platform.application.services.ClientOnboardingService
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Controller for managing clients (organizations).
 * Accessible by platform users (internal Liyaqa team) only.
 *
 * Endpoints:
 * - GET    /api/platform/clients                - List all clients
 * - GET    /api/platform/clients/stats          - Get client statistics
 * - GET    /api/platform/clients/{id}           - Get client details
 * - POST   /api/platform/clients                - Onboard new client
 * - POST   /api/platform/clients/{id}/activate  - Activate client
 * - POST   /api/platform/clients/{id}/suspend   - Suspend client
 * - POST   /api/platform/clients/{id}/setup-admin - Setup admin user
 * - GET    /api/platform/clients/{id}/clubs     - List client's clubs
 * - POST   /api/platform/clients/{id}/clubs     - Create club for client
 */
@RestController
@RequestMapping("/api/platform/clients")
@PlatformSecured
@Tag(name = "Client Management", description = "Manage client organizations, onboarding, and clubs")
class ClientController(
    private val onboardingService: ClientOnboardingService,
    private val healthService: ClientHealthService
) {
    /**
     * Onboards a new client (creates organization, club, admin user, and optionally subscription).
     * Only PLATFORM_ADMIN and SALES_REP can onboard clients.
     */
    @PostMapping
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    @Operation(summary = "Onboard new client", description = "Creates organization, club, admin user, and optionally subscription")
    @ApiResponse(responseCode = "201", description = "Client onboarded successfully")
    fun onboardClient(
        @Valid @RequestBody request: OnboardClientRequest
    ): ResponseEntity<OnboardingResultResponse> {
        val result = onboardingService.onboardClient(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(OnboardingResultResponse.from(result))
    }

    /**
     * Gets a client by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get client by ID", description = "Retrieves client organization details")
    @ApiResponses(ApiResponse(responseCode = "200", description = "Client found"), ApiResponse(responseCode = "404", description = "Client not found"))
    fun getClient(@PathVariable id: UUID): ResponseEntity<ClientResponse> {
        val client = onboardingService.getClient(id)
        return ResponseEntity.ok(ClientResponse.from(client))
    }

    /**
     * Lists all clients with pagination.
     */
    @GetMapping
    @Operation(summary = "List all clients", description = "Lists all client organizations with pagination and optional status filter")
    fun getAllClients(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String,
        @RequestParam(required = false) status: OrganizationStatus?
    ): ResponseEntity<PageResponse<ClientResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val clientsPage = if (status != null) {
            onboardingService.getClientsByStatus(status, pageable)
        } else {
            onboardingService.getClients(pageable)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = clientsPage.content.map { ClientResponse.from(it) },
                page = clientsPage.number,
                size = clientsPage.size,
                totalElements = clientsPage.totalElements,
                totalPages = clientsPage.totalPages,
                first = clientsPage.isFirst,
                last = clientsPage.isLast
            )
        )
    }

    /**
     * Gets client statistics.
     */
    @GetMapping("/stats")
    @Operation(summary = "Get client statistics", description = "Returns aggregated client statistics")
    fun getClientStats(): ResponseEntity<ClientStatsResponse> {
        val stats = onboardingService.getClientStats()
        return ResponseEntity.ok(ClientStatsResponse.from(stats))
    }

    /**
     * Activates a client.
     * Only PLATFORM_ADMIN can activate clients.
     */
    @PostMapping("/{id}/activate")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    @Operation(summary = "Activate client", description = "Activates a client organization")
    @ApiResponses(ApiResponse(responseCode = "200", description = "Client activated"), ApiResponse(responseCode = "404", description = "Client not found"))
    fun activateClient(@PathVariable id: UUID): ResponseEntity<ClientResponse> {
        val client = onboardingService.activateClient(id)
        return ResponseEntity.ok(ClientResponse.from(client))
    }

    /**
     * Suspends a client.
     * Only PLATFORM_ADMIN can suspend clients.
     */
    @PostMapping("/{id}/suspend")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    @Operation(summary = "Suspend client", description = "Suspends a client organization")
    @ApiResponses(ApiResponse(responseCode = "200", description = "Client suspended"), ApiResponse(responseCode = "404", description = "Client not found"))
    fun suspendClient(@PathVariable id: UUID): ResponseEntity<ClientResponse> {
        val client = onboardingService.suspendClient(id)
        return ResponseEntity.ok(ClientResponse.from(client))
    }

    /**
     * Sets up an admin user for a client.
     * Only PLATFORM_ADMIN and SALES_REP can setup admins.
     */
    @PostMapping("/{id}/setup-admin")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    @Operation(summary = "Setup admin user", description = "Creates an admin user for a client organization")
    @ApiResponse(responseCode = "201", description = "Admin user created")
    fun setupAdmin(
        @PathVariable id: UUID,
        @Valid @RequestBody request: SetupAdminRequest
    ): ResponseEntity<AdminUserResponse> {
        val user = onboardingService.setupAdmin(request.toCommand(id))
        return ResponseEntity.status(HttpStatus.CREATED).body(
            AdminUserResponse(
                id = user.id,
                email = user.email,
                displayName = LocalizedTextResponse.from(user.displayName),
                createdAt = user.createdAt
            )
        )
    }

    /**
     * Gets clubs for a client.
     */
    @GetMapping("/{id}/clubs")
    @Operation(summary = "List client clubs", description = "Lists clubs belonging to a client organization")
    fun getClientClubs(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClientClubResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"))
        val clubsPage = onboardingService.getClientClubs(id, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = clubsPage.content.map { ClientClubResponse.from(it) },
                page = clubsPage.number,
                size = clubsPage.size,
                totalElements = clubsPage.totalElements,
                totalPages = clubsPage.totalPages,
                first = clubsPage.isFirst,
                last = clubsPage.isLast
            )
        )
    }

    /**
     * Creates a new club for a client.
     * Only PLATFORM_ADMIN and SALES_REP can create clubs.
     */
    @PostMapping("/{id}/clubs")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    @Operation(summary = "Create club for client", description = "Creates a new club under a client organization")
    @ApiResponse(responseCode = "201", description = "Club created")
    fun createClientClub(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateClientClubRequest
    ): ResponseEntity<ClientClubResponse> {
        val name = LocalizedText(en = request.nameEn, ar = request.nameAr)
        val description = if (request.descriptionEn != null) {
            LocalizedText(en = request.descriptionEn, ar = request.descriptionAr)
        } else null

        val club = onboardingService.createClubForClient(id, name, description)
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientClubResponse.from(club))
    }

    /**
     * Gets health indicators for a client.
     * Provides metrics for monitoring client status and engagement.
     */
    @GetMapping("/{id}/health")
    @Operation(summary = "Get client health", description = "Get health indicators for a client organization")
    fun getClientHealth(@PathVariable id: UUID): ResponseEntity<ClientHealthResponse> {
        val health = healthService.getClientHealth(id)
        return ResponseEntity.ok(health)
    }
}
