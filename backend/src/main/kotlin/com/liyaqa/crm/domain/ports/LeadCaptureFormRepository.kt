package com.liyaqa.crm.domain.ports

import com.liyaqa.crm.domain.model.LeadCaptureForm
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for lead capture form persistence operations.
 * This is a domain-level abstraction - implementations are in the infrastructure layer.
 */
interface LeadCaptureFormRepository {
    fun save(form: LeadCaptureForm): LeadCaptureForm
    fun findById(id: UUID): Optional<LeadCaptureForm>
    fun findBySlug(slug: String): Optional<LeadCaptureForm>
    fun findAll(pageable: Pageable): Page<LeadCaptureForm>
    fun existsById(id: UUID): Boolean
    fun existsBySlug(slug: String): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    // Active forms
    fun findActiveBySlug(slug: String): Optional<LeadCaptureForm>
    fun findAllActive(pageable: Pageable): Page<LeadCaptureForm>
    fun countActive(): Long

    /**
     * Search forms with filters.
     */
    fun search(
        search: String?,
        isActive: Boolean?,
        pageable: Pageable
    ): Page<LeadCaptureForm>

    /**
     * Find forms by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<LeadCaptureForm>

    /**
     * Get top forms by submission count.
     */
    fun findTopBySubmissions(limit: Int): List<LeadCaptureForm>
}
