package com.liyaqa.member.data.repository

import com.liyaqa.member.data.local.LiyaqaMemberDatabase
import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MemberAddress
import com.liyaqa.member.domain.model.MemberStatus
import com.liyaqa.member.domain.model.MySubscriptionResponse
import com.liyaqa.member.domain.model.UpdateProfileRequest
import com.liyaqa.member.util.Result
import com.liyaqa.member.domain.repository.MemberRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.datetime.Clock

class MemberRepositoryImpl(
    private val memberApi: MemberApi,
    private val database: LiyaqaMemberDatabase
) : MemberRepository {

    private val memberQueries = database.memberQueries
    private val subscriptionQueries = database.subscriptionQueries

    override fun getProfile(): Flow<Result<Member>> = flow {
        // First emit cached data if available
        val cached = memberQueries.selectMember().executeAsOneOrNull()
        if (cached != null) {
            emit(Result.success(cached.toDomain()))
        }

        // Then fetch fresh data
        memberApi.getProfile().onSuccess { member ->
            // Cache the member
            memberQueries.insertOrReplaceMember(
                id = member.id,
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone,
                dateOfBirth = member.dateOfBirth,
                street = member.address?.street,
                city = member.address?.city,
                state = member.address?.state,
                postalCode = member.address?.postalCode,
                country = member.address?.country,
                emergencyContactName = member.emergencyContactName,
                emergencyContactPhone = member.emergencyContactPhone,
                status = member.status.name,
                createdAt = member.createdAt,
                updatedAt = member.updatedAt,
                syncedAt = Clock.System.now().toEpochMilliseconds()
            )
            emit(Result.success(member))
        }.onError { error ->
            // If we had cached data, we already emitted it
            // Only emit error if we have no cached data
            if (cached == null) {
                emit(Result.error(
                    exception = error.exception,
                    message = error.message,
                    messageAr = error.messageAr
                ))
            }
        }
    }

    override suspend fun updateProfile(request: UpdateProfileRequest): Result<Member> {
        return memberApi.updateProfile(request).onSuccess { member ->
            // Update cache
            memberQueries.insertOrReplaceMember(
                id = member.id,
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone,
                dateOfBirth = member.dateOfBirth,
                street = member.address?.street,
                city = member.address?.city,
                state = member.address?.state,
                postalCode = member.address?.postalCode,
                country = member.address?.country,
                emergencyContactName = member.emergencyContactName,
                emergencyContactPhone = member.emergencyContactPhone,
                status = member.status.name,
                createdAt = member.createdAt,
                updatedAt = member.updatedAt,
                syncedAt = Clock.System.now().toEpochMilliseconds()
            )
        }
    }

    override fun getSubscription(): Flow<Result<MySubscriptionResponse>> = flow {
        // First emit cached data if available
        val cached = subscriptionQueries.selectSubscription().executeAsOneOrNull()
        if (cached != null) {
            emit(Result.success(MySubscriptionResponse(
                hasSubscription = true,
                subscription = cached.toDomain()
            )))
        }

        // Then fetch fresh data
        memberApi.getSubscription().onSuccess { response ->
            if (response.subscription != null) {
                val sub = response.subscription
                subscriptionQueries.insertOrReplaceSubscription(
                    id = sub.id,
                    planId = sub.planId,
                    planNameEn = sub.planName?.en,
                    planNameAr = sub.planName?.ar,
                    status = sub.status.name,
                    startDate = sub.startDate,
                    endDate = sub.endDate,
                    autoRenew = if (sub.autoRenew) 1L else 0L,
                    classesRemaining = sub.classesRemaining?.toLong(),
                    guestPassesRemaining = sub.guestPassesRemaining.toLong(),
                    freezeDaysRemaining = sub.freezeDaysRemaining.toLong(),
                    frozenAt = sub.frozenAt,
                    daysRemaining = sub.daysRemaining.toLong(),
                    syncedAt = Clock.System.now().toEpochMilliseconds()
                )
            } else {
                subscriptionQueries.deleteSubscription()
            }
            emit(Result.success(response))
        }.onError { error ->
            if (cached == null) {
                emit(Result.error(
                    exception = error.exception,
                    message = error.message,
                    messageAr = error.messageAr
                ))
            }
        }
    }

    override suspend fun refreshProfile(): Result<Member> {
        return memberApi.getProfile().onSuccess { member ->
            memberQueries.insertOrReplaceMember(
                id = member.id,
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone,
                dateOfBirth = member.dateOfBirth,
                street = member.address?.street,
                city = member.address?.city,
                state = member.address?.state,
                postalCode = member.address?.postalCode,
                country = member.address?.country,
                emergencyContactName = member.emergencyContactName,
                emergencyContactPhone = member.emergencyContactPhone,
                status = member.status.name,
                createdAt = member.createdAt,
                updatedAt = member.updatedAt,
                syncedAt = Clock.System.now().toEpochMilliseconds()
            )
        }
    }

    override suspend fun refreshSubscription(): Result<MySubscriptionResponse> {
        return memberApi.getSubscription().onSuccess { response ->
            if (response.subscription != null) {
                val sub = response.subscription
                subscriptionQueries.insertOrReplaceSubscription(
                    id = sub.id,
                    planId = sub.planId,
                    planNameEn = sub.planName?.en,
                    planNameAr = sub.planName?.ar,
                    status = sub.status.name,
                    startDate = sub.startDate,
                    endDate = sub.endDate,
                    autoRenew = if (sub.autoRenew) 1L else 0L,
                    classesRemaining = sub.classesRemaining?.toLong(),
                    guestPassesRemaining = sub.guestPassesRemaining.toLong(),
                    freezeDaysRemaining = sub.freezeDaysRemaining.toLong(),
                    frozenAt = sub.frozenAt,
                    daysRemaining = sub.daysRemaining.toLong(),
                    syncedAt = Clock.System.now().toEpochMilliseconds()
                )
            }
        }
    }

    // Extension functions for mapping
    private fun com.liyaqa.member.data.local.MemberEntity.toDomain() = Member(
        id = id,
        firstName = firstName,
        lastName = lastName,
        email = email,
        phone = phone,
        dateOfBirth = dateOfBirth,
        address = if (street != null || city != null) MemberAddress(
            street = street,
            city = city,
            state = state,
            postalCode = postalCode,
            country = country
        ) else null,
        emergencyContactName = emergencyContactName,
        emergencyContactPhone = emergencyContactPhone,
        status = MemberStatus.valueOf(status),
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun com.liyaqa.member.data.local.SubscriptionEntity.toDomain() =
        com.liyaqa.member.domain.model.Subscription(
            id = id,
            planId = planId,
            planName = if (planNameEn != null) com.liyaqa.member.domain.model.LocalizedText(
                en = planNameEn,
                ar = planNameAr
            ) else null,
            status = com.liyaqa.member.domain.model.SubscriptionStatus.valueOf(status),
            startDate = startDate,
            endDate = endDate,
            autoRenew = autoRenew == 1L,
            classesRemaining = classesRemaining?.toInt(),
            guestPassesRemaining = guestPassesRemaining.toInt(),
            freezeDaysRemaining = freezeDaysRemaining.toInt(),
            frozenAt = frozenAt,
            daysRemaining = daysRemaining.toInt()
        )
}
