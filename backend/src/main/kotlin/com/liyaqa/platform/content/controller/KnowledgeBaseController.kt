package com.liyaqa.platform.content.controller

import com.liyaqa.platform.content.dto.ArticleFeedbackRequest
import com.liyaqa.platform.content.dto.ArticleResponse
import com.liyaqa.platform.content.dto.ArticleSummaryResponse
import com.liyaqa.platform.content.dto.CategoryCountResponse
import com.liyaqa.platform.content.dto.CreateArticleRequest
import com.liyaqa.platform.content.dto.UpdateArticleRequest
import com.liyaqa.platform.content.model.ArticleCategory
import com.liyaqa.platform.content.model.ArticleStatus
import com.liyaqa.platform.content.service.KnowledgeBaseService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/knowledge-base")
@PlatformSecured
@Tag(name = "Knowledge Base", description = "Manage knowledge base articles")
class KnowledgeBaseController(
    private val knowledgeBaseService: KnowledgeBaseService
) {

    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_MANAGE])
    @Operation(summary = "Create article", description = "Create a new knowledge base article")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Article created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun createArticle(
        @Valid @RequestBody request: CreateArticleRequest
    ): ResponseEntity<ArticleResponse> {
        val article = knowledgeBaseService.createArticle(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(article)
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "Get article by ID", description = "Retrieve a knowledge base article by its unique identifier")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Article found"),
        ApiResponse(responseCode = "404", description = "Article not found")
    )
    fun getArticle(@PathVariable id: UUID): ResponseEntity<ArticleResponse> {
        return ResponseEntity.ok(knowledgeBaseService.getArticle(id))
    }

    @GetMapping("/slug/{slug}")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "Get article by slug", description = "Retrieve a knowledge base article by its URL slug")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Article found"),
        ApiResponse(responseCode = "404", description = "Article not found")
    )
    fun getArticleBySlug(@PathVariable slug: String): ResponseEntity<ArticleResponse> {
        return ResponseEntity.ok(knowledgeBaseService.getArticleBySlug(slug))
    }

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "List articles", description = "List knowledge base articles with optional filtering by category and status")
    @ApiResponse(responseCode = "200", description = "Articles retrieved successfully")
    fun listArticles(
        @RequestParam(required = false) category: ArticleCategory?,
        @RequestParam(required = false) status: ArticleStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDirection: String
    ): ResponseEntity<PageResponse<ArticleSummaryResponse>> {
        val sort = if (sortDirection.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size.coerceAtMost(100), sort)
        val result = knowledgeBaseService.listArticles(category, status, pageable)
        return ResponseEntity.ok(PageResponse.from(result))
    }

    @GetMapping("/search")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "Search articles", description = "Search knowledge base articles by query string")
    @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
    fun searchArticles(
        @RequestParam("q") query: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ArticleSummaryResponse>> {
        val pageable = PageRequest.of(page, size.coerceAtMost(100))
        val result = knowledgeBaseService.searchArticles(query, pageable)
        return ResponseEntity.ok(PageResponse.from(result))
    }

    @GetMapping("/categories")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "Get categories", description = "Retrieve all article categories with their article counts")
    @ApiResponse(responseCode = "200", description = "Categories retrieved successfully")
    fun getCategories(): ResponseEntity<List<CategoryCountResponse>> {
        return ResponseEntity.ok(knowledgeBaseService.getCategoriesWithCounts())
    }

    @GetMapping("/popular")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "Get popular articles", description = "Retrieve the most popular knowledge base articles by view count")
    @ApiResponse(responseCode = "200", description = "Popular articles retrieved successfully")
    fun getPopularArticles(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<ArticleSummaryResponse>> {
        return ResponseEntity.ok(knowledgeBaseService.getPopularArticles(limit.coerceAtMost(50)))
    }

    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_MANAGE])
    @Operation(summary = "Update article", description = "Update an existing knowledge base article")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Article updated successfully"),
        ApiResponse(responseCode = "404", description = "Article not found")
    )
    fun updateArticle(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateArticleRequest
    ): ResponseEntity<ArticleResponse> {
        return ResponseEntity.ok(knowledgeBaseService.updateArticle(id, request))
    }

    @DeleteMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_MANAGE])
    @Operation(summary = "Delete article", description = "Delete a knowledge base article by its ID")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Article deleted successfully"),
        ApiResponse(responseCode = "404", description = "Article not found")
    )
    fun deleteArticle(@PathVariable id: UUID): ResponseEntity<Unit> {
        knowledgeBaseService.deleteArticle(id)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{id}/feedback")
    @PlatformSecured(permissions = [PlatformPermission.KNOWLEDGE_BASE_VIEW])
    @Operation(summary = "Submit feedback", description = "Submit feedback (helpful/not helpful) for a knowledge base article")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Feedback submitted successfully"),
        ApiResponse(responseCode = "404", description = "Article not found")
    )
    fun submitFeedback(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ArticleFeedbackRequest
    ): ResponseEntity<ArticleResponse> {
        return ResponseEntity.ok(knowledgeBaseService.submitFeedback(id, request))
    }
}
