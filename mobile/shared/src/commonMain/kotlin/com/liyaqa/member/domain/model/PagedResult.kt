package com.liyaqa.member.domain.model

/**
 * Generic pagination wrapper for list results.
 * Used by repositories returning paginated data from backend.
 *
 * @param T The type of items in the list
 * @property items The list of items for the current page
 * @property hasMore Whether there are more items available to fetch
 * @property totalCount The total count of items (optional, may not be provided by all endpoints)
 */
data class PagedResult<T>(
    val items: List<T>,
    val hasMore: Boolean,
    val totalCount: Long? = null
) {
    /**
     * Returns true if this is an empty result.
     */
    val isEmpty: Boolean
        get() = items.isEmpty()

    /**
     * Returns the number of items in this page.
     */
    val size: Int
        get() = items.size

    companion object {
        /**
         * Creates an empty PagedResult.
         */
        fun <T> empty(): PagedResult<T> = PagedResult(
            items = emptyList(),
            hasMore = false,
            totalCount = 0
        )
    }
}
