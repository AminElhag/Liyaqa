package com.liyaqa.platform.application.services

import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.domain.model.ClientNote
import com.liyaqa.platform.domain.model.NoteCategory
import com.liyaqa.platform.domain.ports.ClientNoteRepository
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.shared.domain.LocalizedText
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing client notes.
 */
@Service
class ClientNoteService(
    private val clientNoteRepository: ClientNoteRepository,
    private val organizationRepository: OrganizationRepository,
    private val platformUserRepository: PlatformUserRepository
) {

    /**
     * Create a new client note.
     */
    @Transactional
    fun createNote(command: CreateClientNoteCommand): ClientNote {
        val organization = organizationRepository.findById(command.organizationId)
            .orElseThrow { NoSuchElementException("Organization not found: ${command.organizationId}") }

        val createdBy = platformUserRepository.findById(command.createdById)
            .orElseThrow { NoSuchElementException("Platform user not found: ${command.createdById}") }

        val note = ClientNote.create(
            organization = organization,
            content = command.content,
            category = command.category,
            createdBy = createdBy,
            isPinned = command.isPinned
        )

        return clientNoteRepository.save(note)
    }

    /**
     * Update an existing client note.
     */
    @Transactional
    fun updateNote(id: UUID, command: UpdateClientNoteCommand): ClientNote {
        val note = clientNoteRepository.findById(id)
            .orElseThrow { NoSuchElementException("Note not found: $id") }

        command.content?.let { note.updateContent(it) }
        command.category?.let { note.updateCategory(it) }
        command.isPinned?.let { note.changePinStatus(it) }

        return clientNoteRepository.save(note)
    }

    /**
     * Toggle pin status of a note.
     */
    @Transactional
    fun togglePin(id: UUID): ClientNote {
        val note = clientNoteRepository.findById(id)
            .orElseThrow { NoSuchElementException("Note not found: $id") }

        note.togglePin()
        return clientNoteRepository.save(note)
    }

    /**
     * Delete a client note.
     */
    @Transactional
    fun deleteNote(id: UUID) {
        if (!clientNoteRepository.existsById(id)) {
            throw NoSuchElementException("Note not found: $id")
        }
        clientNoteRepository.deleteById(id)
    }

    /**
     * Get a note by ID.
     */
    @Transactional(readOnly = true)
    fun getNote(id: UUID): ClientNote {
        return clientNoteRepository.findById(id)
            .orElseThrow { NoSuchElementException("Note not found: $id") }
    }

    /**
     * Get notes for an organization with optional category filter.
     */
    @Transactional(readOnly = true)
    fun getNotes(organizationId: UUID, category: NoteCategory?, pageable: Pageable): Page<ClientNote> {
        return if (category != null) {
            clientNoteRepository.findByOrganizationIdAndCategory(organizationId, category, pageable)
        } else {
            clientNoteRepository.findByOrganizationId(organizationId, pageable)
        }
    }

    /**
     * Get pinned notes for an organization.
     */
    @Transactional(readOnly = true)
    fun getPinnedNotes(organizationId: UUID): List<ClientNote> {
        return clientNoteRepository.findByOrganizationIdAndIsPinnedTrue(organizationId)
    }

    /**
     * Get note count for an organization.
     */
    @Transactional(readOnly = true)
    fun getNoteCount(organizationId: UUID): Long {
        return clientNoteRepository.countByOrganizationId(organizationId)
    }
}

// ============================================
// Command Classes
// ============================================

data class CreateClientNoteCommand(
    val organizationId: UUID,
    val content: LocalizedText,
    val category: NoteCategory,
    val createdById: UUID,
    val isPinned: Boolean = false
)

data class UpdateClientNoteCommand(
    val content: LocalizedText? = null,
    val category: NoteCategory? = null,
    val isPinned: Boolean? = null
)
