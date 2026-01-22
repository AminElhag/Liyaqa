package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientNote
import com.liyaqa.platform.domain.model.NoteCategory
import com.liyaqa.platform.domain.ports.ClientNoteRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA interface for ClientNote.
 */
interface SpringDataClientNoteRepository : JpaRepository<ClientNote, UUID> {
    @Query("SELECT n FROM ClientNote n WHERE n.organization.id = :organizationId")
    fun findByOrganizationId(@Param("organizationId") organizationId: UUID, pageable: Pageable): Page<ClientNote>

    @Query("SELECT n FROM ClientNote n WHERE n.organization.id = :organizationId AND n.category = :category")
    fun findByOrganizationIdAndCategory(
        @Param("organizationId") organizationId: UUID,
        @Param("category") category: NoteCategory,
        pageable: Pageable
    ): Page<ClientNote>

    @Query("SELECT n FROM ClientNote n WHERE n.organization.id = :organizationId AND n.isPinned = true ORDER BY n.createdAt DESC")
    fun findPinnedByOrganizationId(@Param("organizationId") organizationId: UUID): List<ClientNote>

    @Query("SELECT COUNT(n) FROM ClientNote n WHERE n.organization.id = :organizationId")
    fun countByOrganizationId(@Param("organizationId") organizationId: UUID): Long
}

/**
 * JPA adapter implementation for ClientNoteRepository.
 */
@Repository
class JpaClientNoteRepository(
    private val springDataRepository: SpringDataClientNoteRepository
) : ClientNoteRepository {

    override fun save(note: ClientNote): ClientNote =
        springDataRepository.save(note)

    override fun findById(id: UUID): Optional<ClientNote> =
        springDataRepository.findById(id)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientNote> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findByOrganizationIdAndCategory(
        organizationId: UUID,
        category: NoteCategory,
        pageable: Pageable
    ): Page<ClientNote> =
        springDataRepository.findByOrganizationIdAndCategory(organizationId, category, pageable)

    override fun findByOrganizationIdAndIsPinnedTrue(organizationId: UUID): List<ClientNote> =
        springDataRepository.findPinnedByOrganizationId(organizationId)

    override fun countByOrganizationId(organizationId: UUID): Long =
        springDataRepository.countByOrganizationId(organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)
}
