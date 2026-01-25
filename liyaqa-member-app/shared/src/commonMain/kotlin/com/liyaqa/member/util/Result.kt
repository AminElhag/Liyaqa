package com.liyaqa.member.util

/**
 * A sealed class representing the result of an operation.
 * Provides a type-safe way to handle success and error cases.
 */
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(
        val exception: Throwable? = null,
        val message: String? = null,
        val messageAr: String? = null,
        val code: Int? = null
    ) : Result<Nothing>()

    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error

    fun getOrNull(): T? = when (this) {
        is Success -> data
        is Error -> null
    }

    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw exception ?: Exception(message ?: "Unknown error")
    }

    fun getOrDefault(default: @UnsafeVariance T): T = when (this) {
        is Success -> data
        is Error -> default
    }

    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
    }

    inline fun <R> flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
        is Success -> transform(data)
        is Error -> this
    }

    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }

    inline fun onError(action: (Error) -> Unit): Result<T> {
        if (this is Error) action(this)
        return this
    }

    companion object {
        fun <T> success(data: T): Result<T> = Success(data)

        fun error(
            exception: Throwable? = null,
            message: String? = null,
            messageAr: String? = null,
            code: Int? = null
        ): Result<Nothing> = Error(exception, message, messageAr, code)

        inline fun <T> runCatching(block: () -> T): Result<T> = try {
            Success(block())
        } catch (e: Throwable) {
            Error(exception = e, message = e.message)
        }

        suspend inline fun <T> runCatchingSuspend(crossinline block: suspend () -> T): Result<T> = try {
            Success(block())
        } catch (e: Throwable) {
            Error(exception = e, message = e.message)
        }
    }
}
