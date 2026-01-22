package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.MySubscriptionDto
import com.liyaqa.member.data.dto.SubscriptionLiteDto
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus

/**
 * Mappers for subscription-related DTOs to domain models.
 */

/**
 * Maps MySubscriptionDto (full subscription) to domain Subscription.
 */
fun MySubscriptionDto.toDomain(): Subscription = Subscription(
    id = id,
    planName = planName.toDomain(),
    status = try {
        SubscriptionStatus.valueOf(status)
    } catch (e: IllegalArgumentException) {
        SubscriptionStatus.ACTIVE
    },
    startDate = startDate.toLocalDate(),
    endDate = endDate.toLocalDate(),
    daysRemaining = daysRemaining,
    classesRemaining = classesRemaining,
    totalClasses = totalClasses,
    autoRenew = autoRenew,
    frozenUntil = frozenUntil?.toLocalDateOrNull(),
    isExpiringSoon = isExpiringSoon
)

/**
 * Maps SubscriptionLiteDto to domain Subscription.
 * Note: Some fields are not available in lite response.
 */
fun SubscriptionLiteDto.toDomain(): Subscription = Subscription(
    id = id,
    planName = planName.toDomain(),
    status = try {
        SubscriptionStatus.valueOf(status)
    } catch (e: IllegalArgumentException) {
        SubscriptionStatus.ACTIVE
    },
    startDate = startDate.toLocalDate(),
    endDate = endDate.toLocalDate(),
    daysRemaining = daysRemaining,
    classesRemaining = classesRemaining,
    totalClasses = null, // Not in lite response
    autoRenew = false, // Not in lite response
    frozenUntil = null, // Not in lite response
    isExpiringSoon = daysRemaining <= 7 // Infer from daysRemaining
)
