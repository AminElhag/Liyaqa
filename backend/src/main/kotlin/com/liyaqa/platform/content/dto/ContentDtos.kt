package com.liyaqa.platform.content.dto

import com.liyaqa.platform.content.model.ArticleCategory
import com.liyaqa.platform.content.model.ArticleStatus
import com.liyaqa.platform.content.model.DocumentTemplate
import com.liyaqa.platform.content.model.KnowledgeBaseArticle
import com.liyaqa.platform.content.model.TemplateType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// ==================== KNOWLEDGE BASE DTOs ====================

data class CreateArticleRequest(
    @field:NotBlank val title: String,
    val titleAr: String? = null,
    @field:NotBlank val content: String,
    val contentAr: String? = null,
    @field:NotNull val category: ArticleCategory,
    val tags: List<String> = emptyList(),
    val status: ArticleStatus = ArticleStatus.DRAFT
)

data class UpdateArticleRequest(
    val title: String? = null,
    val titleAr: String? = null,
    val content: String? = null,
    val contentAr: String? = null,
    val category: ArticleCategory? = null,
    val tags: List<String>? = null,
    val status: ArticleStatus? = null
)

data class ArticleFeedbackRequest(
    @field:NotNull val helpful: Boolean
)

data class ArticleResponse(
    val id: UUID,
    val slug: String,
    val title: String,
    val titleAr: String?,
    val content: String,
    val contentAr: String?,
    val category: ArticleCategory,
    val tags: List<String>,
    val status: ArticleStatus,
    val viewCount: Long,
    val helpfulCount: Long,
    val notHelpfulCount: Long,
    val authorId: UUID,
    val publishedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(article: KnowledgeBaseArticle): ArticleResponse = ArticleResponse(
            id = article.id,
            slug = article.slug,
            title = article.title,
            titleAr = article.titleAr,
            content = article.content,
            contentAr = article.contentAr,
            category = article.category,
            tags = article.tags,
            status = article.status,
            viewCount = article.viewCount,
            helpfulCount = article.helpfulCount,
            notHelpfulCount = article.notHelpfulCount,
            authorId = article.authorId,
            publishedAt = article.publishedAt,
            createdAt = article.createdAt,
            updatedAt = article.updatedAt
        )
    }
}

data class ArticleSummaryResponse(
    val id: UUID,
    val slug: String,
    val title: String,
    val titleAr: String?,
    val category: ArticleCategory,
    val status: ArticleStatus,
    val viewCount: Long,
    val publishedAt: Instant?,
    val updatedAt: Instant
) {
    companion object {
        fun from(article: KnowledgeBaseArticle): ArticleSummaryResponse = ArticleSummaryResponse(
            id = article.id,
            slug = article.slug,
            title = article.title,
            titleAr = article.titleAr,
            category = article.category,
            status = article.status,
            viewCount = article.viewCount,
            publishedAt = article.publishedAt,
            updatedAt = article.updatedAt
        )
    }
}

data class CategoryCountResponse(
    val category: ArticleCategory,
    val count: Long
)

// ==================== TEMPLATE DTOs ====================

data class CreateTemplateRequest(
    @field:NotBlank val key: String,
    @field:NotBlank val name: String,
    val nameAr: String? = null,
    @field:NotNull val type: TemplateType,
    @field:NotBlank val content: String,
    val contentAr: String? = null,
    val variables: List<String> = emptyList()
)

data class UpdateTemplateRequest(
    val name: String? = null,
    val nameAr: String? = null,
    val content: String? = null,
    val contentAr: String? = null,
    val variables: List<String>? = null,
    val isActive: Boolean? = null
)

data class TemplatePreviewRequest(
    val variables: Map<String, Any> = emptyMap(),
    val locale: String = "en"
)

data class TemplateResponse(
    val id: UUID,
    val key: String,
    val name: String,
    val nameAr: String?,
    val type: TemplateType,
    val content: String,
    val contentAr: String?,
    val variables: List<String>,
    val isActive: Boolean,
    val updatedBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(template: DocumentTemplate): TemplateResponse = TemplateResponse(
            id = template.id,
            key = template.key,
            name = template.name,
            nameAr = template.nameAr,
            type = template.type,
            content = template.content,
            contentAr = template.contentAr,
            variables = template.variables,
            isActive = template.isActive,
            updatedBy = template.updatedBy,
            createdAt = template.createdAt,
            updatedAt = template.updatedAt
        )
    }
}

data class TemplatePreviewResponse(
    val renderedContent: String,
    val locale: String
)

data class TemplateVersionResponse(
    val id: UUID,
    val action: String,
    val description: String?,
    val oldValue: String?,
    val newValue: String?,
    val userId: UUID?,
    val userEmail: String?,
    val createdAt: Instant
)
