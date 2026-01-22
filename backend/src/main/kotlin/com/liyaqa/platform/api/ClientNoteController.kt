package com.liyaqa.platform.api

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.application.services.ClientNoteService
import com.liyaqa.platform.application.services.CreateClientNoteCommand
import com.liyaqa.platform.application.services.UpdateClientNoteCommand
import com.liyaqa.platform.domain.model.ClientNote
import com.liyaqa.platform.domain.model.NoteCategory
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

/**
 * REST controller for managing client notes.
 */
@RestController
@RequestMapping("/api/platform/clients/{organizationId}/notes")
@Tag(name = "Client Notes", description = "Platform client notes management")
class ClientNoteController(
    private val clientNoteService: ClientNoteService
) {

    /**
     * Get all notes for a client organization.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Get client notes", description = "Get all notes for a client organization")
    fun getNotes(
        @PathVariable organizationId: UUID,
        @RequestParam(required = false) category: NoteCategory?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<Page<ClientNoteResponse>> {
        val sortProperties = sortBy.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortProperties.map { Sort.Order.asc(it) })
        } else {
            Sort.by(sortProperties.map { Sort.Order.desc(it) })
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val notes = clientNoteService.getNotes(organizationId, category, pageable)
        return ResponseEntity.ok(notes.map { it.toResponse() })
    }

    /**
     * Get pinned notes for a client organization.
     */
    @GetMapping("/pinned")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Get pinned notes", description = "Get pinned notes for a client organization")
    fun getPinnedNotes(@PathVariable organizationId: UUID): ResponseEntity<List<ClientNoteResponse>> {
        val notes = clientNoteService.getPinnedNotes(organizationId)
        return ResponseEntity.ok(notes.map { it.toResponse() })
    }

    /**
     * Get a single note by ID.
     */
    @GetMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Get note", description = "Get a single note by ID")
    fun getNote(
        @PathVariable organizationId: UUID,
        @PathVariable noteId: UUID
    ): ResponseEntity<ClientNoteResponse> {
        val note = clientNoteService.getNote(noteId)
        // Verify note belongs to the organization
        if (note.organization.id != organizationId) {
            return ResponseEntity.notFound().build()
        }
        return ResponseEntity.ok(note.toResponse())
    }

    /**
     * Create a new note.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Create note", description = "Create a new note for a client")
    fun createNote(
        @PathVariable organizationId: UUID,
        @Valid @RequestBody request: CreateClientNoteRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ClientNoteResponse> {
        val command = CreateClientNoteCommand(
            organizationId = organizationId,
            content = LocalizedText(en = request.contentEn, ar = request.contentAr),
            category = request.category,
            createdById = principal.userId,
            isPinned = request.isPinned ?: false
        )
        val note = clientNoteService.createNote(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(note.toResponse())
    }

    /**
     * Update an existing note.
     */
    @PutMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Update note", description = "Update an existing note")
    fun updateNote(
        @PathVariable organizationId: UUID,
        @PathVariable noteId: UUID,
        @Valid @RequestBody request: UpdateClientNoteRequest
    ): ResponseEntity<ClientNoteResponse> {
        // Verify note exists and belongs to organization
        val existingNote = clientNoteService.getNote(noteId)
        if (existingNote.organization.id != organizationId) {
            return ResponseEntity.notFound().build()
        }

        val command = UpdateClientNoteCommand(
            content = if (request.contentEn != null) LocalizedText(
                en = request.contentEn,
                ar = request.contentAr
            ) else null,
            category = request.category,
            isPinned = request.isPinned
        )
        val note = clientNoteService.updateNote(noteId, command)
        return ResponseEntity.ok(note.toResponse())
    }

    /**
     * Toggle pin status of a note.
     */
    @PostMapping("/{noteId}/toggle-pin")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Toggle pin", description = "Toggle pin status of a note")
    fun togglePin(
        @PathVariable organizationId: UUID,
        @PathVariable noteId: UUID
    ): ResponseEntity<ClientNoteResponse> {
        // Verify note exists and belongs to organization
        val existingNote = clientNoteService.getNote(noteId)
        if (existingNote.organization.id != organizationId) {
            return ResponseEntity.notFound().build()
        }

        val note = clientNoteService.togglePin(noteId)
        return ResponseEntity.ok(note.toResponse())
    }

    /**
     * Delete a note.
     */
    @DeleteMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    @Operation(summary = "Delete note", description = "Delete a note")
    fun deleteNote(
        @PathVariable organizationId: UUID,
        @PathVariable noteId: UUID
    ): ResponseEntity<Void> {
        // Verify note exists and belongs to organization
        val existingNote = clientNoteService.getNote(noteId)
        if (existingNote.organization.id != organizationId) {
            return ResponseEntity.notFound().build()
        }

        clientNoteService.deleteNote(noteId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get note categories (for filter dropdowns).
     */
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
    @Operation(summary = "Get categories", description = "Get list of all note categories")
    fun getCategories(): ResponseEntity<List<String>> {
        return ResponseEntity.ok(NoteCategory.entries.map { it.name })
    }
}

// ============================================
// Request DTOs
// ============================================

data class CreateClientNoteRequest(
    @field:NotBlank(message = "Content (English) is required")
    val contentEn: String,
    val contentAr: String? = null,
    @field:NotNull(message = "Category is required")
    val category: NoteCategory,
    val isPinned: Boolean? = false
)

data class UpdateClientNoteRequest(
    val contentEn: String? = null,
    val contentAr: String? = null,
    val category: NoteCategory? = null,
    val isPinned: Boolean? = null
)

// ============================================
// Response DTOs
// ============================================

data class ClientNoteResponse(
    val id: UUID,
    val organizationId: UUID,
    val content: LocalizedText,
    val category: NoteCategory,
    val isPinned: Boolean,
    val createdById: UUID,
    val createdByName: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

/**
 * Extension function to convert ClientNote entity to response DTO.
 */
fun ClientNote.toResponse() = ClientNoteResponse(
    id = this.id,
    organizationId = this.organization.id,
    content = this.content,
    category = this.category,
    isPinned = this.isPinned,
    createdById = this.createdBy.id,
    createdByName = this.createdByName,
    createdAt = this.createdAt,
    updatedAt = this.updatedAt
)
