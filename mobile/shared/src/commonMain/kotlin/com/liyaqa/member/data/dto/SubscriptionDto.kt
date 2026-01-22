package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Subscription DTOs matching backend subscription-related responses.
 */

/**
 * Full subscription response from GET /api/me/subscription.
 * Matches backend SubscriptionDetailResponse.
 */
@Serializable
data class MySubscriptionDto(
    val id: String,
    val planId: String,
    val planName: LocalizedTextDto,
    val status: String,
    val startDate: String,
    val endDate: String,
    val daysRemaining: Int,
    val classesRemaining: Int? = null,
    val totalClasses: Int? = null,
    val autoRenew: Boolean,
    val frozenUntil: String? = null,
    val isExpiringSoon: Boolean,
    val price: MoneyDto? = null
)

/**
 * Subscription lite response for history list.
 * Matches backend SubscriptionLiteResponse.
 */
@Serializable
data class SubscriptionLiteDto(
    val id: String,
    val planName: LocalizedTextDto,
    val status: String,
    val startDate: String,
    val endDate: String,
    val daysRemaining: Int,
    val classesRemaining: Int? = null
)
