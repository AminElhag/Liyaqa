package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.services.GxSettingsService
import com.liyaqa.scheduling.application.services.RoomLayoutService
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
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
@RequestMapping("/api/gx")
class GxController(
    private val gxSettingsService: GxSettingsService,
    private val roomLayoutService: RoomLayoutService
) {

    // ==================== GX SETTINGS ====================

    @GetMapping("/settings")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getGxSettings(): ResponseEntity<GxSettingsResponse> {
        val settings = gxSettingsService.getSettings()
        return ResponseEntity.ok(GxSettingsResponse.from(settings))
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAuthority('classes_create')")
    fun updateGxSettings(
        @Valid @RequestBody request: UpdateGxSettingsRequest
    ): ResponseEntity<GxSettingsResponse> {
        val settings = gxSettingsService.updateSettings(request.toCommand())
        return ResponseEntity.ok(GxSettingsResponse.from(settings))
    }

    // ==================== ROOM LAYOUTS ====================

    @PostMapping("/room-layouts")
    @PreAuthorize("hasAuthority('classes_create')")
    fun createRoomLayout(
        @Valid @RequestBody request: CreateRoomLayoutRequest
    ): ResponseEntity<RoomLayoutResponse> {
        val layout = roomLayoutService.createLayout(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(RoomLayoutResponse.from(layout))
    }

    @GetMapping("/room-layouts/{id}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getRoomLayout(@PathVariable id: UUID): ResponseEntity<RoomLayoutResponse> {
        val layout = roomLayoutService.getLayout(id)
        return ResponseEntity.ok(RoomLayoutResponse.from(layout))
    }

    @GetMapping("/room-layouts")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getRoomLayouts(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<RoomLayoutResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("createdAt").descending())
        val layoutsPage = roomLayoutService.getLayouts(pageable)
        return ResponseEntity.ok(
            PageResponse(
                content = layoutsPage.content.map { RoomLayoutResponse.from(it) },
                page = layoutsPage.number,
                size = layoutsPage.size,
                totalElements = layoutsPage.totalElements,
                totalPages = layoutsPage.totalPages,
                first = layoutsPage.isFirst,
                last = layoutsPage.isLast
            )
        )
    }

    @GetMapping("/room-layouts/active")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getActiveRoomLayouts(): ResponseEntity<List<RoomLayoutResponse>> {
        val layouts = roomLayoutService.getActiveLayouts()
        return ResponseEntity.ok(layouts.map { RoomLayoutResponse.from(it) })
    }

    @PutMapping("/room-layouts/{id}")
    @PreAuthorize("hasAuthority('classes_create')")
    fun updateRoomLayout(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateRoomLayoutRequest
    ): ResponseEntity<RoomLayoutResponse> {
        val layout = roomLayoutService.updateLayout(id, request.toCommand())
        return ResponseEntity.ok(RoomLayoutResponse.from(layout))
    }

    @PostMapping("/room-layouts/{id}/activate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun activateRoomLayout(@PathVariable id: UUID): ResponseEntity<RoomLayoutResponse> {
        val layout = roomLayoutService.activateLayout(id)
        return ResponseEntity.ok(RoomLayoutResponse.from(layout))
    }

    @PostMapping("/room-layouts/{id}/deactivate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun deactivateRoomLayout(@PathVariable id: UUID): ResponseEntity<RoomLayoutResponse> {
        val layout = roomLayoutService.deactivateLayout(id)
        return ResponseEntity.ok(RoomLayoutResponse.from(layout))
    }

    @DeleteMapping("/room-layouts/{id}")
    @PreAuthorize("hasAuthority('classes_create')")
    fun deleteRoomLayout(@PathVariable id: UUID): ResponseEntity<Void> {
        roomLayoutService.deleteLayout(id)
        return ResponseEntity.noContent().build()
    }
}
