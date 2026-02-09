package com.liyaqa.platform.content.repository

import com.liyaqa.platform.content.model.ArticleCategory
import com.liyaqa.platform.content.model.ArticleStatus
import com.liyaqa.platform.content.model.KnowledgeBaseArticle
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface KnowledgeBaseArticleRepository {
    fun save(article: KnowledgeBaseArticle): KnowledgeBaseArticle
    fun findById(id: UUID): Optional<KnowledgeBaseArticle>
    fun findBySlug(slug: String): Optional<KnowledgeBaseArticle>
    fun findAll(pageable: Pageable): Page<KnowledgeBaseArticle>
    fun findByStatus(status: ArticleStatus, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun findByCategory(category: ArticleCategory, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun findByCategoryAndStatus(category: ArticleCategory, status: ArticleStatus, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun search(query: String, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun findTopByViewCount(limit: Int): List<KnowledgeBaseArticle>
    fun countByCategory(category: ArticleCategory): Long
    fun countByCategoryAndStatus(category: ArticleCategory, status: ArticleStatus): Long
    fun deleteById(id: UUID)
    fun existsBySlug(slug: String): Boolean
}
