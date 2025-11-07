package com.liyaqa.dashboard.features.member.data.repository

import com.liyaqa.dashboard.core.data.BaseRepository
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.domain.map
import com.liyaqa.dashboard.core.network.NetworkConfig
import com.liyaqa.dashboard.features.member.data.dto.*
import com.liyaqa.dashboard.features.member.domain.model.Member
import com.liyaqa.dashboard.features.member.domain.model.MembershipPlan
import com.liyaqa.dashboard.features.member.domain.model.MembershipSubscription
import io.ktor.client.HttpClient

/**
 * Repository for member operations
 */
class MemberRepository(
    httpClient: HttpClient
) : BaseRepository(httpClient) {

    // Member Operations
    suspend fun getMembers(
        page: Int = 0,
        size: Int = 20,
        search: String? = null,
        status: String? = null
    ): Result<MemberPageResponse> {
        val params = buildMap {
            put("page", page.toString())
            put("size", size.toString())
            search?.let { put("search", it) }
            status?.let { put("status", it) }
        }
        return get(NetworkConfig.Endpoints.MEMBERS, params)
    }

    suspend fun getMemberById(id: String): Result<Member> {
        return get<MemberDto>("${NetworkConfig.Endpoints.MEMBERS}/$id")
            .map { it.toDomain() }
    }

    suspend fun createMember(request: CreateMemberRequest): Result<Member> {
        return post<MemberDto, CreateMemberRequest>(
            NetworkConfig.Endpoints.MEMBERS,
            request
        ).map { it.toDomain() }
    }

    suspend fun updateMember(id: String, request: UpdateMemberRequest): Result<Member> {
        return put<MemberDto, UpdateMemberRequest>(
            "${NetworkConfig.Endpoints.MEMBERS}/$id",
            request
        ).map { it.toDomain() }
    }

    suspend fun deleteMember(id: String): Result<Unit> {
        return delete("${NetworkConfig.Endpoints.MEMBERS}/$id")
    }

    // Membership Plan Operations
    suspend fun getMembershipPlans(
        page: Int = 0,
        size: Int = 20,
        status: String? = null
    ): Result<MembershipPlanPageResponse> {
        val params = buildMap {
            put("page", page.toString())
            put("size", size.toString())
            status?.let { put("status", it) }
        }
        return get(NetworkConfig.Endpoints.MEMBERSHIPS, params)
    }

    suspend fun getMembershipPlanById(id: String): Result<MembershipPlan> {
        return get<MembershipPlanDto>("${NetworkConfig.Endpoints.MEMBERSHIPS}/$id")
            .map { it.toDomain() }
    }

    suspend fun createMembershipPlan(request: CreateMembershipPlanRequest): Result<MembershipPlan> {
        return post<MembershipPlanDto, CreateMembershipPlanRequest>(
            NetworkConfig.Endpoints.MEMBERSHIPS,
            request
        ).map { it.toDomain() }
    }

    // Subscription Operations
    suspend fun subscribeToPlan(memberId: String, request: SubscribeToPlanRequest): Result<MembershipSubscription> {
        return post<MembershipSubscriptionDto, SubscribeToPlanRequest>(
            "${NetworkConfig.Endpoints.MEMBERS}/$memberId/subscribe",
            request
        ).map { it.toDomain() }
    }
}
