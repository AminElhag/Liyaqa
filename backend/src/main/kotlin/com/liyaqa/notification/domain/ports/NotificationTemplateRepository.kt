package com.liyaqa.notification.domain.ports

import com.liyaqa.notification.domain.model.NotificationTemplate
import com.liyaqa.notification.domain.model.TemplateCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository for managing notification templates
 */
interface NotificationTemplateRepository {
    /**
     * Save a notification template
     */
    fun save(template: NotificationTemplate): NotificationTemplate

    /**
     * Find a template by its ID
     */
    fun findById(id: UUID): Optional<NotificationTemplate>

    /**
     * Find a template by its unique code
     */
    fun findByCode(code: String): NotificationTemplate?

    /**
     * Find all active templates
     */
    fun findAllActive(pageable: Pageable): Page<NotificationTemplate>

    /**
     * Find all templates in a specific category
     */
    fun findByCategory(category: TemplateCategory, pageable: Pageable): Page<NotificationTemplate>

    /**
     * Find all active templates in a specific category
     */
    fun findByIsActiveTrueAndCategory(category: TemplateCategory): List<NotificationTemplate>

    /**
     * Find all templates
     */
    fun findAll(pageable: Pageable): Page<NotificationTemplate>

    /**
     * Check if a template exists by code
     */
    fun existsByCode(code: String): Boolean

    /**
     * Delete a template by ID
     */
    fun deleteById(id: UUID)

    /**
     * Count all templates
     */
    fun count(): Long

    /**
     * Count active templates
     */
    fun countByIsActive(isActive: Boolean): Long
}
