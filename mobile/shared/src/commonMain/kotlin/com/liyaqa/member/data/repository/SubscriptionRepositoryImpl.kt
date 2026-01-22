package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.SubscriptionRepository

/**
 * Implementation of SubscriptionRepository using MemberApiService.
 * Includes in-memory caching for subscription data.
 */
class SubscriptionRepositoryImpl(
    private val api: MemberApiService
) : SubscriptionRepository {

    private var cachedSubscription: Subscription? = null

    override suspend fun getSubscription(): Result<Subscription> {
        return api.getSubscription().toResult { dto ->
            dto.toDomain().also { cachedSubscription = it }
        }
    }

    override suspend fun getSubscriptionHistory(): Result<List<Subscription>> {
        return api.getSubscriptionHistory().toResult { list ->
            list.map { it.toDomain() }
        }
    }

    override fun getCachedSubscription(): Subscription? = cachedSubscription

    override suspend fun clearCache() {
        cachedSubscription = null
    }
}
