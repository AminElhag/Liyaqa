package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Shared DTOs used across multiple API responses.
 * These match the backend common response types.
 */

/**
 * Bilingual text DTO matching backend LocalizedTextResponse.
 */
@Serializable
data class LocalizedTextDto(
    val en: String,
    val ar: String? = null
)

/**
 * Money DTO for currency amounts.
 */
@Serializable
data class MoneyDto(
    val amount: Double,
    val currency: String
)

/**
 * Generic paginated response for mobile endpoints.
 * Matches backend MobilePageResponse structure.
 *
 * Note: Backend uses 'items' (not 'content') and 'itemCount' (not 'size').
 */
@Serializable
data class MobilePageResponse<T>(
    val items: List<T>,
    val itemCount: Int,
    val hasMore: Boolean,
    val nextCursor: String? = null,
    val totalCount: Long? = null
)
