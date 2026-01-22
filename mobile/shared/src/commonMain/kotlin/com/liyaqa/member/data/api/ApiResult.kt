package com.liyaqa.member.data.api

/**
 * Sealed class representing the result of an API call.
 * Provides type-safe handling of success, error, and network failure cases.
 */
sealed class ApiResult<out T> {

    /**
     * Successful API response with data.
     */
    data class Success<T>(val data: T) : ApiResult<T>()

    /**
     * API error response with HTTP status code and message.
     */
    data class Error(
        val code: Int,
        val message: String,
        val errorBody: String? = null
    ) : ApiResult<Nothing>()

    /**
     * Network or connection error.
     */
    data class NetworkError(
        val throwable: Throwable
    ) : ApiResult<Nothing>()

    /**
     * Returns true if this is a successful result.
     */
    val isSuccess: Boolean
        get() = this is Success

    /**
     * Returns true if this is an error result (API or network).
     */
    val isError: Boolean
        get() = this is Error || this is NetworkError

    /**
     * Returns the data if successful, null otherwise.
     */
    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }

    /**
     * Returns the data if successful, throws exception otherwise.
     */
    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw ApiException(code, message)
        is NetworkError -> throw throwable
    }

    /**
     * Returns the data if successful, or the default value otherwise.
     */
    fun getOrDefault(defaultValue: @UnsafeVariance T): T = when (this) {
        is Success -> data
        else -> defaultValue
    }

    /**
     * Returns the data if successful, or the result of the block otherwise.
     */
    inline fun getOrElse(block: (ApiResult<Nothing>) -> @UnsafeVariance T): T = when (this) {
        is Success -> data
        is Error -> block(this)
        is NetworkError -> block(this)
    }

    /**
     * Transforms the success data using the given function.
     */
    inline fun <R> map(transform: (T) -> R): ApiResult<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        is NetworkError -> this
    }

    /**
     * Transforms the success data using the given function that returns an ApiResult.
     */
    inline fun <R> flatMap(transform: (T) -> ApiResult<R>): ApiResult<R> = when (this) {
        is Success -> transform(data)
        is Error -> this
        is NetworkError -> this
    }

    /**
     * Executes the given block if this is a success.
     */
    inline fun onSuccess(block: (T) -> Unit): ApiResult<T> {
        if (this is Success) block(data)
        return this
    }

    /**
     * Executes the given block if this is an error.
     */
    inline fun onError(block: (Error) -> Unit): ApiResult<T> {
        if (this is Error) block(this)
        return this
    }

    /**
     * Executes the given block if this is a network error.
     */
    inline fun onNetworkError(block: (NetworkError) -> Unit): ApiResult<T> {
        if (this is NetworkError) block(this)
        return this
    }

    /**
     * Executes the given block for any failure (error or network error).
     */
    inline fun onFailure(block: (ApiResult<Nothing>) -> Unit): ApiResult<T> {
        when (this) {
            is Error -> block(this)
            is NetworkError -> block(this)
            else -> {}
        }
        return this
    }

    companion object {
        /**
         * Creates a successful result.
         */
        fun <T> success(data: T): ApiResult<T> = Success(data)

        /**
         * Creates an error result.
         */
        fun error(code: Int, message: String, errorBody: String? = null): ApiResult<Nothing> =
            Error(code, message, errorBody)

        /**
         * Creates a network error result.
         */
        fun networkError(throwable: Throwable): ApiResult<Nothing> =
            NetworkError(throwable)
    }
}

/**
 * Exception thrown when API returns an error.
 */
class ApiException(
    val code: Int,
    override val message: String
) : Exception(message)

/**
 * Common HTTP error codes for easy reference.
 */
object HttpStatusCode {
    const val OK = 200
    const val CREATED = 201
    const val NO_CONTENT = 204
    const val BAD_REQUEST = 400
    const val UNAUTHORIZED = 401
    const val FORBIDDEN = 403
    const val NOT_FOUND = 404
    const val CONFLICT = 409
    const val UNPROCESSABLE_ENTITY = 422
    const val TOO_MANY_REQUESTS = 429
    const val INTERNAL_SERVER_ERROR = 500
    const val BAD_GATEWAY = 502
    const val SERVICE_UNAVAILABLE = 503
    const val GATEWAY_TIMEOUT = 504
}

/**
 * Error response from the backend API.
 * Matches the structure from GlobalExceptionHandler.
 */
@kotlinx.serialization.Serializable
data class ApiErrorResponse(
    val error: String,
    val message: String,
    val details: Map<String, String>? = null
)

/**
 * Extension function to convert ApiResult to Kotlin Result.
 * Useful for repository implementations.
 *
 * @param mapper Function to transform success data to desired type
 * @return Result<R> containing either the mapped data or an exception
 */
fun <T, R> ApiResult<T>.toResult(mapper: (T) -> R): Result<R> = when (this) {
    is ApiResult.Success -> Result.success(mapper(data))
    is ApiResult.Error -> Result.failure(ApiException(code, message))
    is ApiResult.NetworkError -> Result.failure(throwable)
}

/**
 * Extension function to convert ApiResult to Kotlin Result without mapping.
 * Useful when the type doesn't need transformation.
 *
 * @return Result<T> containing either the data or an exception
 */
fun <T> ApiResult<T>.toResult(): Result<T> = when (this) {
    is ApiResult.Success -> Result.success(data)
    is ApiResult.Error -> Result.failure(ApiException(code, message))
    is ApiResult.NetworkError -> Result.failure(throwable)
}
