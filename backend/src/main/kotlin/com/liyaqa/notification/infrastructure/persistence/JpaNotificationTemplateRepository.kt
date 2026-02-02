package com.liyaqa.notification.infrastructure.persistence

import com.liyaqa.notification.domain.model.NotificationTemplate
import com.liyaqa.notification.domain.model.TemplateCategory
import com.liyaqa.notification.domain.ports.NotificationTemplateRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for NotificationTemplate
 */
interface SpringDataNotificationTemplateRepository : JpaRepository<NotificationTemplate, UUID> {
    /**
     * Find template by unique code
     */
    fun findByCode(code: String): Optional<NotificationTemplate>

    /**
     * Find all active templates
     */
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<NotificationTemplate>

    /**
     * Find templates by category
     */
    fun findByCategory(category: TemplateCategory, pageable: Pageable): Page<NotificationTemplate>

    /**
     * Find active templates by category
     */
    fun findByIsActiveTrueAndCategory(category: TemplateCategory): List<NotificationTemplate>

    /**
     * Check if template exists by code
     */
    fun existsByCode(code: String): Boolean

    /**
     * Count templates by active status
     */
    fun countByIsActive(isActive: Boolean): Long

    /**
     * Search templates by name or code
     */
    @Query("""
        SELECT t FROM NotificationTemplate t
        WHERE (:search IS NULL
            OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(t.nameEn) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(t.nameAr) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:category IS NULL OR t.category = :category)
        AND (:isActive IS NULL OR t.isActive = :isActive)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("category") category: TemplateCategory?,
        @Param("isActive") isActive: Boolean?,
        pageable: Pageable
    ): Page<NotificationTemplate>
}

/**
 * JPA adapter implementation for NotificationTemplateRepository
 */
@Repository
class JpaNotificationTemplateRepository(
    private val springDataRepository: SpringDataNotificationTemplateRepository
) : NotificationTemplateRepository {

    override fun save(template: NotificationTemplate): NotificationTemplate =
        springDataRepository.save(template)

    override fun findById(id: UUID): Optional<NotificationTemplate> =
        springDataRepository.findById(id)

    override fun findByCode(code: String): NotificationTemplate? =
        springDataRepository.findByCode(code).orElse(null)

    override fun findAllActive(pageable: Pageable): Page<NotificationTemplate> =
        springDataRepository.findByIsActive(true, pageable)

    override fun findByCategory(category: TemplateCategory, pageable: Pageable): Page<NotificationTemplate> =
        springDataRepository.findByCategory(category, pageable)

    override fun findByIsActiveTrueAndCategory(category: TemplateCategory): List<NotificationTemplate> =
        springDataRepository.findByIsActiveTrueAndCategory(category)

    override fun findAll(pageable: Pageable): Page<NotificationTemplate> =
        springDataRepository.findAll(pageable)

    override fun existsByCode(code: String): Boolean =
        springDataRepository.existsByCode(code)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByIsActive(isActive: Boolean): Long =
        springDataRepository.countByIsActive(isActive)

    /**
     * Search templates (additional method)
     */
    fun search(
        search: String?,
        category: TemplateCategory?,
        isActive: Boolean?,
        pageable: Pageable
    ): Page<NotificationTemplate> =
        springDataRepository.search(search, category, isActive, pageable)
}
