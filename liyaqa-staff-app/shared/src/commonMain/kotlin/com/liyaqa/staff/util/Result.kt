package com.liyaqa.staff.util

/**
 * A sealed class representing the result of an operation that can either succeed or fail.
 */
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    data object Loading : Result<Nothing>()

    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    val isLoading: Boolean get() = this is Loading

    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }

    fun exceptionOrNull(): Throwable? = when (this) {
        is Error -> exception
        else -> null
    }

    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        Loading -> Loading
    }

    inline fun <R> fold(
        onSuccess: (T) -> R,
        onError: (Throwable) -> R,
        onLoading: () -> R
    ): R = when (this) {
        is Success -> onSuccess(data)
        is Error -> onError(exception)
        Loading -> onLoading()
    }

    companion object {
        inline fun <T> runCatching(block: () -> T): Result<T> {
            return try {
                Success(block())
            } catch (e: Throwable) {
                Error(e)
            }
        }
    }
}
