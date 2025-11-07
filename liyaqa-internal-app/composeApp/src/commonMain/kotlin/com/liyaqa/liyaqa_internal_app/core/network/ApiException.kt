package com.liyaqa.liyaqa_internal_app.core.network

import io.ktor.client.plugins.*
import io.ktor.utils.io.errors.*
import kotlinx.serialization.Serializable

/**
 * Custom exception for API errors.
 * Mirrors backend's error response structure.
 */
sealed class ApiException(
    override val message: String,
    override val cause: Throwable? = null
) : Exception(message, cause) {

    data class NetworkError(
        override val message: String = "Network connection error",
        override val cause: Throwable? = null
    ) : ApiException(message, cause)

    data class ServerError(
        val code: Int,
        override val message: String = "Server error",
        val errorResponse: ErrorResponse? = null
    ) : ApiException(message)

    data class ClientError(
        val code: Int,
        override val message: String,
        val errorResponse: ErrorResponse? = null
    ) : ApiException(message)

    data class Unauthorized(
        override val message: String = "Unauthorized access"
    ) : ApiException(message)

    data class Forbidden(
        override val message: String = "Access forbidden"
    ) : ApiException(message)

    data class NotFound(
        override val message: String = "Resource not found"
    ) : ApiException(message)

    data class Timeout(
        override val message: String = "Request timeout"
    ) : ApiException(message)

    data class Unknown(
        override val message: String = "Unknown error occurred",
        override val cause: Throwable? = null
    ) : ApiException(message, cause)
}

/**
 * Error response structure matching backend
 */
@Serializable
data class ErrorResponse(
    val timestamp: String? = null,
    val status: Int? = null,
    val error: String? = null,
    val message: String? = null,
    val path: String? = null,
    val details: Map<String, String>? = null
)

/**
 * Convert throwable to ApiException
 */
fun Throwable.toApiException(): ApiException {
    return when (this) {
        is ApiException -> this
        is IOException -> ApiException.NetworkError(
            message = this.message ?: "Network error",
            cause = this
        )
        is HttpRequestTimeoutException -> ApiException.Timeout(
            message = "Request timeout"
        )
        is ResponseException -> {
            when (response.status.value) {
                401 -> ApiException.Unauthorized()
                403 -> ApiException.Forbidden()
                404 -> ApiException.NotFound()
                in 400..499 -> ApiException.ClientError(
                    code = response.status.value,
                    message = this.message ?: "Client error"
                )
                in 500..599 -> ApiException.ServerError(
                    code = response.status.value,
                    message = this.message ?: "Server error"
                )
                else -> ApiException.Unknown(
                    message = this.message ?: "Unknown error",
                    cause = this
                )
            }
        }
        else -> ApiException.Unknown(
            message = this.message ?: "Unknown error",
            cause = this
        )
    }
}
