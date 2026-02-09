package com.liyaqa.platform.content.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "knowledge_base_articles")
class KnowledgeBaseArticle(
    id: UUID = UUID.randomUUID(),

    @Column(name = "slug", unique = true, nullable = false, length = 200)
    var slug: String,

    @Column(name = "title", nullable = false, length = 500)
    var title: String,

    @Column(name = "title_ar", length = 500)
    var titleAr: String? = null,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(name = "content_ar", columnDefinition = "TEXT")
    var contentAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    var category: ArticleCategory,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    var tags: MutableList<String> = mutableListOf(),

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: ArticleStatus = ArticleStatus.DRAFT,

    @Column(name = "view_count")
    var viewCount: Long = 0,

    @Column(name = "helpful_count")
    var helpfulCount: Long = 0,

    @Column(name = "not_helpful_count")
    var notHelpfulCount: Long = 0,

    @Column(name = "author_id", nullable = false)
    val authorId: UUID,

    @Column(name = "published_at")
    var publishedAt: Instant? = null

) : OrganizationLevelEntity(id) {

    fun publish() {
        status = ArticleStatus.PUBLISHED
        publishedAt = Instant.now()
    }

    fun archive() {
        status = ArticleStatus.ARCHIVED
    }

    fun incrementViewCount() {
        viewCount++
    }

    fun markHelpful() {
        helpfulCount++
    }

    fun markNotHelpful() {
        notHelpfulCount++
    }

    companion object {
        fun create(
            title: String,
            titleAr: String? = null,
            content: String,
            contentAr: String? = null,
            category: ArticleCategory,
            tags: List<String> = emptyList(),
            authorId: UUID,
            status: ArticleStatus = ArticleStatus.DRAFT
        ): KnowledgeBaseArticle {
            val article = KnowledgeBaseArticle(
                slug = generateSlug(title),
                title = title,
                titleAr = titleAr,
                content = content,
                contentAr = contentAr,
                category = category,
                tags = tags.toMutableList(),
                authorId = authorId,
                status = status
            )
            if (status == ArticleStatus.PUBLISHED) {
                article.publishedAt = Instant.now()
            }
            return article
        }

        fun generateSlug(name: String): String {
            return name
                .lowercase()
                .replace(Regex("[^a-z0-9\\s-]"), "")
                .replace(Regex("\\s+"), "-")
                .replace(Regex("-+"), "-")
                .trim('-')
                .take(63)
                .trimEnd('-')
        }
    }
}
