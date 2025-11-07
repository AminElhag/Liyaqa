package com.liyaqa.dashboard.features.member.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.member.data.dto.MembershipPlanPageResponse
import com.liyaqa.dashboard.features.member.data.repository.MemberRepository

class GetMembershipPlansUseCase(
    private val repository: MemberRepository
) : BaseUseCase<GetMembershipPlansUseCase.Params, MembershipPlanPageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val status: String? = null
    )

    override suspend fun execute(params: Params): Result<MembershipPlanPageResponse> {
        return repository.getMembershipPlans(
            page = params.page,
            size = params.size,
            status = params.status
        )
    }
}
