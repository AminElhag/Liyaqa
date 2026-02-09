package com.liyaqa.platform.support.dto

import com.liyaqa.platform.support.model.CannedResponse
import com.liyaqa.platform.support.model.TicketCategory
import java.time.Instant
import java.util.UUID

// --- Commands ---

data class CreateCannedResponseCommand(
    val title: String,
    val titleAr: String? = null,
    val content: String,
    val contentAr: String? = null,
    val category: TicketCategory,
    val createdBy: UUID
)

data class UpdateCannedResponseCommand(
    val title: String? = null,
    val titleAr: String? = null,
    val content: String? = null,
    val contentAr: String? = null,
    val category: TicketCategory? = null
)

// --- Requests ---

data class CreateCannedResponseRequest(
    val title: String,
    val titleAr: String? = null,
    val content: String,
    val contentAr: String? = null,
    val category: TicketCategory
) {
    fun toCommand(createdBy: UUID) = CreateCannedResponseCommand(
        title = title,
        titleAr = titleAr,
        content = content,
        contentAr = contentAr,
        category = category,
        createdBy = createdBy
    )
}

data class UpdateCannedResponseRequest(
    val title: String? = null,
    val titleAr: String? = null,
    val content: String? = null,
    val contentAr: String? = null,
    val category: TicketCategory? = null
) {
    fun toCommand() = UpdateCannedResponseCommand(
        title = title,
        titleAr = titleAr,
        content = content,
        contentAr = contentAr,
        category = category
    )
}

// --- Response ---

data class CannedResponseResponse(
    val id: UUID,
    val title: String,
    val titleAr: String?,
    val content: String,
    val contentAr: String?,
    val category: TicketCategory,
    val createdBy: UUID,
    val usageCount: Int,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(entity: CannedResponse) = CannedResponseResponse(
            id = entity.id,
            title = entity.title,
            titleAr = entity.titleAr,
            content = entity.content,
            contentAr = entity.contentAr,
            category = entity.category,
            createdBy = entity.createdBy,
            usageCount = entity.usageCount,
            isActive = entity.isActive,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }
}
