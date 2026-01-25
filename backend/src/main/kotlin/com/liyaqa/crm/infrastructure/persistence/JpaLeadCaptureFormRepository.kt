package com.liyaqa.crm.infrastructure.persistence

import com.liyaqa.crm.domain.model.LeadCaptureForm
import com.liyaqa.crm.domain.ports.LeadCaptureFormRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for LeadCaptureForm.
 */
interface SpringDataLeadCaptureFormRepository : JpaRepository<LeadCaptureForm, UUID> {
    fun findBySlug(slug: String): Optional<LeadCaptureForm>
    fun existsBySlug(slug: String): Boolean

    @Query("SELECT f FROM LeadCaptureForm f WHERE f.slug = :slug AND f.isActive = true")
    fun findActiveBySlug(@Param("slug") slug: String): Optional<LeadCaptureForm>

    @Query("SELECT f FROM LeadCaptureForm f WHERE f.isActive = true")
    fun findAllActive(pageable: Pageable): Page<LeadCaptureForm>

    @Query("SELECT COUNT(f) FROM LeadCaptureForm f WHERE f.isActive = true")
    fun countActive(): Long

    @Query("""
        SELECT f FROM LeadCaptureForm f
        WHERE (:search IS NULL OR (
            LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(f.slug) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(f.description) LIKE LOWER(CONCAT('%', :search, '%'))
        ))
        AND (:isActive IS NULL OR f.isActive = :isActive)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("isActive") isActive: Boolean?,
        pageable: Pageable
    ): Page<LeadCaptureForm>

    @Query("SELECT f FROM LeadCaptureForm f ORDER BY f.submissionCount DESC")
    fun findTopBySubmissions(pageable: Pageable): List<LeadCaptureForm>
}

/**
 * Implementation of LeadCaptureFormRepository using Spring Data JPA.
 */
@Repository
class JpaLeadCaptureFormRepository(
    private val springDataRepository: SpringDataLeadCaptureFormRepository
) : LeadCaptureFormRepository {

    override fun save(form: LeadCaptureForm): LeadCaptureForm =
        springDataRepository.save(form)

    override fun findById(id: UUID): Optional<LeadCaptureForm> =
        springDataRepository.findById(id)

    override fun findBySlug(slug: String): Optional<LeadCaptureForm> =
        springDataRepository.findBySlug(slug)

    override fun findAll(pageable: Pageable): Page<LeadCaptureForm> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsBySlug(slug: String): Boolean =
        springDataRepository.existsBySlug(slug)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findActiveBySlug(slug: String): Optional<LeadCaptureForm> =
        springDataRepository.findActiveBySlug(slug)

    override fun findAllActive(pageable: Pageable): Page<LeadCaptureForm> =
        springDataRepository.findAllActive(pageable)

    override fun countActive(): Long =
        springDataRepository.countActive()

    override fun search(
        search: String?,
        isActive: Boolean?,
        pageable: Pageable
    ): Page<LeadCaptureForm> =
        springDataRepository.search(search, isActive, pageable)

    override fun findAllByIds(ids: List<UUID>): List<LeadCaptureForm> =
        springDataRepository.findAllById(ids)

    override fun findTopBySubmissions(limit: Int): List<LeadCaptureForm> {
        val pageable = PageRequest.of(0, limit)
        return springDataRepository.findTopBySubmissions(pageable)
    }
}
