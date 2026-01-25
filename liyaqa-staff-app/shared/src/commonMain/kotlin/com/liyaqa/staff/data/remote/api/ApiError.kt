package com.liyaqa.staff.data.remote.api

import kotlinx.serialization.Serializable

@Serializable
data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, String>? = null
)

class ApiException(
    val code: String,
    override val message: String,
    val statusCode: Int = 0
) : Exception(message)

class UnauthorizedException(message: String = "Unauthorized") : Exception(message)
class NetworkException(message: String = "Network error") : Exception(message)
