package com.liyaqa.platform.content.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.content.dto.ArticleFeedbackRequest
import com.liyaqa.platform.content.dto.ArticleResponse
import com.liyaqa.platform.content.dto.ArticleSummaryResponse
import com.liyaqa.platform.content.dto.CategoryCountResponse
import com.liyaqa.platform.content.dto.CreateArticleRequest
import com.liyaqa.platform.content.dto.UpdateArticleRequest
import com.liyaqa.platform.content.exception.ArticleNotFoundException
import com.liyaqa.platform.content.exception.ArticleNotFoundBySlugException
import com.liyaqa.platform.content.model.ArticleCategory
import com.liyaqa.platform.content.model.ArticleStatus
import com.liyaqa.platform.content.model.KnowledgeBaseArticle
import com.liyaqa.platform.content.repository.KnowledgeBaseArticleRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class KnowledgeBaseService(
    private val articleRepository: KnowledgeBaseArticleRepository,
    private val auditService: AuditService,
    private val securityService: SecurityService,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun createArticle(request: CreateArticleRequest): ArticleResponse {
        val authorId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("No authenticated user")

        var slug = KnowledgeBaseArticle.generateSlug(request.title)
        if (articleRepository.existsBySlug(slug)) {
            slug = "$slug-${randomSuffix()}"
        }

        val article = KnowledgeBaseArticle(
            slug = slug,
            title = request.title,
            titleAr = request.titleAr,
            content = request.content,
            contentAr = request.contentAr,
            category = request.category,
            tags = request.tags.toMutableList(),
            authorId = authorId,
            status = request.status
        )
        if (request.status == ArticleStatus.PUBLISHED) {
            article.publish()
        }

        val saved = articleRepository.save(article)

        auditService.logAsync(
            action = AuditAction.CREATE,
            entityType = "KnowledgeBaseArticle",
            entityId = saved.id,
            description = "Created article: ${saved.title}",
            newValue = objectMapper.writeValueAsString(ArticleResponse.from(saved))
        )

        return ArticleResponse.from(saved)
    }

    @Transactional(readOnly = true)
    fun getArticle(id: java.util.UUID): ArticleResponse {
        val article = articleRepository.findById(id)
            .orElseThrow { ArticleNotFoundException(id) }
        return ArticleResponse.from(article)
    }

    @Transactional
    fun getArticleBySlug(slug: String): ArticleResponse {
        val article = articleRepository.findBySlug(slug)
            .orElseThrow { ArticleNotFoundBySlugException(slug) }
        article.incrementViewCount()
        val saved = articleRepository.save(article)
        return ArticleResponse.from(saved)
    }

    @Transactional(readOnly = true)
    fun listArticles(
        category: ArticleCategory?,
        status: ArticleStatus?,
        pageable: Pageable
    ): Page<ArticleSummaryResponse> {
        val page = when {
            category != null && status != null ->
                articleRepository.findByCategoryAndStatus(category, status, pageable)
            category != null ->
                articleRepository.findByCategory(category, pageable)
            status != null ->
                articleRepository.findByStatus(status, pageable)
            else ->
                articleRepository.findAll(pageable)
        }
        return page.map { ArticleSummaryResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun searchArticles(query: String, pageable: Pageable): Page<ArticleSummaryResponse> {
        if (query.isBlank()) {
            return Page.empty(pageable)
        }
        return articleRepository.search(query, pageable).map { ArticleSummaryResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getCategoriesWithCounts(): List<CategoryCountResponse> {
        return ArticleCategory.entries.map { category ->
            CategoryCountResponse(
                category = category,
                count = articleRepository.countByCategoryAndStatus(category, ArticleStatus.PUBLISHED)
            )
        }
    }

    @Transactional(readOnly = true)
    fun getPopularArticles(limit: Int = 10): List<ArticleSummaryResponse> {
        return articleRepository.findTopByViewCount(limit).map { ArticleSummaryResponse.from(it) }
    }

    @Transactional
    fun updateArticle(id: java.util.UUID, request: UpdateArticleRequest): ArticleResponse {
        val article = articleRepository.findById(id)
            .orElseThrow { ArticleNotFoundException(id) }

        val oldValue = objectMapper.writeValueAsString(ArticleResponse.from(article))

        request.title?.let {
            article.title = it
            article.slug = KnowledgeBaseArticle.generateSlug(it)
            if (articleRepository.existsBySlug(article.slug) &&
                articleRepository.findBySlug(article.slug).map { existing -> existing.id }.orElse(null) != article.id
            ) {
                article.slug = "${article.slug}-${randomSuffix()}"
            }
        }
        request.titleAr?.let { article.titleAr = it }
        request.content?.let { article.content = it }
        request.contentAr?.let { article.contentAr = it }
        request.category?.let { article.category = it }
        request.tags?.let { article.tags = it.toMutableList() }
        request.status?.let { newStatus ->
            if (newStatus == ArticleStatus.PUBLISHED && article.status != ArticleStatus.PUBLISHED) {
                article.publish()
            } else if (newStatus == ArticleStatus.ARCHIVED) {
                article.archive()
            } else {
                article.status = newStatus
            }
        }

        val saved = articleRepository.save(article)

        auditService.logAsync(
            action = AuditAction.UPDATE,
            entityType = "KnowledgeBaseArticle",
            entityId = saved.id,
            description = "Updated article: ${saved.title}",
            oldValue = oldValue,
            newValue = objectMapper.writeValueAsString(ArticleResponse.from(saved))
        )

        return ArticleResponse.from(saved)
    }

    @Transactional
    fun deleteArticle(id: java.util.UUID) {
        val article = articleRepository.findById(id)
            .orElseThrow { ArticleNotFoundException(id) }

        articleRepository.deleteById(id)

        auditService.logAsync(
            action = AuditAction.DELETE,
            entityType = "KnowledgeBaseArticle",
            entityId = id,
            description = "Deleted article: ${article.title}"
        )
    }

    @Transactional
    fun submitFeedback(id: java.util.UUID, request: ArticleFeedbackRequest): ArticleResponse {
        val article = articleRepository.findById(id)
            .orElseThrow { ArticleNotFoundException(id) }

        if (request.helpful) {
            article.markHelpful()
        } else {
            article.markNotHelpful()
        }

        val saved = articleRepository.save(article)
        return ArticleResponse.from(saved)
    }

    private fun randomSuffix(): String =
        java.util.UUID.randomUUID().toString().take(6)
}
