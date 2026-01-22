package com.liyaqa.platform.domain.model

import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.util.UUID

/**
 * Client note entity.
 * Internal notes for platform admin to track client business details,
 * troubleshooting info, and relationship management.
 */
@Entity
@Table(name = "client_notes")
class ClientNote(
    id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    var organization: Organization,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "content_en", columnDefinition = "TEXT", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "content_ar", columnDefinition = "TEXT"))
    )
    var content: LocalizedText,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    var category: NoteCategory = NoteCategory.GENERAL,

    @Column(name = "is_pinned", nullable = false)
    var isPinned: Boolean = false,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    var createdBy: PlatformUser,

    @Column(name = "created_by_name")
    var createdByName: String? = null

) : OrganizationLevelEntity(id) {

    // ============================================
    // Update Methods
    // ============================================

    /**
     * Update note content.
     */
    fun updateContent(content: LocalizedText) {
        this.content = content
    }

    /**
     * Update note category.
     */
    fun updateCategory(category: NoteCategory) {
        this.category = category
    }

    /**
     * Pin or unpin the note.
     */
    fun changePinStatus(pinned: Boolean) {
        this.isPinned = pinned
    }

    /**
     * Toggle pin status.
     */
    fun togglePin() {
        this.isPinned = !this.isPinned
    }

    // ============================================
    // Factory Method
    // ============================================

    companion object {
        /**
         * Create a new client note.
         */
        fun create(
            organization: Organization,
            content: LocalizedText,
            category: NoteCategory,
            createdBy: PlatformUser,
            isPinned: Boolean = false
        ): ClientNote {
            return ClientNote(
                organization = organization,
                content = content,
                category = category,
                createdBy = createdBy,
                createdByName = createdBy.displayName?.en ?: createdBy.email,
                isPinned = isPinned
            )
        }
    }
}
