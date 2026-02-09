package com.liyaqa.platform.content.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.liyaqa.platform.content.dto.ArticleFeedbackRequest
import com.liyaqa.platform.content.dto.CreateArticleRequest
import com.liyaqa.platform.content.dto.UpdateArticleRequest
import com.liyaqa.platform.content.exception.ArticleNotFoundException
import com.liyaqa.platform.content.model.ArticleCategory
import com.liyaqa.platform.content.model.ArticleStatus
import com.liyaqa.platform.content.model.KnowledgeBaseArticle
import com.liyaqa.platform.content.repository.KnowledgeBaseArticleRepository
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.mockito.junit.jupiter.MockitoSettings
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class KnowledgeBaseServiceTest {

    @Mock
    private lateinit var articleRepository: KnowledgeBaseArticleRepository

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var securityService: SecurityService

    private lateinit var objectMapper: ObjectMapper
    private lateinit var service: KnowledgeBaseService

    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        objectMapper = ObjectMapper().apply {
            registerModule(JavaTimeModule())
        }
        service = KnowledgeBaseService(articleRepository, auditService, securityService, objectMapper)
        whenever(securityService.getCurrentUserId()) doReturn userId
    }

    @Test
    fun `createArticle should create with DRAFT status and generate slug`() {
        val request = CreateArticleRequest(
            title = "Getting Started",
            content = "Welcome to the platform",
            category = ArticleCategory.GETTING_STARTED
        )
        whenever(articleRepository.existsBySlug(any())) doReturn false
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val result = service.createArticle(request)

        assertEquals("Getting Started", result.title)
        assertEquals(ArticleStatus.DRAFT, result.status)
        assertEquals("getting-started", result.slug)
        assertEquals(userId, result.authorId)
    }

    @Test
    fun `createArticle with PUBLISHED status should set publishedAt`() {
        val request = CreateArticleRequest(
            title = "Published Article",
            content = "Content here",
            category = ArticleCategory.FAQ,
            status = ArticleStatus.PUBLISHED
        )
        whenever(articleRepository.existsBySlug(any())) doReturn false
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val result = service.createArticle(request)

        assertEquals(ArticleStatus.PUBLISHED, result.status)
        assertNotNull(result.publishedAt)
    }

    @Test
    fun `createArticle should handle duplicate slug by appending random suffix`() {
        val request = CreateArticleRequest(
            title = "Duplicate Title",
            content = "Content",
            category = ArticleCategory.FAQ
        )
        whenever(articleRepository.existsBySlug("duplicate-title")) doReturn true
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val result = service.createArticle(request)

        assertTrue(result.slug.startsWith("duplicate-title-"))
        assertTrue(result.slug.length > "duplicate-title".length)
    }

    @Test
    fun `getArticle should return response`() {
        val article = createTestArticle()
        whenever(articleRepository.findById(article.id)) doReturn Optional.of(article)

        val result = service.getArticle(article.id)

        assertEquals(article.id, result.id)
        assertEquals(article.title, result.title)
    }

    @Test
    fun `getArticle should throw ArticleNotFoundException for missing ID`() {
        val id = UUID.randomUUID()
        whenever(articleRepository.findById(id)) doReturn Optional.empty()

        assertThrows(ArticleNotFoundException::class.java) {
            service.getArticle(id)
        }
    }

    @Test
    fun `updateArticle should partial update only changed fields`() {
        val article = createTestArticle()
        whenever(articleRepository.findById(article.id)) doReturn Optional.of(article)
        whenever(articleRepository.findBySlug(any())) doReturn Optional.empty()
        whenever(articleRepository.existsBySlug(any())) doReturn false
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val request = UpdateArticleRequest(title = "Updated Title")
        val result = service.updateArticle(article.id, request)

        assertEquals("Updated Title", result.title)
        assertEquals("Test content", result.content) // unchanged
    }

    @Test
    fun `updateArticle should set publishedAt when transitioning DRAFT to PUBLISHED`() {
        val article = createTestArticle()
        whenever(articleRepository.findById(article.id)) doReturn Optional.of(article)
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val request = UpdateArticleRequest(status = ArticleStatus.PUBLISHED)
        val result = service.updateArticle(article.id, request)

        assertEquals(ArticleStatus.PUBLISHED, result.status)
        assertNotNull(result.publishedAt)
    }

    @Test
    fun `updateArticle should throw ArticleNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(articleRepository.findById(id)) doReturn Optional.empty()

        assertThrows(ArticleNotFoundException::class.java) {
            service.updateArticle(id, UpdateArticleRequest(title = "New"))
        }
    }

    @Test
    fun `deleteArticle should delete and log audit`() {
        val article = createTestArticle()
        whenever(articleRepository.findById(article.id)) doReturn Optional.of(article)

        service.deleteArticle(article.id)

        verify(articleRepository).deleteById(article.id)
        verify(auditService).logAsync(
            action = any(),
            entityType = any(),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `submitFeedback helpful=true should increment helpfulCount`() {
        val article = createTestArticle()
        whenever(articleRepository.findById(article.id)) doReturn Optional.of(article)
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val result = service.submitFeedback(article.id, ArticleFeedbackRequest(helpful = true))

        assertEquals(1, result.helpfulCount)
    }

    @Test
    fun `submitFeedback helpful=false should increment notHelpfulCount`() {
        val article = createTestArticle()
        whenever(articleRepository.findById(article.id)) doReturn Optional.of(article)
        whenever(articleRepository.save(any<KnowledgeBaseArticle>())).thenAnswer { it.arguments[0] }

        val result = service.submitFeedback(article.id, ArticleFeedbackRequest(helpful = false))

        assertEquals(1, result.notHelpfulCount)
    }

    @Test
    fun `getCategoriesWithCounts should return all categories with counts`() {
        ArticleCategory.entries.forEach { category ->
            whenever(
                articleRepository.countByCategoryAndStatus(category, ArticleStatus.PUBLISHED)
            ) doReturn 5L
        }

        val result = service.getCategoriesWithCounts()

        assertEquals(ArticleCategory.entries.size, result.size)
        result.forEach { assertEquals(5L, it.count) }
    }

    @Test
    fun `searchArticles with blank query should return empty page`() {
        val pageable = PageRequest.of(0, 20)

        val result = service.searchArticles("", pageable)

        assertTrue(result.isEmpty)
    }

    @Test
    fun `searchArticles with query should delegate to repository`() {
        val pageable = PageRequest.of(0, 20)
        val article = createTestArticle()
        whenever(articleRepository.search("test", pageable)) doReturn PageImpl(listOf(article))

        val result = service.searchArticles("test", pageable)

        assertEquals(1, result.totalElements)
    }

    private fun createTestArticle(): KnowledgeBaseArticle {
        return KnowledgeBaseArticle(
            slug = "test-article",
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = userId
        )
    }
}
