package com.liyaqa.dashboard.features.member.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.member.data.dto.MemberPageResponse
import com.liyaqa.dashboard.features.member.data.repository.MemberRepository

class GetMembersUseCase(
    private val repository: MemberRepository
) : BaseUseCase<GetMembersUseCase.Params, MemberPageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val search: String? = null,
        val status: String? = null
    )

    override suspend fun execute(params: Params): Result<MemberPageResponse> {
        return repository.getMembers(
            page = params.page,
            size = params.size,
            search = params.search,
            status = params.status
        )
    }
}
