package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientNote
import com.liyaqa.platform.domain.model.NoteCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for client notes.
 */
interface ClientNoteRepository {
    fun save(note: ClientNote): ClientNote
    fun findById(id: UUID): Optional<ClientNote>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientNote>
    fun findByOrganizationIdAndCategory(organizationId: UUID, category: NoteCategory, pageable: Pageable): Page<ClientNote>
    fun findByOrganizationIdAndIsPinnedTrue(organizationId: UUID): List<ClientNote>
    fun countByOrganizationId(organizationId: UUID): Long
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}
