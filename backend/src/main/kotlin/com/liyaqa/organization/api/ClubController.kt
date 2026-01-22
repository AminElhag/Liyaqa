package com.liyaqa.organization.api

import com.liyaqa.organization.application.commands.CreateClubCommand
import com.liyaqa.organization.application.commands.UpdateClubCommand
import com.liyaqa.organization.application.services.ClubService
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/clubs")
class ClubController(
    private val clubService: ClubService
) {
    @PostMapping
    @PreAuthorize("hasAuthority('clubs_create')")
    fun createClub(
        @Valid @RequestBody request: CreateClubRequest
    ): ResponseEntity<ClubResponse> {
        val command = CreateClubCommand(
            organizationId = request.organizationId,
            name = LocalizedText(request.nameEn, request.nameAr),
            description = request.descriptionEn?.let { LocalizedText(it, request.descriptionAr) }
        )
        val club = clubService.createClub(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(ClubResponse.from(club))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('clubs_view')")
    fun getClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.getClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAuthority('clubs_view')")
    fun getClubsByOrganization(
        @PathVariable organizationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ClubResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val clubPage = clubService.getClubsByOrganization(organizationId, pageable)

        val response = PageResponse(
            content = clubPage.content.map { ClubResponse.from(it) },
            page = clubPage.number,
            size = clubPage.size,
            totalElements = clubPage.totalElements,
            totalPages = clubPage.totalPages,
            first = clubPage.isFirst,
            last = clubPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('clubs_update')")
    fun updateClub(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClubRequest
    ): ResponseEntity<ClubResponse> {
        val command = UpdateClubCommand(
            name = request.nameEn?.let { LocalizedText(it, request.nameAr) },
            description = request.descriptionEn?.let { LocalizedText(it, request.descriptionAr) }
        )
        val club = clubService.updateClub(id, command)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('clubs_update')")
    fun activateClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.activateClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('clubs_update')")
    fun suspendClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.suspendClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('clubs_update')")
    fun closeClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.closeClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('clubs_delete')")
    fun deleteClub(@PathVariable id: UUID): ResponseEntity<Unit> {
        clubService.deleteClub(id)
        return ResponseEntity.noContent().build()
    }

    @Operation(
        summary = "Update Club Slug",
        description = "Updates the subdomain slug for a club (e.g., 'fitness-gym' for fitness-gym.liyaqa.com). " +
                "Warning: Changing the slug will change the login URL for all users of this club."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Slug updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid slug format or slug already in use"),
        ApiResponse(responseCode = "404", description = "Club not found")
    ])
    @PatchMapping("/{id}/slug")
    @PreAuthorize("hasAuthority('clubs_update')")
    fun updateSlug(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSlugRequest
    ): ResponseEntity<ClubResponse> {
        val club = clubService.updateSlug(id, request.slug)
        return ResponseEntity.ok(ClubResponse.from(club))
    }
}