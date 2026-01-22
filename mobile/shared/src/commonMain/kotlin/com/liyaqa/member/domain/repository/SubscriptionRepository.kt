package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Subscription

/**
 * Repository for subscription operations.
 * Provides subscription data with caching support.
 */
interface SubscriptionRepository {

    /**
     * Fetches the current member's active subscription.
     * Result is cached for subsequent calls.
     */
    suspend fun getSubscription(): Result<Subscription>

    /**
     * Fetches the member's subscription history.
     */
    suspend fun getSubscriptionHistory(): Result<List<Subscription>>

    /**
     * Returns the cached subscription if available.
     */
    fun getCachedSubscription(): Subscription?

    /**
     * Clears the subscription cache.
     */
    suspend fun clearCache()
}
