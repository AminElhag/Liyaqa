package com.liyaqa.member.presentation.base

/**
 * Represents the state of a paginated list.
 * Handles infinite scroll / load more patterns.
 *
 * @param T The type of items in the list
 *
 * Usage example:
 * ```kotlin
 * data class BookingsState(
 *     val upcomingBookings: PaginationState<Booking> = PaginationState(),
 *     val pastBookings: PaginationState<Booking> = PaginationState()
 * )
 *
 * // In ViewModel:
 * override fun onIntent(intent: BookingsIntent) {
 *     when (intent) {
 *         is BookingsIntent.LoadMore -> loadMore()
 *     }
 * }
 *
 * private fun loadMore() {
 *     if (!currentState.upcomingBookings.canLoadMore) return
 *     updateState { copy(upcomingBookings = upcomingBookings.withLoadingMore()) }
 *     // ... fetch next page
 *     updateState {
 *         copy(upcomingBookings = upcomingBookings.withNewItems(newItems, hasMore))
 *     }
 * }
 * ```
 */
data class PaginationState<T>(
    /**
     * The list of loaded items.
     */
    val items: List<T> = emptyList(),

    /**
     * Current page number (0-indexed).
     */
    val page: Int = 0,

    /**
     * Whether there are more items to load.
     */
    val hasMore: Boolean = true,

    /**
     * Whether currently loading more items.
     */
    val isLoadingMore: Boolean = false,

    /**
     * Initial loading state (first page).
     */
    val isInitialLoading: Boolean = false,

    /**
     * Error that occurred during loading.
     */
    val error: String? = null,

    /**
     * Total count of items (if known from backend).
     */
    val totalCount: Long? = null,

    /**
     * Whether currently refreshing (pull-to-refresh).
     */
    val isRefreshing: Boolean = false
) {
    /**
     * Whether the list is empty and not loading.
     */
    val isEmpty: Boolean
        get() = items.isEmpty() && !isInitialLoading && !isRefreshing

    /**
     * Whether more items can be loaded.
     */
    val canLoadMore: Boolean
        get() = hasMore && !isLoadingMore && !isInitialLoading && error == null

    /**
     * The number of loaded items.
     */
    val itemCount: Int
        get() = items.size

    /**
     * The next page number to load.
     */
    val nextPage: Int
        get() = page + 1

    /**
     * Creates a new state with initial loading started.
     */
    fun withInitialLoading(): PaginationState<T> = copy(
        isInitialLoading = true,
        error = null
    )

    /**
     * Creates a new state with load more started.
     */
    fun withLoadingMore(): PaginationState<T> = copy(
        isLoadingMore = true,
        error = null
    )

    /**
     * Creates a new state with refresh started.
     */
    fun withRefreshing(): PaginationState<T> = copy(
        isRefreshing = true,
        error = null
    )

    /**
     * Creates a new state with initial items loaded (first page).
     */
    fun withInitialItems(
        newItems: List<T>,
        hasMore: Boolean,
        totalCount: Long? = null
    ): PaginationState<T> = copy(
        items = newItems,
        page = 0,
        hasMore = hasMore,
        isInitialLoading = false,
        isRefreshing = false,
        error = null,
        totalCount = totalCount
    )

    /**
     * Creates a new state with additional items appended.
     */
    fun withNewItems(
        newItems: List<T>,
        hasMore: Boolean,
        totalCount: Long? = null
    ): PaginationState<T> = copy(
        items = items + newItems,
        page = page + 1,
        hasMore = hasMore,
        isLoadingMore = false,
        error = null,
        totalCount = totalCount ?: this.totalCount
    )

    /**
     * Creates a new state after refresh with new items replacing old ones.
     */
    fun withRefreshedItems(
        newItems: List<T>,
        hasMore: Boolean,
        totalCount: Long? = null
    ): PaginationState<T> = copy(
        items = newItems,
        page = 0,
        hasMore = hasMore,
        isRefreshing = false,
        isInitialLoading = false,
        error = null,
        totalCount = totalCount
    )

    /**
     * Creates a new state with an error.
     */
    fun withError(message: String): PaginationState<T> = copy(
        isInitialLoading = false,
        isLoadingMore = false,
        isRefreshing = false,
        error = message
    )

    /**
     * Creates a new state with error cleared.
     */
    fun withErrorCleared(): PaginationState<T> = copy(error = null)

    /**
     * Creates a new state with an item updated.
     */
    inline fun withItemUpdated(predicate: (T) -> Boolean, update: (T) -> T): PaginationState<T> =
        copy(items = items.map { if (predicate(it)) update(it) else it })

    /**
     * Creates a new state with an item removed.
     */
    inline fun withItemRemoved(predicate: (T) -> Boolean): PaginationState<T> =
        copy(items = items.filterNot(predicate))

    /**
     * Creates a new state with an item added at the beginning.
     */
    fun withItemPrepended(item: T): PaginationState<T> = copy(
        items = listOf(item) + items,
        totalCount = totalCount?.plus(1)
    )

    /**
     * Creates a new state with an item added at the end.
     */
    fun withItemAppended(item: T): PaginationState<T> = copy(
        items = items + item,
        totalCount = totalCount?.plus(1)
    )

    /**
     * Resets the pagination state to initial values.
     */
    fun reset(): PaginationState<T> = PaginationState()

    companion object {
        /**
         * Creates an empty pagination state.
         */
        fun <T> empty(): PaginationState<T> = PaginationState()

        /**
         * Creates a pagination state with initial loading.
         */
        fun <T> loading(): PaginationState<T> = PaginationState<T>().withInitialLoading()

        /**
         * Creates a pagination state with items.
         */
        fun <T> withItems(
            items: List<T>,
            hasMore: Boolean = false,
            totalCount: Long? = null
        ): PaginationState<T> = PaginationState(
            items = items,
            hasMore = hasMore,
            totalCount = totalCount
        )
    }
}

/**
 * Default page size for pagination.
 */
const val DEFAULT_PAGE_SIZE = 20

/**
 * Extension to check if pagination should trigger initial load.
 */
val <T> PaginationState<T>.shouldLoadInitial: Boolean
    get() = items.isEmpty() && !isInitialLoading && error == null

/**
 * Extension to get the size parameter for API calls.
 */
fun <T> PaginationState<T>.getPageSize(defaultSize: Int = DEFAULT_PAGE_SIZE): Int = defaultSize
