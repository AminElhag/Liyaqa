package com.liyaqa.platform.support.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "canned_responses")
class CannedResponse(
    @Column(name = "title", nullable = false, length = 200)
    var title: String,

    @Column(name = "title_ar", length = 200)
    var titleAr: String? = null,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(name = "content_ar", columnDefinition = "TEXT")
    var contentAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    var category: TicketCategory,

    @Column(name = "created_by", nullable = false)
    val createdBy: UUID,

    @Column(name = "usage_count", nullable = false)
    var usageCount: Int = 0,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true
) : OrganizationLevelEntity() {

    fun incrementUsage() {
        usageCount++
    }

    fun deactivate() {
        isActive = false
    }

    fun activate() {
        isActive = true
    }

    companion object {
        fun create(
            title: String,
            titleAr: String? = null,
            content: String,
            contentAr: String? = null,
            category: TicketCategory,
            createdBy: UUID
        ): CannedResponse {
            return CannedResponse(
                title = title,
                titleAr = titleAr,
                content = content,
                contentAr = contentAr,
                category = category,
                createdBy = createdBy
            )
        }
    }
}
