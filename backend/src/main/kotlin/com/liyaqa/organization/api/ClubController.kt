package com.liyaqa.organization.api

import com.liyaqa.organization.application.commands.CreateClubCommand
import com.liyaqa.organization.application.commands.UpdateClubCommand
import com.liyaqa.organization.application.services.ClubService
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
@RequestMapping("/api/clubs")
class ClubController(
    private val clubService: ClubService
) {
    @PostMapping
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
    fun getClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.getClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @GetMapping("/organization/{organizationId}")
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
    fun activateClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.activateClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @PostMapping("/{id}/suspend")
    fun suspendClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.suspendClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }

    @PostMapping("/{id}/close")
    fun closeClub(@PathVariable id: UUID): ResponseEntity<ClubResponse> {
        val club = clubService.closeClub(id)
        return ResponseEntity.ok(ClubResponse.from(club))
    }
}