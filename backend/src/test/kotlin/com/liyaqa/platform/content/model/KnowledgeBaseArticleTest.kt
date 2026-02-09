package com.liyaqa.platform.content.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.util.UUID

class KnowledgeBaseArticleTest {

    @Test
    fun `generateSlug should convert title to lowercase hyphenated slug`() {
        val slug = KnowledgeBaseArticle.generateSlug("Getting Started Guide")
        assertEquals("getting-started-guide", slug)
    }

    @Test
    fun `generateSlug should remove special characters`() {
        val slug = KnowledgeBaseArticle.generateSlug("Billing & Invoices FAQ")
        assertEquals("billing-invoices-faq", slug)
    }

    @Test
    fun `generateSlug should collapse multiple spaces to single hyphen`() {
        val slug = KnowledgeBaseArticle.generateSlug("Hello   World   Test")
        assertEquals("hello-world-test", slug)
    }

    @Test
    fun `generateSlug should truncate long titles to 63 characters`() {
        val longTitle = "This is a very long title that exceeds the maximum allowed length for a slug and should be truncated"
        val slug = KnowledgeBaseArticle.generateSlug(longTitle)
        assert(slug.length <= 63)
        assert(!slug.endsWith("-"))
    }

    @Test
    fun `create factory should set DRAFT status by default`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID()
        )
        assertEquals(ArticleStatus.DRAFT, article.status)
        assertNull(article.publishedAt)
    }

    @Test
    fun `create factory with PUBLISHED status should set publishedAt`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID(),
            status = ArticleStatus.PUBLISHED
        )
        assertEquals(ArticleStatus.PUBLISHED, article.status)
        assertNotNull(article.publishedAt)
    }

    @Test
    fun `publish should set PUBLISHED status and publishedAt`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID()
        )
        assertNull(article.publishedAt)

        article.publish()

        assertEquals(ArticleStatus.PUBLISHED, article.status)
        assertNotNull(article.publishedAt)
    }

    @Test
    fun `archive should set ARCHIVED status`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID()
        )

        article.archive()

        assertEquals(ArticleStatus.ARCHIVED, article.status)
    }

    @Test
    fun `incrementViewCount should increment by 1`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID()
        )
        assertEquals(0, article.viewCount)

        article.incrementViewCount()

        assertEquals(1, article.viewCount)
    }

    @Test
    fun `markHelpful should increment helpfulCount`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID()
        )
        assertEquals(0, article.helpfulCount)

        article.markHelpful()

        assertEquals(1, article.helpfulCount)
    }

    @Test
    fun `markNotHelpful should increment notHelpfulCount`() {
        val article = KnowledgeBaseArticle.create(
            title = "Test Article",
            content = "Test content",
            category = ArticleCategory.FAQ,
            authorId = UUID.randomUUID()
        )
        assertEquals(0, article.notHelpfulCount)

        article.markNotHelpful()

        assertEquals(1, article.notHelpfulCount)
    }
}
