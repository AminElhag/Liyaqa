package com.liyaqa.platform.content.repository

import com.liyaqa.platform.content.model.ArticleCategory
import com.liyaqa.platform.content.model.ArticleStatus
import com.liyaqa.platform.content.model.KnowledgeBaseArticle
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataKnowledgeBaseArticleRepository : JpaRepository<KnowledgeBaseArticle, UUID> {
    fun findBySlug(slug: String): Optional<KnowledgeBaseArticle>
    fun findByStatus(status: ArticleStatus, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun findByCategory(category: ArticleCategory, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun findByCategoryAndStatus(category: ArticleCategory, status: ArticleStatus, pageable: Pageable): Page<KnowledgeBaseArticle>
    fun countByCategory(category: ArticleCategory): Long
    fun countByCategoryAndStatus(category: ArticleCategory, status: ArticleStatus): Long
    fun existsBySlug(slug: String): Boolean

    @Query(
        value = """
            SELECT * FROM knowledge_base_articles
            WHERE search_vector @@ plainto_tsquery('simple', :query)
            AND status = 'PUBLISHED'
            ORDER BY ts_rank(search_vector, plainto_tsquery('simple', :query)) DESC
        """,
        countQuery = """
            SELECT count(*) FROM knowledge_base_articles
            WHERE search_vector @@ plainto_tsquery('simple', :query)
            AND status = 'PUBLISHED'
        """,
        nativeQuery = true
    )
    fun search(@Param("query") query: String, pageable: Pageable): Page<KnowledgeBaseArticle>

    @Query(
        value = """
            SELECT * FROM knowledge_base_articles
            WHERE status = 'PUBLISHED'
            ORDER BY view_count DESC
            LIMIT :limit
        """,
        nativeQuery = true
    )
    fun findTopByViewCount(@Param("limit") limit: Int): List<KnowledgeBaseArticle>
}

@Repository
class JpaKnowledgeBaseArticleRepository(
    private val springDataRepository: SpringDataKnowledgeBaseArticleRepository
) : KnowledgeBaseArticleRepository {

    override fun save(article: KnowledgeBaseArticle): KnowledgeBaseArticle =
        springDataRepository.save(article)

    override fun findById(id: UUID): Optional<KnowledgeBaseArticle> =
        springDataRepository.findById(id)

    override fun findBySlug(slug: String): Optional<KnowledgeBaseArticle> =
        springDataRepository.findBySlug(slug)

    override fun findAll(pageable: Pageable): Page<KnowledgeBaseArticle> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: ArticleStatus, pageable: Pageable): Page<KnowledgeBaseArticle> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByCategory(category: ArticleCategory, pageable: Pageable): Page<KnowledgeBaseArticle> =
        springDataRepository.findByCategory(category, pageable)

    override fun findByCategoryAndStatus(category: ArticleCategory, status: ArticleStatus, pageable: Pageable): Page<KnowledgeBaseArticle> =
        springDataRepository.findByCategoryAndStatus(category, status, pageable)

    override fun search(query: String, pageable: Pageable): Page<KnowledgeBaseArticle> =
        springDataRepository.search(query, pageable)

    override fun findTopByViewCount(limit: Int): List<KnowledgeBaseArticle> =
        springDataRepository.findTopByViewCount(limit)

    override fun countByCategory(category: ArticleCategory): Long =
        springDataRepository.countByCategory(category)

    override fun countByCategoryAndStatus(category: ArticleCategory, status: ArticleStatus): Long =
        springDataRepository.countByCategoryAndStatus(category, status)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsBySlug(slug: String): Boolean =
        springDataRepository.existsBySlug(slug)
}
