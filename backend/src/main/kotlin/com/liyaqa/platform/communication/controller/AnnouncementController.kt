package com.liyaqa.platform.communication.controller

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.communication.dto.AnnouncementResponse
import com.liyaqa.platform.communication.dto.CreateAnnouncementRequest
import com.liyaqa.platform.communication.dto.ScheduleAnnouncementRequest
import com.liyaqa.platform.communication.dto.UpdateAnnouncementRequest
import com.liyaqa.platform.communication.service.AnnouncementService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/announcements")
@PlatformSecured
@Tag(name = "Platform Announcements", description = "Announcement management for platform operators")
class AnnouncementController(
    private val announcementService: AnnouncementService
) {

    @Operation(summary = "Create a draft announcement")
    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_CREATE])
    fun createAnnouncement(
        @Valid @RequestBody request: CreateAnnouncementRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<AnnouncementResponse> {
        val announcement = announcementService.createAnnouncement(request.toCommand(), principal.userId)
        return ResponseEntity.ok(AnnouncementResponse.from(announcement))
    }

    @Operation(summary = "Update a draft announcement")
    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_MANAGE])
    fun updateAnnouncement(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateAnnouncementRequest
    ): ResponseEntity<AnnouncementResponse> {
        val announcement = announcementService.updateAnnouncement(id, request.toCommand())
        return ResponseEntity.ok(AnnouncementResponse.from(announcement))
    }

    @Operation(summary = "Publish an announcement")
    @PostMapping("/{id}/publish")
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_MANAGE])
    fun publishAnnouncement(@PathVariable id: UUID): ResponseEntity<AnnouncementResponse> {
        val announcement = announcementService.publishAnnouncement(id)
        return ResponseEntity.ok(AnnouncementResponse.from(announcement))
    }

    @Operation(summary = "Schedule an announcement")
    @PostMapping("/{id}/schedule")
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_MANAGE])
    fun scheduleAnnouncement(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ScheduleAnnouncementRequest
    ): ResponseEntity<AnnouncementResponse> {
        val announcement = announcementService.scheduleAnnouncement(id, request.scheduledAt)
        return ResponseEntity.ok(AnnouncementResponse.from(announcement))
    }

    @Operation(summary = "Archive an announcement")
    @PostMapping("/{id}/archive")
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_MANAGE])
    fun archiveAnnouncement(@PathVariable id: UUID): ResponseEntity<AnnouncementResponse> {
        val announcement = announcementService.archiveAnnouncement(id)
        return ResponseEntity.ok(AnnouncementResponse.from(announcement))
    }

    @Operation(summary = "Get announcement details")
    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_VIEW])
    fun getAnnouncement(@PathVariable id: UUID): ResponseEntity<AnnouncementResponse> {
        val announcement = announcementService.getAnnouncement(id)
        return ResponseEntity.ok(AnnouncementResponse.from(announcement))
    }

    @Operation(summary = "List all announcements")
    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_VIEW])
    fun listAnnouncements(pageable: Pageable): ResponseEntity<PageResponse<AnnouncementResponse>> {
        val page = announcementService.listAnnouncements(pageable)
        return ResponseEntity.ok(PageResponse.from(page) { AnnouncementResponse.from(it) })
    }

    @Operation(summary = "List published announcements")
    @GetMapping("/active")
    @PlatformSecured(permissions = [PlatformPermission.ANNOUNCEMENTS_VIEW])
    fun getActiveAnnouncements(pageable: Pageable): ResponseEntity<PageResponse<AnnouncementResponse>> {
        val page = announcementService.getActiveAnnouncements(pageable)
        return ResponseEntity.ok(PageResponse.from(page) { AnnouncementResponse.from(it) })
    }
}
