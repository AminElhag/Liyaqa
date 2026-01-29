package com.liyaqa.shared.api

import org.springframework.data.domain.Page

/**
 * Shared page response DTO for paginated API responses.
 */
data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean = false,
    val last: Boolean = false
) {
    /**
     * Secondary constructor that computes first/last from page and totalPages.
     */
    constructor(
        content: List<T>,
        totalElements: Long,
        totalPages: Int,
        page: Int,
        size: Int
    ) : this(
        content = content,
        page = page,
        size = size,
        totalElements = totalElements,
        totalPages = totalPages,
        first = page == 0,
        last = page >= totalPages - 1 || totalPages == 0
    )

    companion object {
        /**
         * Create a PageResponse from a Spring Data Page.
         */
        fun <T : Any, R : Any> from(page: Page<T>, mapper: (T) -> R): PageResponse<R> {
            return PageResponse(
                content = page.content.map(mapper),
                page = page.number,
                size = page.size,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                first = page.isFirst,
                last = page.isLast
            )
        }

        /**
         * Create a PageResponse from a Spring Data Page without transformation.
         */
        fun <T : Any> from(page: Page<T>): PageResponse<T> {
            return PageResponse(
                content = page.content,
                page = page.number,
                size = page.size,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                first = page.isFirst,
                last = page.isLast
            )
        }
    }
}
