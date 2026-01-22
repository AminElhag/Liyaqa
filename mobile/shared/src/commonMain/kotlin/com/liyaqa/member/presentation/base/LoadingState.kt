package com.liyaqa.member.presentation.base

/**
 * Represents the loading state of a data operation.
 * Use this sealed interface in UI state classes to track loading progress.
 *
 * Usage example:
 * ```kotlin
 * data class DashboardState(
 *     val loading: LoadingState = LoadingState.Idle,
 *     val data: DashboardData? = null
 * )
 *
 * // In composable:
 * when (state.loading) {
 *     is LoadingState.Loading -> LoadingIndicator()
 *     is LoadingState.Error -> ErrorMessage(state.loading.message)
 *     is LoadingState.Success -> Content(state.data)
 *     is LoadingState.Idle -> { /* Initial state */ }
 * }
 * ```
 */
sealed interface LoadingState {
    /**
     * Initial state before any operation has started.
     */
    data object Idle : LoadingState

    /**
     * Loading is in progress.
     * Optional [message] can provide loading context (e.g., "Loading dashboard...").
     */
    data class Loading(val message: String? = null) : LoadingState

    /**
     * Operation completed with an error.
     * @param message Human-readable error message to display
     * @param throwable Optional exception for logging/debugging
     * @param isRetryable Whether the operation can be retried
     */
    data class Error(
        val message: String,
        val throwable: Throwable? = null,
        val isRetryable: Boolean = true
    ) : LoadingState

    /**
     * Operation completed successfully.
     */
    data object Success : LoadingState

    /**
     * Helper properties for common checks.
     */
    companion object {
        /**
         * Creates an Error state from a Throwable.
         */
        fun fromError(
            throwable: Throwable,
            defaultMessage: String = "An error occurred"
        ): Error = Error(
            message = throwable.message ?: defaultMessage,
            throwable = throwable
        )

        /**
         * Creates a Loading state with a message.
         */
        fun loading(message: String? = null): Loading = Loading(message)
    }
}

/**
 * Extension property to check if currently loading.
 */
val LoadingState.isLoading: Boolean
    get() = this is LoadingState.Loading

/**
 * Extension property to check if in error state.
 */
val LoadingState.isError: Boolean
    get() = this is LoadingState.Error

/**
 * Extension property to check if operation succeeded.
 */
val LoadingState.isSuccess: Boolean
    get() = this is LoadingState.Success

/**
 * Extension property to check if in idle state.
 */
val LoadingState.isIdle: Boolean
    get() = this is LoadingState.Idle

/**
 * Extension property to get error message if in error state.
 */
val LoadingState.errorMessage: String?
    get() = (this as? LoadingState.Error)?.message

/**
 * Represents the result of an async operation with data.
 * Alternative to LoadingState when you need to track both loading and data.
 *
 * @param T The type of data being loaded
 */
sealed interface AsyncResult<out T> {
    /**
     * Initial state, no operation started.
     */
    data object Idle : AsyncResult<Nothing>

    /**
     * Loading is in progress.
     * @param previousData Optional previous data to show during reload
     */
    data class Loading<T>(val previousData: T? = null) : AsyncResult<T>

    /**
     * Operation completed successfully with data.
     * @param data The loaded data
     */
    data class Success<T>(val data: T) : AsyncResult<T>

    /**
     * Operation failed with an error.
     * @param message Error message
     * @param previousData Optional previous data to keep showing
     */
    data class Error<T>(
        val message: String,
        val previousData: T? = null
    ) : AsyncResult<T>
}

/**
 * Extension to get data from AsyncResult if available.
 */
val <T> AsyncResult<T>.dataOrNull: T?
    get() = when (this) {
        is AsyncResult.Success -> data
        is AsyncResult.Loading -> previousData
        is AsyncResult.Error -> previousData
        is AsyncResult.Idle -> null
    }

/**
 * Extension to check if AsyncResult is loading.
 */
val <T> AsyncResult<T>.isLoading: Boolean
    get() = this is AsyncResult.Loading

/**
 * Extension to check if AsyncResult has succeeded.
 */
val <T> AsyncResult<T>.isSuccess: Boolean
    get() = this is AsyncResult.Success
