package com.liyaqa.member.data.remote.api

import kotlinx.serialization.Serializable

/**
 * API error response
 */
@Serializable
data class ApiErrorResponse(
    val status: Int,
    val error: String,
    val errorAr: String? = null,
    val message: String,
    val messageAr: String? = null,
    val path: String? = null,
    val timestamp: String? = null
)

/**
 * API exception with bilingual messages
 */
class ApiException(
    val code: Int,
    override val message: String,
    val messageAr: String? = null,
    val error: String? = null,
    val errorAr: String? = null,
    cause: Throwable? = null
) : Exception(message, cause) {

    val isUnauthorized: Boolean get() = code == 401
    val isForbidden: Boolean get() = code == 403
    val isNotFound: Boolean get() = code == 404
    val isConflict: Boolean get() = code == 409
    val isRateLimited: Boolean get() = code == 429
    val isServerError: Boolean get() = code in 500..599

    companion object {
        fun fromResponse(response: ApiErrorResponse) = ApiException(
            code = response.status,
            message = response.message,
            messageAr = response.messageAr,
            error = response.error,
            errorAr = response.errorAr
        )

        fun networkError(cause: Throwable? = null) = ApiException(
            code = -1,
            message = "Network error. Please check your connection.",
            messageAr = "خطأ في الشبكة. يرجى التحقق من الاتصال.",
            cause = cause
        )

        fun unknownError(cause: Throwable? = null) = ApiException(
            code = -2,
            message = cause?.message ?: "An unexpected error occurred.",
            messageAr = "حدث خطأ غير متوقع.",
            cause = cause
        )
    }
}

/**
 * No network connection exception
 */
class NoNetworkException(
    override val message: String = "No network connection",
    val messageAr: String = "لا يوجد اتصال بالشبكة"
) : Exception(message)

/**
 * Session expired exception
 */
class SessionExpiredException(
    override val message: String = "Your session has expired. Please login again.",
    val messageAr: String = "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى."
) : Exception(message)
