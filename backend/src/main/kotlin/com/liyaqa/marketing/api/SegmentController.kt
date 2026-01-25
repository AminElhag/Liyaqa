package com.liyaqa.marketing.api

import com.liyaqa.marketing.application.commands.AddSegmentMembersCommand
import com.liyaqa.marketing.application.commands.RemoveSegmentMemberCommand
import com.liyaqa.marketing.application.services.SegmentService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
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
@RequestMapping("/api/marketing/segments")
@Tag(name = "Marketing Segments", description = "Segment management")
class SegmentController(
    private val segmentService: SegmentService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('marketing_segments_create')")
    @Operation(summary = "Create a new segment")
    fun createSegment(
        @Valid @RequestBody request: CreateSegmentRequest
    ): ResponseEntity<SegmentResponse> {
        val segment = segmentService.createSegment(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(SegmentResponse.from(segment))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('marketing_segments_read')")
    @Operation(summary = "List segments")
    fun listSegments(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) isActive: Boolean?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<Page<SegmentResponse>> {
        val sort = if (sortDir.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size, sort)
        val segments = segmentService.searchSegments(search, isActive, pageable)
        return ResponseEntity.ok(segments.map { SegmentResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('marketing_segments_read')")
    @Operation(summary = "Get segment details")
    fun getSegment(@PathVariable id: UUID): ResponseEntity<SegmentResponse> {
        val segment = segmentService.getSegment(id)
        return ResponseEntity.ok(SegmentResponse.from(segment))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('marketing_segments_update')")
    @Operation(summary = "Update segment")
    fun updateSegment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSegmentRequest
    ): ResponseEntity<SegmentResponse> {
        val segment = segmentService.updateSegment(id, request.toCommand())
        return ResponseEntity.ok(SegmentResponse.from(segment))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('marketing_segments_delete')")
    @Operation(summary = "Delete segment")
    fun deleteSegment(@PathVariable id: UUID): ResponseEntity<Void> {
        segmentService.deleteSegment(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('marketing_segments_update')")
    @Operation(summary = "Activate segment")
    fun activateSegment(@PathVariable id: UUID): ResponseEntity<SegmentResponse> {
        val segment = segmentService.activateSegment(id)
        return ResponseEntity.ok(SegmentResponse.from(segment))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('marketing_segments_update')")
    @Operation(summary = "Deactivate segment")
    fun deactivateSegment(@PathVariable id: UUID): ResponseEntity<SegmentResponse> {
        val segment = segmentService.deactivateSegment(id)
        return ResponseEntity.ok(SegmentResponse.from(segment))
    }

    @GetMapping("/{id}/preview")
    @PreAuthorize("hasAuthority('marketing_segments_read')")
    @Operation(summary = "Preview members matching segment criteria")
    fun previewMembers(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<MemberPreviewResponse>> {
        val pageable = PageRequest.of(page, size)
        val members = segmentService.previewMembers(id, pageable)
        return ResponseEntity.ok(members.map { MemberPreviewResponse.from(it) })
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAuthority('marketing_segments_update')")
    @Operation(summary = "Add members to static segment")
    fun addMembers(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AddSegmentMembersRequest
    ): ResponseEntity<Map<String, Int>> {
        val added = segmentService.addMembers(
            AddSegmentMembersCommand(id, request.memberIds)
        )
        return ResponseEntity.ok(mapOf("added" to added))
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @PreAuthorize("hasAuthority('marketing_segments_update')")
    @Operation(summary = "Remove member from static segment")
    fun removeMember(
        @PathVariable id: UUID,
        @PathVariable memberId: UUID
    ): ResponseEntity<Void> {
        segmentService.removeMember(RemoveSegmentMemberCommand(id, memberId))
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/recalculate")
    @PreAuthorize("hasAuthority('marketing_segments_update')")
    @Operation(summary = "Recalculate segment member count")
    fun recalculate(@PathVariable id: UUID): ResponseEntity<Map<String, Int>> {
        val count = segmentService.recalculateSegmentCount(id)
        return ResponseEntity.ok(mapOf("memberCount" to count))
    }
}

// Helper DTO for member preview
data class MemberPreviewResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val status: String
) {
    companion object {
        fun from(member: com.liyaqa.membership.domain.model.Member) = MemberPreviewResponse(
            id = member.id,
            firstName = member.firstName.en,
            lastName = member.lastName.en,
            email = member.email,
            phone = member.phone,
            status = member.status.name
        )
    }
}
